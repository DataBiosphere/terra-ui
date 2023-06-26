import { h } from 'react-hyperscript-helpers';
import ModalDrawer from 'src/components/ModalDrawer';

const FindWorkflowModal = ({ onDismiss }) => {
  return h(
    ModalDrawer,
    {
      'aria-label': 'find-workflow-modal',
      isOpen: true,
      width: '70%',
      onDismiss,
    },
    ['Find Workflow Modal']
  );
};

export default FindWorkflowModal;
