import { Icon, icon, Link } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { billingAccountIconSize, getBillingAccountIconProps } from 'src/billing/utils';
import { IdContainer } from 'src/components/common';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import {
  BillingProject,
  GoogleBillingAccount,
  isAzureBillingProject,
  isGoogleBillingProject,
} from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import Events, { extractBillingDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { memoWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/workspaces/utils';

const workspaceLastModifiedWidth = 150;
const workspaceExpandIconSize = 20;

const WorkspaceCardHeaders = memoWithName('WorkspaceCardHeaders', ({ needsStatusColumn, sort, onSort }) => {
  return div(
    {
      role: 'row',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '1.5rem',
        padding: '0 1rem',
        marginBottom: '0.5rem',
      },
    },
    [
      needsStatusColumn &&
        div({ style: { width: billingAccountIconSize } }, [div({ className: 'sr-only' }, ['Status'])]),
      div(
        {
          role: 'columnheader',
          'aria-sort': ariaSort(sort, 'name'),
          style: { flex: 1, paddingLeft: needsStatusColumn ? '1rem' : '2rem' },
        },
        [h(HeaderRenderer, { sort, onSort, name: 'name' })]
      ),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'createdBy'), style: { flex: 1 } }, [
        h(HeaderRenderer, { sort, onSort, name: 'createdBy' }),
      ]),
      div(
        {
          role: 'columnheader',
          'aria-sort': ariaSort(sort, 'lastModified'),
          style: { flex: `0 0 ${workspaceLastModifiedWidth}px` },
        },
        [h(HeaderRenderer, { sort, onSort, name: 'lastModified' })]
      ),
      div({ style: { flex: `0 0 ${workspaceExpandIconSize}px` } }, [div({ className: 'sr-only' }, ['Expand'])]),
    ]
  );
});

interface ExpandedInfoRowProps {
  title: string;
  details: string | undefined;
  errorMessage?: string;
}
const ExpandedInfoRow = (props: ExpandedInfoRowProps) => {
  const { title, details, errorMessage } = props;
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

interface WorkspaceCardProps {
  workspace: WorkspaceInfo;
  billingAccountDisplayName: string | undefined;
  billingProject: BillingProject;
  billingAccountStatus: string;
  isExpanded: boolean;
  onExpand: () => void;
}

const WorkspaceCard = memoWithName('WorkspaceCard', (props: WorkspaceCardProps) => {
  const { workspace, billingProject, billingAccountStatus, billingAccountDisplayName, isExpanded, onExpand } = props;
  const { namespace, name, createdBy, lastModified, googleProject, errorMessage } = workspace;
  const workspaceCardStyles = {
    field: {
      ...Style.noWrapEllipsis,
      flex: 1,
      height: '1.20rem',
      width: `calc(50% - ${(workspaceLastModifiedWidth + workspaceExpandIconSize) / 2}px)`,
      paddingRight: '1rem',
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
    expandedInfoContainer: { display: 'flex', flexDirection: 'column', width: '100%' } satisfies CSSProperties,
  };

  return div({ role: 'row', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    h(IdContainer, [
      (id) =>
        h(Fragment, [
          div({ style: workspaceCardStyles.row }, [
            billingAccountStatus && Icon(getBillingAccountIconProps(billingAccountStatus)),
            div(
              {
                role: 'rowheader',
                style: {
                  ...workspaceCardStyles.field,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: billingAccountStatus ? '1rem' : '2rem',
                },
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
            div({ role: 'cell', style: { height: '1rem', flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [
              Utils.makeStandardDate(lastModified),
            ]),
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
            div(
              { id, style: { ...workspaceCardStyles.row, padding: '0.5rem', border: `1px solid ${colors.light()}` } },
              [
                div({ style: workspaceCardStyles.expandedInfoContainer }, [
                  isGoogleBillingProject(billingProject) &&
                    h(ExpandedInfoRow, { title: 'Google Project', details: googleProject }),
                  isGoogleBillingProject(billingProject) &&
                    h(ExpandedInfoRow, { title: 'Billing Account', details: billingAccountDisplayName, errorMessage }),
                  isAzureBillingProject(billingProject) &&
                    h(ExpandedInfoRow, {
                      title: 'Resource Group ID',
                      details: billingProject.managedAppCoordinates.managedResourceGroupId,
                    }),
                ]),
              ]
            ),
        ]),
    ]),
  ]);
});

interface WorkspacesProps {
  billingProject: BillingProject;
  workspacesInProject: WorkspaceInfo[];
  billingAccounts: Record<string, GoogleBillingAccount>;
  billingAccountsOutOfDate: boolean;
  groups: Record<string, Set<WorkspaceInfo>>;
}

export const Workspaces = (props: WorkspacesProps): ReactNode => {
  const { billingAccounts, billingAccountsOutOfDate, billingProject, groups, workspacesInProject } = props;
  const [workspaceSort, setWorkspaceSort] = useState({ field: 'name', direction: 'asc' });
  const [expandedWorkspaceName, setExpandedWorkspaceName] = useState<string>();

  const getBillingAccountStatus = (workspace: WorkspaceInfo) => _.findKey((g) => g.has(workspace), groups);

  return h(Fragment, [
    _.isEmpty(workspacesInProject)
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
              // @ts-ignore
              _.orderBy([workspaceSort.field], [workspaceSort.direction]),
              _.map((workspace: WorkspaceInfo) => {
                const isExpanded = expandedWorkspaceName === workspace.name;
                return h(WorkspaceCard, {
                  workspace,
                  billingAccountDisplayName: isGoogleWorkspaceInfo(workspace)
                    ? billingAccounts[workspace.billingAccount]?.displayName
                    : undefined,
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
  ]);
};
