import { h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import FailuresViewer from 'src/pages/workspaces/workspace/jobHistory/FailuresViewer'


const FailuresModal = ({ callFqn, index, attempt, failures, onDismiss }) => {
  return h(Modal, {
    title: `Error Messages`,
    onDismiss,
    showButtons: false,
    showX: true,
    width: '50%'
  }, [
    `Failures in ${callFqn} / index ${index} / attempt ${attempt}`,
    h(FailuresViewer, { failures })
  ])
}

export default FailuresModal
