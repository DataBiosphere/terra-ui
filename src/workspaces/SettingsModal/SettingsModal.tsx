import { Modal } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';

interface SettingsModalProps {
  // workspace: WorkspaceWrapper;
  onDismiss: () => void;
}

const SettingsModal = (props: SettingsModalProps): ReactNode => {
  const { onDismiss } = props;
  // const { namespace, name } = workspace.workspace;

  return (
    <Modal
      title='Workspace Settings'
      onDismiss={onDismiss}
      // okButton={<ButtonPrimary onClick={toggleWorkspaceLock}>{helpText}</ButtonPrimary>}
    >
      <div>Set some settings</div>
    </Modal>
  );
};

export default SettingsModal;
