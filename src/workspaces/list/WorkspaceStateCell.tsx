import { icon, IconId, Modal } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { Link } from 'src/components/common';
import ErrorView from 'src/components/ErrorView';
import { FirstParagraphMarkdownViewer } from 'src/components/markdown';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

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

const WorkspaceDescriptionCell = (props: { description: unknown | undefined }) => (
  <div style={styles.tableCellContent}>
    <FirstParagraphMarkdownViewer
      style={{
        height: '1.5rem',
        margin: 0,
        ...Style.noWrapEllipsis,
        color: props.description ? undefined : colors.dark(0.75),
        fontSize: 14,
      }}
      renderers={{}} // needed to make typechecker work, because FirstParagraphMarkdownViewer is not typed
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
      return <WorkspaceFailedCell state={state} errorMessage={errorMessage} />;
    case 'Deleted':
      return <WorkspaceDeletedCell />;
    case 'Cloning':
      return <WorkspaceCloningCell />;
    case 'CloningContainer':
      return <WorkspaceCloningCell />;
    case 'CloningFailed':
      return <WorkspaceFailedCell state={state} errorMessage={errorMessage} />;
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
        backgroundColor: props.color(0.25),
        width: 'fit-content',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        fontWeight: 500,
        textAlign: 'center',
        borderRadius: '1rem',
        fontSize: '0.875rem',
      }}
    >
      {icon(props.iconShape, {
        size: 16,
        style: {
          animation: props.rotateIcon ? 'rotation 2s infinite linear' : undefined,
          color: props.color(),
          textAlign: 'center',
        },
      })}
      <span style={{ margin: '0.5rem' }}>{props.children}</span>
    </div>
  );
};

interface WorkspaceFailedCellProps {
  state: 'DeleteFailed' | 'CloningFailed';
  errorMessage?: string;
}

const WorkspaceFailedCell = (props: WorkspaceFailedCellProps): ReactNode => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const failureMsg = props.state === 'DeleteFailed' ? 'Error deleting workspace' : 'Workspace clone unsuccessful';

  return (
    <WorkspaceStatusPill iconShape='warning-standard' color={colors.danger}>
      {failureMsg}
      {props.errorMessage ? (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          onClick={() => setShowDetails(true)}
          style={{ fontSize: 14, marginRight: '0.5rem', marginLeft: '0.5rem' }}
        >
          See error details.
        </Link>
      ) : null}
      {showDetails && (
        <Modal width={800} title={failureMsg} showCancel={false} showX onDismiss={() => setShowDetails(false)}>
          <ErrorView error={props.errorMessage ?? 'No error message available'} />
        </Modal>
      )}
    </WorkspaceStatusPill>
  );
};

const WorkspaceDeletedCell = (): ReactNode => (
  <div style={{ color: colors.danger() }}>Workspace has been deleted. Refresh to remove from list.</div>
);
