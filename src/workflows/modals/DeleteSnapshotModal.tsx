import { ReactNode } from 'react';
import React from 'react';
import { DeleteConfirmationModal } from 'src/components/common';

interface DeleteSnapshotModalProps {
  namespace: string;
  name: string;
  snapshotId: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

const DeleteSnapshotModal = (props: DeleteSnapshotModalProps): ReactNode => {
  const { namespace, name, snapshotId, onConfirm, onDismiss } = props;

  return (
    <DeleteConfirmationModal
      objectType='snapshot'
      objectName={`${namespace}/${name}/${snapshotId}`}
      onConfirm={onConfirm}
      onDismiss={onDismiss}
    >
      <p>
        Are you sure you want to delete snapshot <b>{snapshotId}</b> of the method{' '}
        <b>
          {namespace}/{name}
        </b>
        ?
      </p>
      <p>Workspaces into which this snapshot has been exported will not be affected.</p>
      <p>
        <strong>This cannot be undone.</strong>
      </p>
    </DeleteConfirmationModal>
  );
};

export default DeleteSnapshotModal;
