import { icon, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode, useContext, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { Link } from 'src/components/common';
import ErrorView from 'src/components/ErrorView';
import { FirstParagraphMarkdownViewer } from 'src/components/markdown';
import Modal from 'src/components/Modal';
import { FlexTable, HeaderRenderer } from 'src/components/table';
import { WorkspaceStarControl } from 'src/components/WorkspaceStarControl';
import { workspaceSubmissionStatus, WorkspaceSubmissionStatusIcon } from 'src/components/WorkspaceSubmissionStatusIcon';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { getLink } from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  canRead,
  getCloudProviderFromWorkspace,
  workspaceAccessLevels,
  WorkspaceInfo,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';
import { WorkspaceMenu } from 'src/pages/workspaces/workspace/WorkspaceMenu';
import { WorkspaceUserActionsContext } from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

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

export const RenderedWorkspaces = (props: RenderedWorkspacesProps): ReactNode => {
  const { workspaces, loadingSubmissionStats } = props;
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
          // @ts-expect-error
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

const StarCell = (props: CellProps): ReactNode =>
  div(
    {
      style: {
        ...styles.tableCellContainer,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.5rem 0',
      },
    },
    [h(WorkspaceStarControl, { workspace: props.workspace })]
  );

const NameCell = (props: CellProps): ReactNode => {
  const {
    accessLevel,
    workspace,
    workspace: { workspaceId, namespace, name, attributes, state },
  } = props.workspace;
  const { setUserActions } = useContext(WorkspaceUserActionsContext);

  const description = attributes?.description;
  const canView = canRead(accessLevel);
  const canAccessWorkspace = () =>
    !canView ? setUserActions({ requestingAccessWorkspaceId: workspaceId }) : undefined;

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
          disabled: workspace.state === 'Deleted',
        },
        [name]
      ),
    ]),
    Utils.cond(
      [state === 'Deleting', () => h(WorkspaceDeletingCell)],
      [state === 'DeleteFailed', () => h(WorkspaceDeletionFailedCell, { workspace: props.workspace })],
      [state === 'Deleted', () => h(WorkspaceDeletedCell)],
      [Utils.DEFAULT, () => h(WorkspaceDescriptionCell, { description })]
    ),
  ]);
};

const WorkspaceDescriptionCell = (props: { description: unknown | undefined }) => {
  return div({ style: { ...styles.tableCellContent } }, [
    h(
      FirstParagraphMarkdownViewer,
      {
        style: {
          height: '1.5rem',
          margin: 0,
          ...Style.noWrapEllipsis,
          color: props.description ? undefined : colors.dark(0.75),
          fontSize: 14,
        },
      },
      [props.description?.toString() || 'No description added']
    ),
  ]);
};

const WorkspaceDeletingCell = (): ReactNode => {
  const deletingIcon = icon('syncAlt', {
    size: 18,
    style: {
      animation: 'rotation 2s infinite linear',
      marginRight: '0.5rem',
    },
  });
  return div(
    {
      style: {
        color: colors.danger(),
      },
    },
    [deletingIcon, 'Workspace deletion in progress.']
  );
};

const WorkspaceDeletionFailedCell = (props: CellProps): ReactNode => {
  const { workspace } = props;
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const errorIcon = icon('warning-standard', {
    size: 18,
    style: {
      color: colors.danger(),
      marginRight: '0.5rem',
    },
  });
  return div(
    {
      style: {
        color: colors.danger(),
      },
    },
    [
      errorIcon,
      'Error deleting workspace',
      workspace.workspace.errorMessage
        ? h(
            Link,
            {
              onClick: () => setShowDetails(true),
              style: { fontSize: 14, marginRight: '0.5rem', marginLeft: '0.5rem' },
            },
            ['See error details.']
          )
        : null,
      showDetails
        ? h(
            Modal,
            {
              width: 800,
              title: 'Error deleting workspace',
              showCancel: false,
              showX: true,
              onDismiss: () => setShowDetails(false),
            },
            [h(ErrorView, { error: workspace?.workspace.errorMessage ?? 'No error message available' })]
          )
        : null,
    ]
  );
};

const WorkspaceDeletedCell = (): ReactNode =>
  div(
    {
      style: {
        color: colors.danger(),
      },
    },
    ['Workspace has been deleted. Refresh to remove from list.']
  );

const LastModifiedCell = (props: CellProps): ReactNode => {
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

const CreatedByCell = (props: CellProps): ReactNode => {
  const {
    workspace: { createdBy },
  } = props.workspace;

  return div({ style: styles.tableCellContainer }, [
    div({ style: styles.tableCellContent }, [span({ style: Style.noWrapEllipsis }, [createdBy])]),
  ]);
};

const AccessLevelCell = (props: CellProps): ReactNode => {
  const { accessLevel } = props.workspace;

  return div({ style: styles.tableCellContainer }, [
    div({ style: styles.tableCellContent }, [Utils.normalizeLabel(accessLevel)]),
  ]);
};

interface SubmissionStatusCellProps extends CellProps {
  loadingSubmissionStats: boolean;
}

const SubmissionStatusCell = (props: SubmissionStatusCellProps): ReactNode => {
  const { workspace, loadingSubmissionStats } = props;
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

const CloudPlatformCell = (props: CellProps): ReactNode => {
  return div({ style: { ...styles.tableCellContainer, paddingRight: 0 } }, [
    div({ style: styles.tableCellContent }, [
      h(CloudProviderIcon, { cloudProvider: getCloudProviderFromWorkspace(props.workspace) }),
    ]),
  ]);
};

interface ActionsCellProps extends CellProps {
  workspaces: Workspace[];
}

const ActionsCell = (props: ActionsCellProps): ReactNode => {
  const {
    accessLevel,
    workspace: { workspaceId, namespace, name, state },
  } = props.workspace;
  const { setUserActions } = useContext(WorkspaceUserActionsContext);

  if (!canRead(accessLevel)) {
    // No menu shown if user does not have read access.
    return div({ className: 'sr-only' }, ['You do not have permission to perform actions on this workspace.']);
  }
  if (state === 'Deleted') {
    return null;
  }
  const getWorkspace = (id: string): Workspace => _.find({ workspace: { workspaceId: id } }, props.workspaces)!;

  const onClone = () => setUserActions({ cloningWorkspaceId: workspaceId });
  const onDelete = () => setUserActions({ deletingWorkspaceId: workspaceId });
  const onLock = () => setUserActions({ lockingWorkspaceId: workspaceId });
  const onShare = (policies) => setUserActions({ sharingWorkspace: { ...getWorkspace(workspaceId), policies } });
  const onLeave = () => setUserActions({ leavingWorkspaceId: workspaceId });

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
