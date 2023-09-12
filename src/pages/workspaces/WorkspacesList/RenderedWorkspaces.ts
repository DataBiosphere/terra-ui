import _ from 'lodash/fp';
import { FC, Fragment, ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { Link } from 'src/components/common';
import { FirstParagraphMarkdownViewer } from 'src/components/markdown';
import { FlexTable } from 'src/components/table';
import TooltipTrigger from 'src/components/TooltipTrigger';
import {
  NoWorkspacesMessage,
  WorkspaceStarControl,
  WorkspaceSubmissionStatusIcon,
} from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  getCloudProviderFromWorkspace,
  workspaceAccessLevels,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu';
import { CatagorizedWorkspaces } from 'src/pages/workspaces/WorkspacesList/CatagorizedWorkspaces';
import { workspaceSubmissionStatus } from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import { styles, WorkspaceSort } from 'src/pages/workspaces/WorkspacesList/WorkspacesList';
import { WorkspaceTab } from 'src/pages/workspaces/WorkspacesList/WorkspaceTab';

interface RenderedWorkspacesProps {
  workspaces: Workspace[];
  loadingWorkspaces: boolean;
  sort: WorkspaceSort;
  initialFiltered: CatagorizedWorkspaces;
  filteredWorkspaces: CatagorizedWorkspaces;
  tabs: WorkspaceTab[];
  loadingSubmissionStats: boolean;
  setCreatingNewWorkspace: React.Dispatch<boolean>;
  setCloningWorkspaceId: React.Dispatch<string>;
  setDeletingWorkspaceId: React.Dispatch<string>;
  setLockingWorkspaceId: React.Dispatch<string>;
  setSharingWorkspace: React.Dispatch<Workspace>;
  setLeavingWorkspaceId: React.Dispatch<string>;
  setRequestingAccessWorkspaceId: React.Dispatch<string>;

  makeHeaderRenderer: (name: string) => () => ReactNode;
}

export const RenderedWorkspaces: FC<RenderedWorkspacesProps> = ({
  workspaces,
  // sortedWorkspaces,
  loadingWorkspaces,
  setCreatingNewWorkspace,
  tabs,
  initialFiltered,
  filteredWorkspaces,
  loadingSubmissionStats,
  setCloningWorkspaceId,
  setDeletingWorkspaceId,
  setLockingWorkspaceId,
  setSharingWorkspace,
  setLeavingWorkspaceId,
  setRequestingAccessWorkspaceId,
  makeHeaderRenderer,
  sort,
}) => {
  const { query } = Nav.useRoute();
  const tab = query.tab || 'myWorkspaces';
  const currentTab = _.find({ key: tab }, tabs);
  const submissionsFilter = query.submissionsFilter || [];
  const getWorkspace = (id: string): Workspace => _.find({ workspace: { workspaceId: id } }, workspaces)!;

  const {
    profile: { starredWorkspaces },
  } = useStore(authStore);
  const starredWorkspaceIds = _.isEmpty(starredWorkspaces) ? [] : _.split(',', starredWorkspaces);
  const [stars, setStars] = useState(starredWorkspaceIds);
  const [updatingStars, setUpdatingStars] = useState(false);

  const sortedWorkspaces = _.orderBy(
    [
      (ws: Workspace) => _.includes(ws.workspace.workspaceId, starredWorkspaceIds),
      sort.field === 'accessLevel'
        ? (ws: Workspace) => -workspaceAccessLevels.indexOf(ws.accessLevel)
        : `workspace.${sort.field}`,
    ],
    ['desc', sort.direction],
    filteredWorkspaces[tab]
  );

  return div({ style: { flex: 1, backgroundColor: 'white', padding: '0 1rem' } }, [
    h(AutoSizer, [
      ({ width, height }) =>
        h(FlexTable, {
          'aria-label': currentTab?.tableName || 'workspaces',
          width,
          height,
          rowCount: sortedWorkspaces.length,
          noContentRenderer: () =>
            Utils.cond(
              [loadingWorkspaces, () => h(Fragment, ['Loading...'])],
              [
                _.isEmpty(initialFiltered.myWorkspaces) && tab === 'myWorkspaces',
                () =>
                  NoWorkspacesMessage({
                    onClick: () => setCreatingNewWorkspace(true),
                  }),
              ],
              [
                !_.isEmpty(submissionsFilter) && loadingSubmissionStats,
                () => h(Fragment, ['Loading submission statuses...']),
              ],
              () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
            ),
          variant: 'light',
          rowHeight: 70,
          sort,
          columns: [
            {
              field: 'starred',
              headerRenderer: () => div({ className: 'sr-only' }, ['Starred']),
              cellRenderer: ({ rowIndex }) => {
                const workspace = sortedWorkspaces[rowIndex];
                return div(
                  {
                    style: {
                      ...styles.tableCellContainer,
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                    },
                  },
                  [
                    h(WorkspaceStarControl, {
                      workspace,
                      setStars,
                      style: {},
                      updatingStars,
                      setUpdatingStars,
                      stars,
                    }),
                  ]
                );
              },
              size: { basis: 40, grow: 0, shrink: 0 },
            },
            {
              field: 'name',
              headerRenderer: makeHeaderRenderer('name'),
              cellRenderer: ({ rowIndex }) => {
                const {
                  accessLevel,
                  workspace,
                  workspace: { workspaceId, namespace, name, attributes },
                } = sortedWorkspaces[rowIndex];
                const description = attributes?.description;
                const canView = Utils.canRead(accessLevel);
                const canAccessWorkspace = () => (!canView ? setRequestingAccessWorkspaceId(workspaceId) : undefined);

                return div({ style: styles.tableCellContainer }, [
                  div({ style: styles.tableCellContent }, [
                    h(
                      Link,
                      {
                        'aria-haspopup': canView ? undefined : 'dialog',
                        style: {
                          ...(canView ? {} : { color: colors.dark(0.8), fontStyle: 'italic' }),
                          fontWeight: 600,
                          fontSize: 16,
                          ...Style.noWrapEllipsis,
                        },
                        href: canView ? Nav.getLink('workspace-dashboard', { namespace, name }) : undefined,
                        onClick: () => {
                          canAccessWorkspace();
                          !!canView &&
                            Ajax().Metrics.captureEvent(
                              Events.workspaceOpenFromList,
                              extractWorkspaceDetails(workspace)
                            );
                        },
                        tooltip:
                          !canView &&
                          'You cannot access this workspace because it is protected by an Authorization Domain. Click to learn about gaining access.',
                        tooltipSide: 'right',
                      },
                      [name]
                    ),
                  ]),
                  div({ style: { ...styles.tableCellContent } }, [
                    h(
                      FirstParagraphMarkdownViewer,
                      {
                        style: {
                          height: '1.5rem',
                          margin: 0,
                          ...Style.noWrapEllipsis,
                          color: description ? undefined : colors.dark(0.75),
                          fontSize: 14,
                        },
                      },
                      [description?.toString() || 'No description added']
                    ),
                  ]),
                ]);
              },
              size: { basis: 400, grow: 2, shrink: 0 },
            },
            {
              field: 'lastModified',
              headerRenderer: makeHeaderRenderer('lastModified'),
              cellRenderer: ({ rowIndex }) => {
                const {
                  workspace: { lastModified },
                } = sortedWorkspaces[rowIndex];

                return div({ style: styles.tableCellContainer }, [
                  div({ style: styles.tableCellContent }, [
                    h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
                      div([Utils.makeStandardDate(lastModified)]),
                    ]),
                  ]),
                ]);
              },
              size: { basis: 100, grow: 1, shrink: 0 },
            },
            {
              field: 'createdBy',
              headerRenderer: makeHeaderRenderer('createdBy'),
              cellRenderer: ({ rowIndex }) => {
                const {
                  workspace: { createdBy },
                } = sortedWorkspaces[rowIndex];

                return div({ style: styles.tableCellContainer }, [
                  div({ style: styles.tableCellContent }, [span({ style: Style.noWrapEllipsis }, [createdBy])]),
                ]);
              },
              size: { basis: 200, grow: 1, shrink: 0 },
            },
            {
              field: 'accessLevel',
              headerRenderer: makeHeaderRenderer('accessLevel'),
              cellRenderer: ({ rowIndex }) => {
                const { accessLevel } = sortedWorkspaces[rowIndex];

                return div({ style: styles.tableCellContainer }, [
                  div({ style: styles.tableCellContent }, [Utils.normalizeLabel(accessLevel)]),
                ]);
              },
              size: { basis: 120, grow: 1, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Last Workflow Submitted Status']),
              cellRenderer: ({ rowIndex }) => {
                const workspace = sortedWorkspaces[rowIndex];
                const lastRunStatus = workspaceSubmissionStatus(workspace);

                return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
                  div({ style: styles.tableCellContent }, [
                    h(WorkspaceSubmissionStatusIcon, {
                      status: lastRunStatus,
                      loadingSubmissionStats,
                    }),
                  ]),
                ]);
              },
              size: { basis: 30, grow: 0, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Cloud Platform']),
              cellRenderer: ({ rowIndex }) => {
                const workspace = sortedWorkspaces[rowIndex];
                return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
                  div({ style: styles.tableCellContent }, [
                    h(CloudProviderIcon, { cloudProvider: getCloudProviderFromWorkspace(workspace) }),
                  ]),
                ]);
              },
              size: { basis: 30, grow: 0, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Actions']),
              cellRenderer: ({ rowIndex }) => {
                const {
                  accessLevel,
                  workspace: { workspaceId, namespace, name },
                } = sortedWorkspaces[rowIndex];
                if (!Utils.canRead(accessLevel)) {
                  // No menu shown if user does not have read access.
                  return div({ className: 'sr-only' }, [
                    'You do not have permission to perform actions on this workspace.',
                  ]);
                }
                const onClone = () => setCloningWorkspaceId(workspaceId);
                const onDelete = () => setDeletingWorkspaceId(workspaceId);
                const onLock = () => setLockingWorkspaceId(workspaceId);
                const onShare = (policies) => setSharingWorkspace({ ...getWorkspace(workspaceId), policies });
                const onLeave = () => setLeavingWorkspaceId(workspaceId);

                return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
                  div({ style: styles.tableCellContent }, [
                    h(WorkspaceMenu, {
                      iconSize: 20,
                      popupLocation: 'left',
                      callbacks: { onClone, onShare, onLock, onDelete, onLeave },
                      workspaceInfo: { namespace, name },
                    }),
                  ]),
                ]);
              },
              size: { basis: 30, grow: 0, shrink: 0 },
            },
          ],
        }),
    ]),
  ]);
};
