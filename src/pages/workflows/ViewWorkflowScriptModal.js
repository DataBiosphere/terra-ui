import { h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import WDLViewer from 'src/components/WDLViewer'


const ViewWorkflowScriptModal = ({ workflowScript, onDismiss }) => {
  return h(Modal,
    {
      title: 'Workflow Script',
      onDismiss,
      showCancel: false,
      showX: true,
      okButton: 'Done',
      width: 900,
      height: 500
    }, [
      // we are specifying height here so that for long workflow scripts the Modal doesn't overflow the main screen
      h(WDLViewer, { wdl: workflowScript, style: { height: 550 } })
    ]
  )
}

export default ViewWorkflowScriptModal
