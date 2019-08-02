import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'


const DeleteWorkflowModal = ({ workspace, onDismiss, onSuccess, methodConfig: { name, namespace } }) => {
  const doDelete = async () => {
    try {
      await Ajax().Workspaces
        .workspace(workspace.namespace, workspace.name)
        .methodConfig(namespace, name)
        .delete()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workflow', error)
    }
  }


  return h(Modal, {
    title: 'Delete Workflow',
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: doDelete
    }, ['Delete'])
  }, [`Are you sure you want to delete "${name}"?`])
}

export default DeleteWorkflowModal
