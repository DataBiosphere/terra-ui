import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React from 'react';

interface DeleteMemberModalProps {
  onDismiss: () => void;
  onSubmit: () => void;
  memberEmail: string;
}

export const DeleteMemberModal = (props: DeleteMemberModalProps) => (
  <Modal
    onDismiss={props.onDismiss}
    title='Confirm'
    okButton={<ButtonPrimary onClick={props.onSubmit}>Remove</ButtonPrimary>}
  >
    <div>
      Are you sure you want to remove <b>{props.memberEmail}</b>?
    </div>
  </Modal>
);
