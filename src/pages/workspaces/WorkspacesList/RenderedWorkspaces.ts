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
import { getLink } from 'src/libs/nav';
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
          columns: [
            {
              field: 'starred',
              headerRenderer: () => div({ className: 'sr-only' }, ['Starred']),
              cellRenderer: ({ rowIndex }) => h(StarCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 40, grow: 0, shrink: 0 },
            },
            {
              field: 'name',
              headerRenderer: makeHeaderRenderer('name'),
              cellRenderer: ({ rowIndex }) => h(NameCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 400, grow: 2, shrink: 0 },
            },
            {
              field: 'lastModified',
              headerRenderer: makeHeaderRenderer('lastModified'),
              cellRenderer: ({ rowIndex }) => h(LastModifiedCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 100, grow: 1, shrink: 0 },
            },
            {
              field: 'createdBy',
              headerRenderer: makeHeaderRenderer('createdBy'),
              cellRenderer: ({ rowIndex }) => h(CreatedByCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 200, grow: 1, shrink: 0 },
            },
            {
              field: 'accessLevel',
              headerRenderer: makeHeaderRenderer('accessLevel'),
              cellRenderer: ({ rowIndex }) => h(AccessLevelCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 120, grow: 1, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Last Workflow Submitted Status']),
              cellRenderer: ({ rowIndex }) =>
                h(SubmissionStatusCell, { workspace: sortedWorkspaces[rowIndex], loadingSubmissionStats }),
              size: { basis: 30, grow: 0, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Cloud Platform']),
              cellRenderer: ({ rowIndex }) => h(CloudPlatformCell, { workspace: sortedWorkspaces[rowIndex] }),
              size: { basis: 30, grow: 0, shrink: 0 },
            },
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Actions']),
              cellRenderer: ({ rowIndex }) =>
                h(ActionsCell, { workspace: sortedWorkspaces[rowIndex], workspaces: sortedWorkspaces }),
              size: { basis: 30, grow: 0, shrink: 0 },
            },
          ],
        }),
    ]),
  ]);
};

interface CellProps {
  workspace: Workspace;
}

const StarCell: FC<CellProps> = ({ workspace }) =>
  div(
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

const NameCell: FC<CellProps> = (props) => {
  const {
    accessLevel,
    workspace,
    workspace: { workspaceId, namespace, name, attributes },
  } = props.workspace;
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
          href: canView ? getLink('workspace-dashboard', { namespace, name }) : undefined,
          onClick: () => {
            canAccessWorkspace();
            !!canView && Ajax().Metrics.captureEvent(Events.workspaceOpenFromList, extractWorkspaceDetails(workspace));
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
};

const LastModifiedCell: FC<CellProps> = (props) => {
  const {
    workspace: { lastModified },
  } = props.workspace;

  return div({ style: styles.tableCellContainer }, [
    div({ style: styles.tableCellContent }, [
      h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
        div([Utils.makeStandardDate(lastModified)]),
      ]),
    ]),
  ]);
};

const CreatedByCell: FC<CellProps> = (props) => {
  const {
    workspace: { createdBy },
  } = props.workspace;

  return div({ style: styles.tableCellContainer }, [
    div({ style: styles.tableCellContent }, [span({ style: Style.noWrapEllipsis }, [createdBy])]),
  ]);
};

const AccessLevelCell: FC<CellProps> = (props) => {
  const { accessLevel } = props.workspace;

  return div({ style: styles.tableCellContainer }, [
    div({ style: styles.tableCellContent }, [Utils.normalizeLabel(accessLevel)]),
  ]);
};

interface SubmissionStatusCellProps extends CellProps {
  loadingSubmissionStats: boolean;
}

const SubmissionStatusCell: FC<SubmissionStatusCellProps> = ({ workspace, loadingSubmissionStats }) => {
  const lastRunStatus = workspaceSubmissionStatus(workspace);

  return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
    div({ style: styles.tableCellContent }, [
      h(WorkspaceSubmissionStatusIcon, {
        status: lastRunStatus,
        loadingSubmissionStats,
      }),
    ]),
  ]);
};

const CloudPlatformCell: FC<CellProps> = ({ workspace }) => {
  return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
    div({ style: styles.tableCellContent }, [
      h(CloudProviderIcon, { cloudProvider: getCloudProviderFromWorkspace(workspace) }),
    ]),
  ]);
};

interface ActionsCellProps extends CellProps {
  workspaces: Workspace[];
}

const ActionsCell: FC<ActionsCellProps> = (props) => {
  const {
    accessLevel,
    workspace: { workspaceId, namespace, name },
  } = props.workspace;
  if (!Utils.canRead(accessLevel)) {
    // No menu shown if user does not have read access.
    return div({ className: 'sr-only' }, ['You do not have permission to perform actions on this workspace.']);
  }
  const getWorkspace = (id: string): Workspace => _.find({ workspace: { workspaceId: id } }, props.workspaces)!;

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
};
