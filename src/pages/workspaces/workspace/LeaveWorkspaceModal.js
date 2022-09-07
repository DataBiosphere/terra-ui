import { useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'


const LeaveWorkspaceModal = ({ workspace: { workspace: { workspaceId } }, onDismiss, onSuccess }) => {
  const [leaving, setLeaving] = useState(false)
  const helpText = 'Leave Workspace'

  const leaveWorkspace = async () => {
    try {
      setLeaving(true)
      await Ajax().Workspaces.leave(workspaceId)
      Ajax().Metrics.captureEvent(Events.workspaceShare, { workspaceId })
      setLeaving(false)
      onDismiss()
      onSuccess()
    } catch (error) {
      const { message } = await error.json()
      Ajax().Metrics.captureEvent(Events.workspaceLeave, { workspaceId, errorMessage: message })
      reportError(message)
      setLeaving(false)
      onDismiss()
    }
  }

  return h(Modal, {
    title: span({ style: { display: 'flex', alignItems: 'center' } }, [
      icon('warning-standard', { size: 24, color: colors.warning() }),
      span({ style: { marginLeft: '1ch' } }, [helpText])
    ]),
    styles: { modal: { background: colors.warning(0.1) } },
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: leaveWorkspace
    }, helpText)
  }, [
    div(['Are you sure you want to leave this workspace? ',
      'You will also lose access to the data associated with this workspace.']),
    leaving && spinnerOverlay
  ])
}

export default LeaveWorkspaceModal
