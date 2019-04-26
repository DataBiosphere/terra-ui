import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'


export const collapseStatus = status => {
  switch (status) {
    case 'Succeeded':
      return 'succeeded'
    case 'Aborting': // only on submissions not workflows
    case 'Aborted':
    case 'Failed':
      return 'failed'
    case 'Running':
      return 'running'
    default:
      return 'submitted'
  }
}

export const successIcon = style => icon('check', { size: 24, style: { color: colors.green[0], ...style } })
export const failedIcon = style => icon('warning-standard', { className: 'is-solid', size: 24, style: { color: colors.red[0], ...style } })
export const runningIcon = style => icon('sync', { size: 24, style: { color: colors.blue[0], ...style } })
export const submittedIcon = style => icon('clock', { size: 24, style })

export const statusIcon = (status, style) => {
  switch (collapseStatus(status)) {
    case 'succeeded':
      return successIcon(style)
    case 'failed':
      return failedIcon(style)
    case 'running':
      return runningIcon(style)
    default:
      return submittedIcon(style)
  }
}
