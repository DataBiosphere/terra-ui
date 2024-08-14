import { ButtonPrimary, icon, Link, Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import * as Auth from 'src/auth/auth';
import { accountLinkStyle } from 'src/billing/utils';
import { IdContainer, VirtualizedSelect } from 'src/components/common';
import { TextInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { Ajax } from 'src/libs/ajax';
import { GCPBillingProject, GoogleBillingAccount } from 'src/libs/ajax/Billing';
import { reportErrorAndRethrow } from 'src/libs/error';
import Events, { extractBillingDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import { useCancellation } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

interface BillingAccountControlsProps {
  authorizeAndLoadAccounts: () => Promise<void>;
  billingAccounts: Record<string, GoogleBillingAccount>;
  billingProject: GCPBillingProject;
  isOwner: boolean;
  getShowBillingModal: () => boolean;
  setShowBillingModal: (v: boolean) => void;
  reloadBillingProject: () => void;
  setUpdating: (v: boolean) => void;
}
export const BillingAccountControls = (props: BillingAccountControlsProps) => {
  const {
    authorizeAndLoadAccounts,
    billingAccounts,
    billingProject,
    isOwner,
    getShowBillingModal,
    setShowBillingModal,
    reloadBillingProject,
    setUpdating,
  } = props;
  const [showBillingRemovalModal, setShowBillingRemovalModal] = useState(false);
  const [showSpendReportConfigurationModal, setShowSpendReportConfigurationModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState();
  const [selectedDatasetProjectName, setSelectedDatasetProjectName] = useState(null);
  const [selectedDatasetName, setSelectedDatasetName] = useState(null);

  const signal = useCancellation();

  // Helpers
  const setBillingAccount = _.flow(
    reportErrorAndRethrow('Error updating billing account'),
    Utils.withBusyState(setUpdating)
  )((newAccountName) => {
    Ajax().Metrics.captureEvent(Events.billingChangeAccount, {
      oldName: billingProject.billingAccount,
      newName: newAccountName,
      ...extractBillingDetails(billingProject),
    });
    return Ajax(signal).Billing.changeBillingAccount({
      billingProjectName: billingProject.projectName,
      newBillingAccountName: newAccountName,
    });
  });

  const removeBillingAccount = _.flow(
    reportErrorAndRethrow('Error removing billing account'),
    Utils.withBusyState(setUpdating)
  )(() => {
    Ajax().Metrics.captureEvent(Events.billingRemoveAccount, extractBillingDetails(billingProject));
    return Ajax(signal).Billing.removeBillingAccount({
      billingProjectName: billingProject.projectName,
    });
  });

  const updateSpendConfiguration = _.flow(
    reportErrorAndRethrow('Error updating spend report configuration'),
    Utils.withBusyState(setUpdating)
  )(() => {
    Ajax().Metrics.captureEvent(Events.billingSpendConfigurationUpdated, {
      datasetGoogleProject: selectedDatasetProjectName,
      datasetName: selectedDatasetName,
      ...extractBillingDetails(billingProject),
    });
    return Ajax(signal).Billing.updateSpendConfiguration({
      billingProjectName: billingProject.projectName,
      datasetGoogleProject: selectedDatasetProjectName,
      datasetName: selectedDatasetName,
    });
  });

  // (CA-1586) For some reason the api sometimes returns string null, and sometimes returns no field, and sometimes returns null. This is just to be complete.
  const billingProjectHasBillingAccount = !(
    billingProject.billingAccount === 'null' || _.isNil(billingProject.billingAccount)
  );
  const billingAccount = billingProjectHasBillingAccount
    ? _.find({ accountName: billingProject.billingAccount }, billingAccounts)
    : undefined;

  const billingAccountDisplayText = Utils.cond(
    [!billingProjectHasBillingAccount, () => 'No linked billing account'],
    [!billingAccount, () => 'No access to linked billing account'],
    () => billingAccount!.displayName || billingAccount!.accountName
  );

  return h(Fragment, [
    Auth.hasBillingScope() &&
      div({ style: accountLinkStyle }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, margin: '0 0.75rem 0 0' } }, [
          'Billing Account:',
        ]),
        span({ style: { flexShrink: 0, marginRight: '0.5rem' } }, [billingAccountDisplayText]),
        isOwner &&
          h(
            MenuTrigger,
            {
              closeOnClick: true,
              side: 'bottom',
              style: { marginLeft: '0.5rem' },
              content: h(Fragment, [
                h(
                  MenuButton,
                  {
                    onClick: async () => {
                      if (Auth.hasBillingScope()) {
                        setShowBillingModal(true);
                      } else {
                        await authorizeAndLoadAccounts();
                        setShowBillingModal(Auth.hasBillingScope());
                      }
                    },
                  },
                  ['Change Billing Account']
                ),
                h(
                  MenuButton,
                  {
                    onClick: async () => {
                      if (Auth.hasBillingScope()) {
                        setShowBillingRemovalModal(true);
                      } else {
                        await authorizeAndLoadAccounts();
                        setShowBillingRemovalModal(Auth.hasBillingScope());
                      }
                    },
                    disabled: !billingProjectHasBillingAccount,
                  },
                  ['Remove Billing Account']
                ),
              ]),
            },
            [
              h(Link, { 'aria-label': 'Billing account menu', style: { display: 'flex', alignItems: 'center' } }, [
                icon('cardMenuIcon', { size: 16, 'aria-haspopup': 'menu' }),
              ]),
            ]
          ),
        getShowBillingModal() &&
          h(
            Modal,
            {
              title: 'Change Billing Account',
              onDismiss: () => setShowBillingModal(false),
              okButton: h(
                ButtonPrimary,
                {
                  disabled: !selectedBilling || billingProject.billingAccount === selectedBilling,
                  onClick: () => {
                    setShowBillingModal(false);
                    setBillingAccount(selectedBilling).then(reloadBillingProject);
                  },
                },
                ['Ok']
              ),
            },
            [
              h(IdContainer, [
                (id) =>
                  h(Fragment, [
                    h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
                    h(VirtualizedSelect, {
                      id,
                      value: selectedBilling || billingProject.billingAccount,
                      isClearable: false,
                      options: _.map(
                        ({ displayName, accountName }) => ({ label: displayName, value: accountName }),
                        billingAccounts
                      ),
                      onChange: ({ value: newAccountName }) => setSelectedBilling(newAccountName),
                    }),
                    div({ style: { marginTop: '1rem' } }, [
                      'Note: Changing the billing account for this billing project will clear the spend report configuration.',
                    ]),
                  ]),
              ]),
            ]
          ),
        showBillingRemovalModal &&
          h(
            Modal,
            {
              title: 'Remove Billing Account',
              onDismiss: () => setShowBillingRemovalModal(false),
              okButton: h(
                ButtonPrimary,
                {
                  onClick: () => {
                    setShowBillingRemovalModal(false);
                    removeBillingAccount(selectedBilling).then(reloadBillingProject);
                  },
                },
                ['Ok']
              ),
            },
            [
              div({ style: { marginTop: '1rem' } }, [
                "Are you sure you want to remove this billing project's billing account?",
              ]),
            ]
          ),
      ]),
    Auth.hasBillingScope() &&
      isOwner &&
      div({ style: accountLinkStyle }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, marginRight: '0.75rem' } }, [
          'Spend Report Configuration:',
        ]),
        span({ style: { flexShrink: 0 } }, ['Edit']),
        h(
          Link,
          {
            tooltip: 'Configure Spend Reporting',
            style: { marginLeft: '0.5rem' },
            onClick: async () => {
              if (Auth.hasBillingScope()) {
                setShowSpendReportConfigurationModal(true);
              } else {
                await authorizeAndLoadAccounts();
                setShowSpendReportConfigurationModal(Auth.hasBillingScope());
              }
            },
          },
          [icon('edit', { size: 12 })]
        ),
        showSpendReportConfigurationModal &&
          h(
            Modal,
            {
              title: 'Configure Spend Reporting',
              onDismiss: () => setShowSpendReportConfigurationModal(false),
              okButton: h(
                ButtonPrimary,
                {
                  disabled: !selectedDatasetProjectName || !selectedDatasetName,
                  onClick: async () => {
                    setShowSpendReportConfigurationModal(false);
                    await updateSpendConfiguration(
                      billingProject.projectName,
                      selectedDatasetProjectName,
                      selectedDatasetName
                    );
                  },
                },
                ['Ok']
              ),
            },
            [
              h(IdContainer, [
                (id) =>
                  h(Fragment, [
                    h(FormLabel, { htmlFor: id, required: true }, ['Dataset Project ID']),
                    h(TextInput, {
                      id,
                      onChange: setSelectedDatasetProjectName,
                    }),
                  ]),
              ]),
              h(IdContainer, [
                (id) =>
                  h(Fragment, [
                    h(FormLabel, { htmlFor: id, required: true }, ['Dataset Name']),
                    h(TextInput, {
                      id,
                      onChange: setSelectedDatasetName,
                    }),
                    div({ style: { marginTop: '1rem' } }, [
                      ['See '],
                      h(
                        Link,
                        { href: 'https://support.terra.bio/hc/en-us/articles/360037862771', ...Utils.newTabLinkProps },
                        ['our documentation']
                      ),
                      [' for details on configuring spend reporting for billing projects.'],
                    ]),
                  ]),
              ]),
            ]
          ),
      ]),
    !Auth.hasBillingScope() &&
      div({ style: accountLinkStyle }, [
        h(
          Link,
          {
            onClick: authorizeAndLoadAccounts,
          },
          ['View billing account']
        ),
      ]),
  ]);
};
