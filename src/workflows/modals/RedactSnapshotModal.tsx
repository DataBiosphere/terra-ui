import { ReactNode } from 'react';
import React from 'react';
import { DeleteConfirmationModal } from 'src/components/common';

interface RedactSnapshotModalProps {
  namespace: string;
  name: string;
  snapshotId: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

const RedactSnapshotModal = (props: RedactSnapshotModalProps): ReactNode => {
  const { namespace, name, snapshotId, onConfirm, onDismiss } = props;

  return (
    <DeleteConfirmationModal
      objectType='workflow snapshot'
      objectName={`${namespace}/${name}/${snapshotId}`}
      title='Redact snapshot'
      buttonText='Redact'
      onConfirm={onConfirm}
      onDismiss={onDismiss}
    >
      <p>
        Are you sure you want to redact snapshot <b>{snapshotId}</b> of workflow{' '}
        <b>
          {namespace}/{name}
        </b>
        ?
      </p>
      <p>
        Redacting this snapshot will remove it from the Method Repository. Configurations in workspaces will not be
        affected.
      </p>
      <p>
        <strong>This cannot be undone.</strong>
      </p>
    </DeleteConfirmationModal>
  );
};

export default RedactSnapshotModal;
