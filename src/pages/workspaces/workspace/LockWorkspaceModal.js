import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'


const LockWorkspaceModal = ({ workspace: { workspace: { namespace, name, isLocked } }, onDismiss, onSuccess }) => {
  const [togglingLock, setTogglingLock] = useState(false)
  const titleText = isLocked ? 'Unlock Workspace' : 'Lock Workspace'

  const toggleWorkspaceLock = async () => {
    try {
      setTogglingLock(true)
      isLocked ? await Ajax().Workspaces.workspace(namespace, name).unlock() : await Ajax().Workspaces.workspace(namespace, name).lock()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error toggling workspace lock', error)
      setTogglingLock(false)
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
    isLocked ?
      div(['Are you sure you want to unlock this workspace? Collaborators will be able to modify the workspace while it is unlocked.']) :
      div(['Are you sure you want to lock this workspace? Collaborators will not be able to modify the workspace while it is locked.']),
    togglingLock && spinnerOverlay
  ])
}

export default LockWorkspaceModal
