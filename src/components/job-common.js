import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


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


export const collapseCromwellExecutionStatus = status => {
  switch (status) {
    case 'Done':
      return 'succeeded'
    case 'Aborting': // only on submissions not workflows
    case 'Aborted':
    case 'Failed':
      return 'failed'
    case 'Running':
      return 'running'
    default:
      return `Unexpected status (${status})`
  }
}

const size = 24

export const successIcon = style => icon('check', { size, style: { color: colors.success(), ...style } })
export const failedIcon = style => icon('warning-standard', { size, style: { color: colors.danger(), ...style } })
export const runningIcon = style => icon('sync', { size, style: { color: colors.dark(), ...style } })
export const submittedIcon = style => icon('clock', { size, style: { color: colors.dark(), ...style } })
export const unknownIcon = style => icon('unknown', { size, style: { color: colors.dark(), ...style } })

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

export const makeStatusLine = (iconFn, text) => div({ style: { display: 'flex', marginTop: '0.5rem', fontSize: 14 } }, [
  iconFn({ marginRight: '0.5rem' }), text
])

export const makeSection = (label, children) => div({
  style: {
    flex: '0 0 33%', padding: '0 0.5rem 0.5rem',
    whiteSpace: 'pre', textOverflow: 'ellipsis', overflow: 'hidden'
  }
}, [
  div({ style: Style.elements.sectionHeader }, label),
  h(Fragment, children)
])
