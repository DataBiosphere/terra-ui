import React, { ReactNode } from 'react';
import { absoluteSpinnerOverlay, DeleteConfirmationModal } from 'src/components/common';

interface DeleteBillingProjectModalProps {
  projectName: string;
  deleting: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

const DeleteBillingProjectModal = (props: DeleteBillingProjectModalProps): ReactNode => {
  return (
    <DeleteConfirmationModal
      onDismiss={props.onDismiss}
      onConfirm={props.onConfirm}
      objectType='billing project'
      objectName={props.projectName}
    >
      <div>
        Are you sure you want to delete the billing project{' '}
        <b style={{ wordBreak: 'break-word' }}>{props.projectName}</b>?
      </div>
      <div style={{ marginTop: '1rem' }}>The billing project cannot be restored.</div>
      {props.deleting && absoluteSpinnerOverlay}
    </DeleteConfirmationModal>
  );
};

export default DeleteBillingProjectModal;
