import { b, div, h } from 'react-hyperscript-helpers';
import { absoluteSpinnerOverlay, DeleteConfirmationModal } from 'src/components/common';

interface DeleteBillingProjectModalProps {
  projectName: string;
  deleting: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

const DeleteBillingProjectModal = (props: DeleteBillingProjectModalProps) => {
  return h(
    DeleteConfirmationModal,
    {
      onDismiss: props.onDismiss,
      onConfirm: props.onConfirm,
      objectType: 'billing project',
      objectName: props.projectName,
    },
    [
      div([
        'Are you sure you want to delete the billing project ',
        b({ style: { wordBreak: 'break-word' } }, [props.projectName]),
        '?',
      ]),
      div({ style: { marginTop: '1rem' } }, ['The billing project cannot be restored.']),
      props.deleting && absoluteSpinnerOverlay,
    ]
  );
};
export default DeleteBillingProjectModal;
