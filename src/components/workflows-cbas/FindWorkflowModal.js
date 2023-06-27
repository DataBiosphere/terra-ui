import { h } from 'react-hyperscript-helpers';
import ModalDrawer from 'src/components/ModalDrawer';

const FindWorkflowModal = ({ onDismiss }) => {
  return h(
    ModalDrawer,
    {
      'aria-label': 'Find a Workflow Modal',
      isOpen: true,
      width: '70%',
      onDismiss,
    },
    ['Find Workflow Modal']
  );
};

export default FindWorkflowModal;
