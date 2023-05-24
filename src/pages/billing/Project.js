import _ from 'lodash/fp';
import * as qs from 'qs';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, customSpinnerOverlay, IdContainer, Link, Select } from 'src/components/common';
import { DeleteUserModal, EditUserModal, MemberCard, MemberCardHeaders, NewUserCard, NewUserModal } from 'src/components/group-common';
import { icon } from 'src/components/icons';
import { TextInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import Modal from 'src/components/Modal';
import { InfoBox, MenuTrigger } from 'src/components/PopupTrigger';
import { SimpleTabBar } from 'src/components/tabBars';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import * as Auth from 'src/libs/auth';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import Events, { extractBillingDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { memoWithName, useCancellation, useGetter, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { contactUsActive } from 'src/libs/state';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import { topBarHeight } from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { billingRoles } from 'src/pages/billing/billing-utils';
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import { SpendReport } from 'src/pages/billing/SpendReport/SpendReport';
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';

const workspaceLastModifiedWidth = 150;
const workspaceExpandIconSize = 20;
const billingAccountIconSize = 16;

const billingAccountIcons = {
  updating: { shape: 'sync', color: colors.warning() },
  done: { shape: 'check', color: colors.accent() },
  error: { shape: 'warning-standard', color: colors.danger() },
};

const getBillingAccountIcon = (status) => {
  const { shape, color } = billingAccountIcons[status];
  return icon(shape, { size: billingAccountIconSize, color });
};

const accountLinkStyle = { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', marginTop: '0.5rem', marginLeft: '1rem' };

const WorkspaceCardHeaders = memoWithName('WorkspaceCardHeaders', ({ needsStatusColumn, sort, onSort }) => {
  return div(
    { role: 'row', style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem', marginBottom: '0.5rem' } },
    [
      needsStatusColumn && div({ style: { width: billingAccountIconSize } }, [div({ className: 'sr-only' }, ['Status'])]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'name'), style: { flex: 1, paddingLeft: needsStatusColumn ? '1rem' : '2rem' } }, [
        h(HeaderRenderer, { sort, onSort, name: 'name' }),
      ]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'createdBy'), style: { flex: 1 } }, [
        h(HeaderRenderer, { sort, onSort, name: 'createdBy' }),
      ]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'lastModified'), style: { flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [
        h(HeaderRenderer, { sort, onSort, name: 'lastModified' }),
      ]),
      div({ style: { flex: `0 0 ${workspaceExpandIconSize}px` } }, [div({ className: 'sr-only' }, ['Expand'])]),
    ]
  );
});

const ExpandedInfoRow = ({ title, details, errorMessage }) => {
  const expandedInfoStyles = {
    row: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' },
    title: { fontWeight: 600, padding: '0.5rem 1rem 0 2rem', height: '1rem' },
    details: { flexGrow: 1, marginTop: '0.5rem', height: '1rem', ...Style.noWrapEllipsis },
    errorMessage: {
      flexGrow: 2,
      padding: '0.5rem',
      backgroundColor: colors.light(0.3),
      border: `solid 2px ${colors.danger(0.3)}`,
      borderRadius: 5,
    },
  };

  return div({ style: expandedInfoStyles.row }, [
    div({ style: expandedInfoStyles.title }, [title]),
    div({ style: expandedInfoStyles.details }, [details]),
    errorMessage && div({ style: expandedInfoStyles.errorMessage }, [errorMessage]),
  ]);
};

const WorkspaceCard = memoWithName('WorkspaceCard', ({ workspace, billingProject, billingAccountStatus, isExpanded, onExpand }) => {
  const { namespace, name, createdBy, lastModified, googleProject, billingAccountDisplayName, errorMessage } = workspace;
  const workspaceCardStyles = {
    field: {
      ...Style.noWrapEllipsis,
      flex: 1,
      height: '1.20rem',
      width: `calc(50% - ${(workspaceLastModifiedWidth + workspaceExpandIconSize) / 2}px)`,
      paddingRight: '1rem',
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
    expandedInfoContainer: { display: 'flex', flexDirection: 'column', width: '100%' },
  };

  return div({ role: 'row', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    h(IdContainer, [
      (id) =>
        h(Fragment, [
          div({ style: workspaceCardStyles.row }, [
            billingAccountStatus && getBillingAccountIcon(billingAccountStatus),
            div(
              {
                role: 'rowheader',
                style: { ...workspaceCardStyles.field, display: 'flex', alignItems: 'center', paddingLeft: billingAccountStatus ? '1rem' : '2rem' },
              },
              [
                h(
                  Link,
                  {
                    style: Style.noWrapEllipsis,
                    href: Nav.getLink('workspace-dashboard', { namespace, name }),
                    onClick: () => {
                      Ajax().Metrics.captureEvent(Events.billingProjectGoToWorkspace, {
                        workspaceName: name,
                        ...extractBillingDetails(billingProject),
                      });
                    },
                  },
                  [name]
                ),
              ]
            ),
            div({ role: 'cell', style: workspaceCardStyles.field }, [createdBy]),
            div({ role: 'cell', style: { height: '1rem', flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [Utils.makeStandardDate(lastModified)]),
            div({ style: { flex: `0 0 ${workspaceExpandIconSize}px` } }, [
              h(
                Link,
                {
                  'aria-label': `expand workspace ${name}`,
                  'aria-expanded': isExpanded,
                  'aria-controls': isExpanded ? id : undefined,
                  'aria-owns': isExpanded ? id : undefined,
                  style: { display: 'flex', alignItems: 'center' },
                  onClick: () => {
                    Ajax().Metrics.captureEvent(Events.billingProjectExpandWorkspace, {
                      workspaceName: name,
                      ...extractBillingDetails(billingProject),
                    });
                    onExpand();
                  },
                },
                [icon(isExpanded ? 'angle-up' : 'angle-down', { size: workspaceExpandIconSize })]
              ),
            ]),
          ]),
          isExpanded &&
            div({ id, style: { ...workspaceCardStyles.row, padding: '0.5rem', border: `1px solid ${colors.light()}` } }, [
              div({ style: workspaceCardStyles.expandedInfoContainer }, [
                billingProject.cloudPlatform === cloudProviders.gcp.label && h(ExpandedInfoRow, { title: 'Google Project', details: googleProject }),
                billingProject.cloudPlatform === cloudProviders.gcp.label &&
                  h(ExpandedInfoRow, { title: 'Billing Account', details: billingAccountDisplayName, errorMessage }),
                billingProject.cloudPlatform === cloudProviders.azure.label &&
                  h(ExpandedInfoRow, { title: 'Resource Group ID', details: billingProject.managedAppCoordinates.managedResourceGroupId }),
              ]),
            ]),
        ]),
    ]),
  ]);
});

const BillingAccountSummaryPanel = ({ counts: { done, error, updating } }) => {
  const StatusAndCount = ({ status, count }) =>
    div({ style: { display: 'float' } }, [
      div({ style: { float: 'left' } }, [getBillingAccountIcon(status)]),
      div({ style: { float: 'left', marginLeft: '0.5rem' } }, [`${status} (${count})`]),
    ]);

  const maybeAddStatus = (status, count) => count > 0 && div({ style: { marginRight: '2rem' } }, [h(StatusAndCount, { status, count })]);

  return div(
    {
      style: {
        padding: '0.5rem 2rem 1rem',
        position: 'absolute',
        top: topBarHeight,
        right: '3rem',
        width: '30rem',
        backgroundColor: colors.light(0.5),
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
      },
    },
    [
      div({ style: { padding: '1rem 0' } }, 'Your billing account is updating...'),
      div({ style: { display: 'flex', justifyContent: 'flex-start' } }, [
        maybeAddStatus('updating', updating),
        maybeAddStatus('done', done),
        maybeAddStatus('error', error),
      ]),
      error > 0 &&
        div({ style: { padding: '1rem 0 0' } }, [
          'Try again or ',
          h(Link, { onClick: () => contactUsActive.set(true) }, ['contact us regarding unresolved errors']),
          '.',
        ]),
    ]
  );
};

const groupByBillingAccountStatus = (billingProject, workspaces) => {
  const group = (workspace) =>
    Utils.cond(
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
  return _.mapValues((ws) => new Set(ws), _.groupBy(group, workspaces));
};

const spendReportKey = 'spend report';

const GcpBillingAccountControls = ({
  authorizeAndLoadAccounts,
  billingAccounts,
  billingProject,
  isOwner,
  getShowBillingModal,
  setShowBillingModal,
  reloadBillingProject,
  setUpdating,
}) => {
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
  )(() =>
    Ajax(signal).Billing.updateSpendConfiguration({
      billingProjectName: billingProject.projectName,
      datasetGoogleProject: selectedDatasetProjectName,
      datasetName: selectedDatasetName,
    })
  );

  // (CA-1586) For some reason the api sometimes returns string null, and sometimes returns no field, and sometimes returns null. This is just to be complete.
  const billingProjectHasBillingAccount = !(billingProject.billingAccount === 'null' || _.isNil(billingProject.billingAccount));
  const billingAccount = billingProjectHasBillingAccount ? _.find({ accountName: billingProject.billingAccount }, billingAccounts) : undefined;

  const billingAccountDisplayText = Utils.cond(
    [!billingProjectHasBillingAccount, () => 'No linked billing account'],
    [!billingAccount, () => 'No access to linked billing account'],
    () => billingAccount.displayName || billingAccount.accountName
  );

  return h(Fragment, [
    Auth.hasBillingScope() &&
      div({ style: accountLinkStyle }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, margin: '0 0.75rem 0 0' } }, 'Billing Account:'),
        span({ style: { flexShrink: 0, marginRight: '0.5rem' } }, billingAccountDisplayText),
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
                    h(Select, {
                      id,
                      value: selectedBilling || billingProject.billingAccount,
                      isClearable: false,
                      options: _.map(({ displayName, accountName }) => ({ label: displayName, value: accountName }), billingAccounts),
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
            [div({ style: { marginTop: '1rem' } }, ["Are you sure you want to remove this billing project's billing account?"])]
          ),
      ]),
    Auth.hasBillingScope() &&
      isOwner &&
      div({ style: accountLinkStyle }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, marginRight: '0.75rem' } }, 'Spend Report Configuration:'),
        span({ style: { flexShrink: 0 } }, 'Edit'),
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
                    await updateSpendConfiguration(billingProject.projectName, selectedDatasetProjectName, selectedDatasetName);
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
                      h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360037862771', ...Utils.newTabLinkProps }, ['our documentation']),
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

const ProjectDetail = ({
  authorizeAndLoadAccounts,
  billingAccounts,
  billingProject,
  isOwner,
  reloadBillingProject,
  workspaces,
  refreshWorkspaces,
}) => {
  // State
  const { query } = Nav.useRoute();
  // Rather than using a localized StateHistory store here, we use the existing `workspaceStore` value (via the `useWorkspaces` hook)

  const [projectUsers, setProjectUsers] = useState(() => StateHistory.get().projectUsers || []);
  const projectOwners = _.filter(_.flow(_.get('roles'), _.includes(billingRoles.owner)), projectUsers);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [tab, setTab] = useState(query.tab || 'workspaces');
  const [expandedWorkspaceName, setExpandedWorkspaceName] = useState();
  const [sort, setSort] = useState({ field: 'email', direction: 'asc' });
  const [workspaceSort, setWorkspaceSort] = useState({ field: 'name', direction: 'asc' });

  const signal = useCancellation();

  const projectHasMultipleOwners = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1;

  const workspacesInProject = useMemo(
    () => _.filter({ namespace: billingProject.projectName }, _.map('workspace', workspaces)),
    [billingProject, workspaces]
  );

  const groups = groupByBillingAccountStatus(billingProject, workspacesInProject);
  const billingAccountsOutOfDate = !(_.isEmpty(groups.error) && _.isEmpty(groups.updating));
  const getBillingAccountStatus = (workspace) => _.findKey((g) => g.has(workspace), groups);

  const isGcpProject = billingProject.cloudPlatform === cloudProviders.gcp.label;
  const isAzureProject = billingProject.cloudPlatform === cloudProviders.azure.label;

  const tabToTable = {
    workspaces: h(Fragment, [
      !_.isUndefined(workspaces) && _.isEmpty(workspacesInProject)
        ? div({ style: { ...Style.cardList.longCardShadowless, width: 'fit-content' } }, [
            span({ 'aria-hidden': 'true' }, ['Use this Terra billing project to create']),
            h(
              Link,
              {
                'aria-label': 'Use this Terra billing project to create workspaces',
                style: { marginLeft: '0.3em', textDecoration: 'underline' },
                href: Nav.getLink('workspaces'),
              },
              ['Workspaces']
            ),
          ])
        : !_.isEmpty(workspacesInProject) &&
          div({ role: 'table', 'aria-label': `workspaces in billing project ${billingProject.projectName}` }, [
            h(WorkspaceCardHeaders, {
              needsStatusColumn: billingAccountsOutOfDate,
              sort: workspaceSort,
              onSort: setWorkspaceSort,
            }),
            div({}, [
              _.flow(
                _.orderBy([workspaceSort.field], [workspaceSort.direction]),
                _.map((workspace) => {
                  const isExpanded = expandedWorkspaceName === workspace.name;
                  return h(WorkspaceCard, {
                    workspace: { ...workspace, billingAccountDisplayName: billingAccounts[workspace.billingAccount]?.displayName },
                    billingProject,
                    billingAccountStatus: billingAccountsOutOfDate && getBillingAccountStatus(workspace),
                    key: workspace.workspaceId,
                    isExpanded,
                    onExpand: () => setExpandedWorkspaceName(isExpanded ? undefined : workspace.name),
                  });
                })
              )(workspacesInProject),
            ]),
          ]),
    ]),
    members: h(Fragment, [
      isOwner &&
        h(
          NewUserCard,
          {
            onClick: () => setAddingUser(true),
          },
          [icon('plus-circle', { size: 14 }), div({ style: { marginLeft: '0.5rem' } }, ['Add User'])]
        ),
      div({ role: 'table', 'aria-label': `users in billing project ${billingProject.projectName}` }, [
        h(MemberCardHeaders, { sort, onSort: setSort }),
        div(
          _.map((member) => {
            return h(MemberCard, {
              key: member.email,
              adminLabel: billingRoles.owner,
              userLabel: billingRoles.user,
              member,
              adminCanEdit: projectHasMultipleOwners && isOwner,
              onEdit: () => setEditingUser(member),
              onDelete: () => setDeletingUser(member),
              isOwner,
            });
          }, _.orderBy([sort.field], [sort.direction], projectUsers))
        ),
      ]),
    ]),
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
        _.capitalize(key === 'members' && !isOwner ? 'owners' : key), // Rewrite the 'Members' tab to say 'Owners' if the user has the User role
      ]),
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

  const collectUserRoles = _.flow(
    _.groupBy('email'),
    _.entries,
    _.map(([email, members]) => ({ email, roles: _.map('role', members) })),
    _.sortBy('email')
  );

  const reloadBillingProjectUsers = _.flow(
    reportErrorAndRethrow('Error loading billing project users list'),
    Utils.withBusyState(setUpdating)
  )(() => Ajax(signal).Billing.listProjectUsers(billingProject.projectName).then(collectUserRoles).then(setProjectUsers));

  const removeUserFromBillingProject = _.flow(
    reportErrorAndRethrow('Error removing member from billing project'),
    Utils.withBusyState(setUpdating)
  )(_.partial(Ajax().Billing.removeProjectUser, [billingProject.projectName]));

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
  usePollingEffect(() => !getShowBillingModal() && getBillingAccountsOutOfDate() && refreshWorkspaces(), { ms: 5000 });

  return h(Fragment, [
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
        billingProject.projectName,
      ]),
      isGcpProject &&
        h(GcpBillingAccountControls, {
          authorizeAndLoadAccounts,
          billingAccounts,
          billingProject,
          isOwner,
          getShowBillingModal,
          setShowBillingModal,
          reloadBillingProject,
          setUpdating,
        }),
      isAzureProject &&
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
              backgroundColor: colors.warning(0.15),
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
    addingUser &&
      h(NewUserModal, {
        adminLabel: billingRoles.owner,
        userLabel: billingRoles.user,
        title: 'Add user to Billing Project',
        footer: 'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
        addFunction: _.partial(Ajax().Billing.addProjectUser, [billingProject.projectName]),
        onDismiss: () => setAddingUser(false),
        onSuccess: () => {
          setAddingUser(false);
          reloadBillingProjectUsers();
        },
      }),
    editingUser &&
      h(EditUserModal, {
        adminLabel: billingRoles.owner,
        userLabel: billingRoles.user,
        user: editingUser,
        saveFunction: _.partial(Ajax().Billing.changeUserRoles, [billingProject.projectName]),
        onDismiss: () => setEditingUser(false),
        onSuccess: () => {
          setEditingUser(false);
          reloadBillingProject().then(reloadBillingProjectUsers);
        },
      }),
    !!deletingUser &&
      h(DeleteUserModal, {
        userEmail: deletingUser.email,
        onDismiss: () => setDeletingUser(false),
        onSubmit: () => {
          setDeletingUser(false);
          removeUserFromBillingProject(deletingUser.roles, deletingUser.email).then(reloadBillingProject).then(reloadBillingProjectUsers);
        },
      }),
    billingAccountsOutOfDate && h(BillingAccountSummaryPanel, { counts: _.mapValues(_.size, groups) }),
    updating && customSpinnerOverlay({ height: '100vh', width: '100vw', position: 'fixed' }),
  ]);
};

export default ProjectDetail;
