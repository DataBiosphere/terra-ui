import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const DeleteWorkspaceModal = ({ workspace: { workspace: { namespace, name, bucketName } }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      await Ajax().Workspaces.workspace(namespace, name).delete()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  return h(Modal, {
    title: 'Delete workspace',
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: _.toLower(deleteConfirmation) !== 'delete workspace',
      onClick: () => deleteWorkspace()
    }, 'Delete workspace')
  }, [
    div(['Are you sure you want to permanently delete the workspace ',
      span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
      '?']),
    div({ style: { marginTop: '1rem' } }, [
      'Deleting it will delete the associated ',
      h(Link, {
        ...Utils.newTabLinkProps,
        href: bucketBrowserUrl(bucketName)
      }, ['Google Cloud Bucket']),
      ' and all its data.'
    ]), div({
      style: {
        fontWeight: 500,
        marginTop: '1rem'
      }
    }, 'This cannot be undone.'),
    div({ style: { marginTop: '1rem' } }, [
      label({ htmlFor: 'delete-workspace-confirmation' }, ['Please type \'Delete Workspace\' to continue:']),
      h(TextInput, {
        id: 'delete-workspace-confirmation',
        placeholder: 'Delete Workspace',
        value: deleteConfirmation,
        onChange: setDeleteConfirmation
      })
    ]),
    deleting && spinnerOverlay
  ])
}

export default DeleteWorkspaceModal
