import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React from 'react';

interface DeleteUserModalProps {
  onDismiss: () => void;
  onSubmit: () => void;
  userEmail: string;
}

export const DeleteUserModal = (props: DeleteUserModalProps) => (
  <Modal
    onDismiss={props.onDismiss}
    title='Confirm'
    okButton={<ButtonPrimary onClick={props.onSubmit}>Remove</ButtonPrimary>}
  >
    <div>
      Are you sure you want to remove <b>{props.userEmail}</b>?
    </div>
  </Modal>
);
