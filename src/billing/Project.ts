import { SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { BillingAccountControls } from 'src/billing/BillingAccount/BillingAccountControls';
import { BillingAccountSummary } from 'src/billing/BillingAccount/BillingAccountSummary';
import { Members } from 'src/billing/Members/Members';
import { ExternalLink } from 'src/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import { SpendReport } from 'src/billing/SpendReport/SpendReport';
import { accountLinkStyle, billingRoles } from 'src/billing/utils';
import { Workspaces } from 'src/billing/Workspaces/Workspaces';
import { Link } from 'src/components/common';
import { User } from 'src/components/group-common';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import { SimpleTabBar } from 'src/components/tabBars';
import { Ajax } from 'src/libs/ajax';
import {
  BillingProject,
  GoogleBillingAccount,
  isAzureBillingProject,
  isGoogleBillingProject,
} from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import Events, { extractBillingDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation, useGetter, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Utils from 'src/libs/utils';
import { WorkspaceInfo } from 'src/workspaces/utils';

export const groupByBillingAccountStatus = (billingProject: BillingProject, workspaces: WorkspaceInfo[]) => {
  const group = (workspace) =>
    Utils.cond(
      // @ts-ignore
      [billingProject.billingAccount === workspace.billingAccount, () => 'done'],
      [!!workspace.errorMessage, () => 'error'],
      [Utils.DEFAULT, () => 'updating']
    );

  // Return Sets to reduce the time complexity of searching for the status of any workspace from
  // O(N * W) to O(N * 1), where
  //   N is the number of statuses a billing account change could have,
  //   W is the number of workspaces in a billing project (can be very large for GP).
  // Note we need to perform this search W times for each billing project; using a set reduces time
  // complexity by an order of magnitude.
  // @ts-ignore
  return _.mapValues((ws) => new Set(ws), _.groupBy(group, workspaces));
};

const spendReportKey = 'spend report';

interface ProjectDetailProps {
  authorizeAndLoadAccounts: () => Promise<void>;
  billingAccounts: Record<string, GoogleBillingAccount>;
  billingProject: BillingProject;
  isOwner: boolean;
  reloadBillingProject: () => Promise<void>;
  workspaces: WorkspaceInfo[];
  refreshWorkspaces: () => void;
}

const ProjectDetail = (props: ProjectDetailProps): ReactNode => {
  const {
    authorizeAndLoadAccounts,
    billingAccounts,
    billingProject,
    isOwner,
    reloadBillingProject,
    workspaces,
    refreshWorkspaces,
  } = props;
  // State
  const { query } = Nav.useRoute();
  // Rather than using a localized StateHistory store here, we use the existing `workspaceStore` value (via the `useWorkspaces` hook)

  const [projectUsers, setProjectUsers] = useState(() => StateHistory.get().projectUsers || []);
  const projectOwners: User[] = _.filter(_.flow(_.get('roles'), _.includes(billingRoles.owner)), projectUsers);

  const [updating, setUpdating] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [tab, setTab] = useState(query.tab || 'workspaces');

  const workspacesInProject = useMemo(
    () => _.filter({ namespace: billingProject.projectName }, _.map('workspace', workspaces)),
    [billingProject, workspaces]
  );

  const groups = groupByBillingAccountStatus(billingProject, workspacesInProject);
  const billingAccountsOutOfDate = !(_.isEmpty(groups.error) && _.isEmpty(groups.updating));

  const signal = useCancellation();

  const collectUserRoles = _.flow(
    _.groupBy('email'),
    _.entries,
    _.map(([email, members]) => ({ email, roles: _.map('role', members) })),
    _.sortBy('email')
  );

  const reloadBillingProjectUsers = _.flow(
    reportErrorAndRethrow('Error loading billing project users list'),
    Utils.withBusyState(setUpdating)
  )(() =>
    Ajax(signal).Billing.listProjectUsers(billingProject.projectName).then(collectUserRoles).then(setProjectUsers)
  );

  const removeUserFromBillingProject = _.flow(
    reportErrorAndRethrow('Error removing member from billing project'),
    Utils.withBusyState(setUpdating)
  )(_.partial(Ajax().Billing.removeProjectUser, [billingProject.projectName]));

  const tabToTable = {
    workspaces: h(Workspaces, {
      billingProject,
      workspacesInProject,
      billingAccounts,
      billingAccountsOutOfDate,
      groups,
    }),
    members: h(Members, {
      billingProjectName: billingProject.projectName,
      isOwner,
      projectUsers,
      userAdded: () => reloadBillingProjectUsers(),
      userEdited: () => {
        reloadBillingProject().then(reloadBillingProjectUsers);
      },
      deleteUser: (user) => {
        removeUserFromBillingProject(user.roles, user.email).then(reloadBillingProject).then(reloadBillingProjectUsers);
      },
    }),
    [spendReportKey]: h(SpendReport, {
      billingProjectName: billingProject.projectName,
      cloudPlatform: billingProject.cloudPlatform,
      viewSelected: tab === spendReportKey,
    }),
  };

  const tabs = _.map(
    (key) => ({
      key,
      title: span({ style: { padding: '0 0.5rem' } }, [
        // @ts-ignore
        _.capitalize(key === 'members' && !isOwner ? 'owners' : key), // Rewrite the 'Members' tab to say 'Owners' if the user has the User role
      ]),
      // @ts-ignore
      tableName: _.lowerCase(key),
    }),
    _.filter((key) => key !== spendReportKey || isOwner, _.keys(tabToTable))
  );
  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = qs.stringify(
      {
        ...query,
        tab: tab === tabs[0].key ? undefined : tab,
      },
      { addQueryPrefix: true }
    );

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch });
    }
  });

  // Lifecycle
  useOnMount(() => {
    reloadBillingProjectUsers();
  });

  useEffect(() => {
    StateHistory.update({ projectUsers });
  }, [projectUsers]);

  // usePollingEffect calls the "effect" in a while-loop and binds references once on mount.
  // As such, we need a layer of indirection to get current values.
  const getShowBillingModal = useGetter(showBillingModal);
  const getBillingAccountsOutOfDate = useGetter(billingAccountsOutOfDate);
  // @ts-ignore
  usePollingEffect(() => !getShowBillingModal() && getBillingAccountsOutOfDate() && refreshWorkspaces(), { ms: 5000 });

  return h(Fragment, [
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div(
        {
          style: {
            color: colors.dark(),
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '1rem',
          },
        },
        [billingProject.projectName]
      ),
      isGoogleBillingProject(billingProject) &&
        h(BillingAccountControls, {
          authorizeAndLoadAccounts,
          billingAccounts,
          billingProject,
          isOwner,
          getShowBillingModal,
          setShowBillingModal,
          reloadBillingProject,
          setUpdating,
        }),
      isAzureBillingProject(billingProject) &&
        div({ style: accountLinkStyle }, [
          h(ExternalLink, {
            url: `https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/WLZ-ID/tagValue/${billingProject.landingZoneId}`,
            text: 'View project resources in Azure Portal',
            popoutSize: 14,
          }),
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
            "Project resources can only be viewed when you are logged into the same tenant as the project's Azure subscription.",
            p({ style: { marginBlockEnd: 0 } }, [
              h(ExternalLink, {
                url: `https://portal.azure.com/#@${billingProject.managedAppCoordinates.tenantId}/resource/subscriptions/${billingProject.managedAppCoordinates.subscriptionId}/overview`,
                text: 'View subscription in Azure Portal',
              }),
            ]),
          ]),
        ]),
      _.size(projectUsers) > 1 &&
        _.size(projectOwners) === 1 &&
        div(
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              margin: '1rem 1rem 0',
              padding: '1rem',
              border: `1px solid ${colors.warning()}`,
              backgroundColor: colors.warning(0.1), // needs to be sufficient contrast with link color
            },
          },
          [
            icon('warning-standard', { style: { color: colors.warning(), marginRight: '1ch' } }),
            span(
              isOwner
                ? [
                    'You are the only owner of this shared billing project. Consider adding another owner to ensure someone is able to manage the billing project in case you lose access to your account. ',
                    h(
                      Link,
                      {
                        href: 'https://support.terra.bio/hc/en-us/articles/360047235151-Best-practices-for-managing-shared-funding#h_01EFCZSY6K1CEEBJDH7BCG8RBK',
                        ...Utils.newTabLinkProps,
                      },
                      ['More information about managing shared billing projects.']
                    ),
                  ]
                : [
                    'This shared billing project has only one owner. Consider requesting ',
                    h(Link, { mailto: projectOwners[0].email }, [projectOwners[0].email]),
                    ' to add another owner to ensure someone is able to manage the billing project in case they lose access to their account.',
                  ]
            ),
          ]
        ),
      h(
        SimpleTabBar,
        {
          'aria-label': 'project details',
          metricsPrefix: Events.billingProjectSelectTab,
          metricsData: extractBillingDetails(billingProject),
          style: { marginTop: '2rem', textTransform: 'none', padding: '0 1rem', height: '1.5rem' },
          tabStyle: { borderBottomWidth: 4 },
          value: tab,
          onChange: (newTab) => {
            if (newTab === tab) {
              reloadBillingProjectUsers();
            } else {
              setTab(newTab);
            }
          },
          tabs,
        },
        [
          div(
            {
              style: {
                padding: '1rem 1rem 0',
                backgroundColor: colors.light(),
                flexGrow: 1,
              },
            },
            [tabToTable[tab]]
          ),
        ]
      ),
    ]),
    // @ts-ignore
    billingAccountsOutOfDate && h(BillingAccountSummary, _.mapValues(_.size, groups)),
    updating && h(SpinnerOverlay, { mode: 'FullScreen' }),
  ]);
};

export default ProjectDetail;
