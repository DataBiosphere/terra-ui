import { div, h, span } from 'react-hyperscript-helpers'
import { DeleteConfirmationModal } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'


const DeleteWorkflowModal = ({ workspace, onDismiss, onSuccess, methodConfig: { name, namespace } }) => {
  return h(DeleteConfirmationModal, {
    objectType: 'workflow',
    objectName: name,
    onConfirm: withErrorReporting('Error deleting workflow.', async () => {
      await Ajax().Workspaces
        .workspace(workspace.namespace, workspace.name)
        .methodConfig(namespace, name)
        .delete()

      onSuccess()
    }),
    onDismiss
  }, [
    div([`Are you sure you want to delete the workflow `,
      span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, [name]), '?']),
    div({ style: { marginTop: '1rem' } }, [
      'The workflow can be re-added to the workspace, but changes to workflow configuration will be lost.'
    ])
  ])
}

export default DeleteWorkflowModal
