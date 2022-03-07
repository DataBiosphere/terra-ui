import { useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'


const LockWorkspaceModal = ({ workspace: { workspace: { namespace, name, isLocked } }, onDismiss, onSuccess }) => {
  const [locking, setLocking] = useState(false)
  const titleText = isLocked ? 'Unlock Workspace' : 'Lock Workspace'

  const toggleWorkspaceLock = async () => {
    try {
      setLocking(true)
      isLocked ? await Ajax().Workspaces.workspace(namespace, name).unlock() : await Ajax().Workspaces.workspace(namespace, name).lock()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error toggling workspace lock', error)
      setLocking(false)
    }
  }
  return h(Modal, {
    title: titleText,
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: toggleWorkspaceLock,
      tooltip: titleText
    }, titleText)
  }, [
    div(['Are you sure you want to lock the workspace ',
      span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
      '?']),
    locking && spinnerOverlay
  ])
}

export default LockWorkspaceModal
