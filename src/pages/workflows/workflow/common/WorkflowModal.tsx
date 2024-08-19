import { Modal } from '@terra-ui-packages/components';
import React from 'react';

interface WorkflowModalProps {
  // onDismiss: () => void;
  setCreateWorkflowModalOpen: (x: boolean) => void;
  title: string;
}
export const WorkflowModal = (props: WorkflowModalProps) => {
  const { setCreateWorkflowModalOpen, title } = props;
  return <Modal onDismiss={() => setCreateWorkflowModalOpen(false)} title={title} />;
};
