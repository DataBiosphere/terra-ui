import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import SupportRequestWrapper from 'src/components/SupportRequest';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import Events from 'src/libs/events';
import { contactUsActive } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import CreateGCPBillingProject from 'src/pages/billing/CreateGCPBillingProject';
import { GoogleBillingAccount } from 'src/pages/billing/models/GoogleBillingAccount';
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step';
import { StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields';
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader';

interface CreateTerraProjectStepProps {
  isActive: boolean;
  billingAccounts: Record<string, GoogleBillingAccount>;
  refreshed: boolean;
  setRefreshed: (boolean) => void;
  authorizeAndLoadAccounts: () => Promise<void>;
  onSuccess: (string) => void;
}

export const CreateTerraProjectStep = ({
  isActive,
  billingAccounts,
  onSuccess,
  ...props
}: CreateTerraProjectStepProps) => {
  const [billingProjectName, setBillingProjectName] = useState('');
  const [chosenBillingAccount, setChosenBillingAccount] = useState<any>();
  const [isBusy, setIsBusy] = useState(false);
  const [existing, setExisting] = useState<string[]>([]);

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createGCPProject(billingProjectName, chosenBillingAccount.accountName);
      onSuccess(billingProjectName);
    } catch (error: any) {
      if (error?.status === 409) {
        setExisting(_.concat(billingProjectName, existing));
      } else {
        throw error;
      }
    }
  });
  return h(Step, { isActive, style: { height: '22rem' } }, [
    h(StepHeader, { title: 'STEP 4' }),
    h(StepFields, { disabled: !isActive, style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, { style: { width: '65%' } }, [
        'Create a Terra project to connect your Google billing account to Terra. ',
        'Billing projects allow you to manage your workspaces and are required to create one.',
      ]),
      div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' } }, [
        div([
          CreateGCPBillingProject({
            billingAccounts,
            chosenBillingAccount,
            setChosenBillingAccount,
            billingProjectName,
            setBillingProjectName,
            existing,
            disabled: !isActive,
          }),
        ]),
        isActive && _.isEmpty(billingAccounts)
          ? h(NoBillingAccounts, {
              refreshed: props.refreshed,
              setRefreshed: props.setRefreshed,
              authorizeAndLoadAccounts: props.authorizeAndLoadAccounts,
            })
          : div({ style: { display: 'flex', flexDirection: 'column', marginTop: '2.5rem' } }, [
              h(ButtonPrimary, { style: { textTransform: 'none' }, onClick: submit, disabled: !isActive }, [
                'Create Terra Billing Project',
                isBusy && icon('loadingSpinner', { size: 16, style: { color: 'white', marginRight: '0.5rem' } }),
              ]),
              isBusy && div({ role: 'alert', style: { marginTop: '1rem' } }, ['This may take a minute']),
            ]),
      ]),
    ]),
  ]);
};

const NoBillingAccounts = (props: {
  refreshed: boolean;
  setRefreshed: (boolean) => void;
  authorizeAndLoadAccounts: () => Promise<void>;
}) =>
  div(
    {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        margin: '1rem 1rem 0',
        padding: '1rem',
        border: `1px solid ${colors.warning()}`,
        borderRadius: '5px',
        backgroundColor: colors.warning(0.1),
        maxWidth: '45%',
      },
      role: 'alert',
    },
    [
      icon('warning-standard', {
        style: {
          color: colors.warning(),
          height: '1.5rem',
          width: '1.5rem',
          marginRight: '0.5rem',
          marginTop: '0.25rem',
        },
      }),
      // TODO: can we get away without the refreshed prop, and just rely on whether or not we've gotten to this step?
      //   maybe instead of 'refresh step 3', it's just refreshing the login, or something - so we aren't explicitly going back to step 3
      !props.refreshed
        ? div({ style: { paddingInline: '0.5rem', lineHeight: '24px', fontWeight: 500 } }, [
            'You do not have access to any Google Billing Accounts. Please verify that a billing account has been created in the ' +
              'Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your billing account.',
            div({ style: { marginTop: '0.5rem' } }, [
              h(
                Link,
                {
                  style: { textDecoration: 'underline', color: colors.accent() },
                  onClick: async () => {
                    Ajax().Metrics.captureEvent(Events.billingGCPCreationRefreshStep3);
                    await props.authorizeAndLoadAccounts();
                    props.setRefreshed(true);
                  },
                },
                ['Refresh Step 3']
              ),
            ]),
          ])
        : div({ style: { paddingInline: '0.5rem', lineHeight: '24px', fontWeight: 500 } }, [
            'Terra still does not have access to any Google Billing Accounts. Please contact Terra support for additional help.',
            div({ style: { marginTop: '0.5rem' } }, [
              h(
                Link,
                {
                  style: { textDecoration: 'underline', color: colors.accent() },
                  onClick: () => {
                    Ajax().Metrics.captureEvent(Events.billingCreationContactTerraSupport);
                    contactUsActive.set(true);
                  },
                },
                ['Terra support']
              ),
            ]),
          ]),
      contactUsActive.get() && h(SupportRequestWrapper),
    ]
  );
