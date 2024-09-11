import { Icon, IconId, Modal } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { Link } from 'src/components/common';
import ErrorView from 'src/components/ErrorView';
import { FirstParagraphMarkdownViewer } from 'src/components/markdown';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import { styles } from 'src/workspaces/list/RenderedWorkspaces';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

const WorkspaceDescriptionCell = (props: { description: unknown }) => (
  <div style={styles.tableCellContent}>
    {/* @ts-expect-error - FirstParagraphMarkdownViewer is not typed, so ts expects a value for renderers */}
    <FirstParagraphMarkdownViewer
      style={{
        margin: 0,
        ...Style.noWrapEllipsis,
        color: props.description ? undefined : colors.dark(0.75),
        fontSize: '0.875rem',
      }}
    >
      {props.description?.toString() || 'No description added'}
    </FirstParagraphMarkdownViewer>
  </div>
);

interface WorkspaceStateCellProps {
  workspace: Workspace;
}

export const WorkspaceStateCell = (props: WorkspaceStateCellProps): ReactNode => {
  const {
    workspace,
    workspace: { attributes, state },
  } = props.workspace;
  const description = attributes?.description;
  const errorMessage = workspace.errorMessage;
  switch (state) {
    case 'Deleting':
      return <WorkspaceDeletingCell />;
    case 'DeleteFailed':
      return <WorkspaceFailedCell workspaceName={workspace.name} state={state} errorMessage={errorMessage} />;
    case 'Deleted':
      return <WorkspaceDeletedCell />;
    case 'Cloning':
      return <WorkspaceCloningCell />;
    case 'CloningContainer':
      return <WorkspaceCloningCell />;
    case 'CloningFailed':
      return <WorkspaceFailedCell workspaceName={workspace.name} state={state} errorMessage={errorMessage} />;
    case 'UpdateFailed':
      return <WorkspaceFailedCell workspaceName={workspace.name} state={state} errorMessage={errorMessage} />;
    default:
      return <WorkspaceDescriptionCell description={description} />;
  }
};

const WorkspaceDeletingCell = (): ReactNode => (
  <WorkspaceStatusPill iconShape='syncAlt' rotateIcon color={colors.danger}>
    Workspace deletion in progress
  </WorkspaceStatusPill>
);

const WorkspaceCloningCell = (): ReactNode => (
  <WorkspaceStatusPill iconShape='syncAlt' rotateIcon color={colors.success}>
    Workspace cloning in progress
  </WorkspaceStatusPill>
);

interface WorkspaceStatusPillProps {
  iconShape: IconId;
  rotateIcon?: boolean;
  color: (number?) => any;
  children: ReactNode;
}

const WorkspaceStatusPill = (props: WorkspaceStatusPillProps): ReactNode => {
  return (
    <div
      style={{
        display: 'flex',
        width: 'fit-content',
        height: '1.5625rem',
        padding: '0.625rem',
        borderRadius: '1.25rem',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.625rem',
        backgroundColor: props.color(0.25),
      }}
    >
      <Icon
        icon={props.iconShape}
        size={16}
        style={{
          animation: props.rotateIcon ? 'rotation 2s infinite linear' : undefined,
          color: props.color(),
          textAlign: 'center',
        }}
      />
      {props.children}
    </div>
  );
};

interface WorkspaceFailedCellProps {
  workspaceName: string;
  state: 'DeleteFailed' | 'CloningFailed' | 'UpdateFailed';
  errorMessage?: string;
}

const WorkspaceFailedCell = (props: WorkspaceFailedCellProps): ReactNode => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const failureMsg = () => {
    switch (props.state) {
      case 'DeleteFailed':
        return 'Error deleting workspace';
      case 'CloningFailed':
        return 'Workspace clone unsuccessful';
      default:
        return 'Error updating billing account';
    }
  };

  return (
    <div style={{ flexDirection: 'row', display: 'flex', alignItems: 'baseline' }}>
      <WorkspaceStatusPill iconShape='warning-standard' color={colors.danger}>
        {failureMsg()}
      </WorkspaceStatusPill>
      {props.errorMessage && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          onClick={() => setShowDetails(true)}
          style={{
            fontSize: '0.875rem',
            margin: '0.625rem',
          }}
          aria-label={`Error details for workspace: ${props.workspaceName}`}
        >
          See error details.
        </Link>
      )}
      {showDetails && (
        <Modal width={800} title={failureMsg()} showCancel={false} showX onDismiss={() => setShowDetails(false)}>
          <ErrorView error={props.errorMessage ?? 'No error message available'} />
        </Modal>
      )}
    </div>
  );
};

const WorkspaceDeletedCell = (): ReactNode => (
  <div style={{ color: colors.danger() }}>Workspace has been deleted. Refresh to remove from list.</div>
);
