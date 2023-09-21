import _ from 'lodash/fp';
import { FC, ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { Link } from 'src/components/common';
import { FirstParagraphMarkdownViewer } from 'src/components/markdown';
import { FlexTable, HeaderRenderer } from 'src/components/table';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { WorkspaceStarControl } from 'src/components/WorkspaceStarControl';
import { WorkspaceSubmissionStatusIcon } from 'src/components/WorkspaceSubmissionStatusIcon';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  getCloudProviderFromWorkspace,
  workspaceAccessLevels,
  WorkspaceInfo,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu';
import { workspaceSubmissionStatus } from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import { updateWorkspaceActions } from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

// This is actually the sort type from the FlexTable component
// When that component is converted to typescript, we should use that instead
interface WorkspaceSort {
  field: keyof WorkspaceInfo | keyof Workspace;
  direction: 'desc' | 'asc';
}

const styles = {
  tableCellContainer: {
    height: '100%',
    padding: '0.5rem 0',
    paddingRight: '2rem',
    borderTop: `1px solid ${colors.light()}`,
  },
  tableCellContent: {
    height: '50%',
    display: 'flex',
    alignItems: 'center',
  },
};

interface RenderedWorkspacesProps {
  workspaces: Workspace[];
  label: string;
  noContent: ReactNode;
  loadingSubmissionStats: boolean;
}

export const RenderedWorkspaces: FC<RenderedWorkspacesProps> = ({ workspaces, loadingSubmissionStats, ...props }) => {
  const getWorkspace = (id: string): Workspace => _.find({ workspace: { workspaceId: id } }, workspaces)!;

  const {
    profile: { starredWorkspaces },
  } = useStore<AuthState>(authStore);
  const starredWorkspaceIds = _.isEmpty(starredWorkspaces) ? [] : _.split(',', starredWorkspaces);

  const [sort, setSort] = useState<WorkspaceSort>({ field: 'lastModified', direction: 'desc' });

  const makeHeaderRenderer = (name: string) => () => h(HeaderRenderer, { sort, name, onSort: setSort });

  const sortedWorkspaces = _.orderBy(
    [
      (ws: Workspace) => _.includes(ws.workspace.workspaceId, starredWorkspaceIds),
      sort.field === 'accessLevel'
        ? (ws: Workspace) => -workspaceAccessLevels.indexOf(ws.accessLevel)
        : `workspace.${sort.field}`,
    ],
    ['desc', sort.direction],
    workspaces
  );

  const columnDefinitions: FlexTableColumn<Workspace>[] = [
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
          [h(WorkspaceStarControl, { workspace })]
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
        const canAccessWorkspace = () =>
          !canView ? updateWorkspaceActions({ requestingAccessWorkspaceId: workspaceId }) : undefined;

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
                    Ajax().Metrics.captureEvent(Events.workspaceOpenFromList, extractWorkspaceDetails(workspace));
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
          return div({ className: 'sr-only' }, ['You do not have permission to perform actions on this workspace.']);
        }
        const onClone = () => updateWorkspaceActions({ cloningWorkspaceId: workspaceId });
        const onDelete = () => updateWorkspaceActions({ deletingWorkspaceId: workspaceId });
        const onLock = () => updateWorkspaceActions({ lockingWorkspaceId: workspaceId });
        const onShare = (policies) =>
          updateWorkspaceActions({ sharingWorkspace: { ...getWorkspace(workspaceId), policies } });
        const onLeave = () => updateWorkspaceActions({ leavingWorkspaceId: workspaceId });

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
  ];

  return div({ style: { flex: 1, backgroundColor: 'white', padding: '0 1rem' } }, [
    h(AutoSizer, [
      ({ width, height }) =>
        h(FlexTable, {
          'aria-label': props.label,
          width,
          height,
          rowCount: sortedWorkspaces.length,
          noContentRenderer: () => props.noContent,
          variant: 'light',
          rowHeight: 70,
          sort,
          columns: columnDefinitions,
        }),
    ]),
  ]);
};

interface CellRendererProps<T> {
  data: T;
  columnIndex: number;
  rowIndex: number;
}

interface FlexTableColumn<T> {
  field?: string;
  headerRenderer: () => ReactNode;
  cellRenderer: (props: CellRendererProps<T>) => ReactNode;
  size: {
    basis?: number;
    grow?: number;
    max?: number;
    min?: number;
    shrink?: number;
  };
}
