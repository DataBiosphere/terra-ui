import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import {
  collapseCromwellExecutionStatus, failedIcon, makeSection, makeStatusLine, runningIcon, statusIcon,
  submittedIcon, successIcon, unknownIcon
} from 'src/components/job-common'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  sectionTableLabel: { paddingRight: '0.6rem', fontWeight: 600 }
}

const groupCallStatuses = callsObject => {
  const statusCounts = {}
  for (const callname in callsObject) {
    for (const attempt in callsObject[callname]) {
      const executionStatus = collapseCromwellExecutionStatus(callsObject[callname][attempt].executionStatus)
      statusCounts[executionStatus] = (statusCounts[executionStatus] || 0) + 1
    }
  }
  return statusCounts
}

const statusCell = ({ calls }) => {
  const { succeeded, failed, running, submitted, ...others } = groupCallStatuses(calls)

  return table({ style: { margin: '0.5rem' } }, [
    tbody([
      submitted && tr({}, [
        td(styles.statusDetailCell, [submittedIcon()]),
        td(['Submitted']),
        td(styles.statusDetailCell, [submitted])
      ]),
      running && tr([
        td(styles.statusDetailCell, [runningIcon()]),
        td(['Running']),
        td(styles.statusDetailCell, [running])
      ]),
      succeeded && tr([
        td(styles.statusDetailCell, [successIcon()]),
        td(['Succeeded']),
        td(styles.statusDetailCell, [succeeded])
      ]),
      failed && tr([
        td(styles.statusDetailCell, [failedIcon()]),
        td(['Failed']),
        td(styles.statusDetailCell, [failed])
      ]),
      _.map(other => tr([
        td(styles.statusDetailCell, [unknownIcon()]),
        td([other]),
        td(styles.statusDetailCell, [others[other]])
      ]), Object.keys(others))
    ])
  ])
}

const WorkflowDashboard = _.flow(
  Utils.forwardRefWithName('WorkflowDashboard'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  })
)((props, ref) => {
  const { namespace, name, submissionId, workflowId, workspace: { workspace: { bucketName } } } = props

  /*
   * State setup
   */
  const [workflow, setWorkflow] = useState({})
  const [showLog, setShowLog] = useState(false)
  const [failureCopied, setFailureCopied] = useState()

  const signal = Utils.useCancellation()

  /*
   * Data fetchers
   */

  useEffect(() => {
    const initialize = withErrorReporting('Unable to fetch Workflow Details',
      async () => {
        // If the workflow is empty, or we need to refresh after 60s:
        if (_.isEmpty(workflow) || _.includes(workflow.status, ['Running', 'Submitted'])) {
          if (!_.isEmpty(workflow)) {
            await Utils.delay(60000)
          }
          const includeKey = [
            'end', 'executionStatus', 'failures', 'start', 'status', 'submittedFiles:workflow', 'workflowLog', 'workflowName'
          ]
          const wf = await Ajax(signal).Workspaces.workspace(namespace, name).submission(submissionId).getWorkflow(workflowId, includeKey)
          setWorkflow(wf)
        }
      })

    initialize()
  }, [workflow]) // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * Page render
   */
  const { end, failures, start, status, workflowLog, workflowName, submittedFiles: { workflow: wdl } = {} } = workflow

  const restructureFailures = _.map(({ message, causedBy }) => ({
    message,
    ...(!_.isEmpty(causedBy) ? { causedBy: simplifyDidNotStartFailures(restructureFailures(causedBy)) } : {})
  }))

  const simplifyDidNotStartFailures = failuresArray => {
    const filtered = _.filter(({ message }) => !_.isEmpty(message) && !message.startsWith('Will not start job'), failuresArray)
    const sizeDiff = !_.isEmpty(failuresArray) ? failuresArray.length - filtered.length : 0
    const newMessage = sizeDiff > 0 ? [{ message: `${sizeDiff} jobs were queued in Cromwell but never sent to the cloud backend due to failures elsewhere in the workflow` }]: []

    return [...filtered, ...newMessage]
  }

  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    div({ style: { marginBottom: '1rem', display: 'flex', alignItems: 'center' } }, [
      h(Link, {
        href: Nav.getLink('workspace-job-history', { namespace, name }),
        style: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', padding: '0.5rem 0' }
      }, [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Job History']),
      div({ style: { margin: '0 0.5rem' } }, ['>']),
      h(Link, {
        href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId }),
        style: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', padding: '0.5rem 0' }
      }, [`Submission ${submissionId}`]),
      div({ style: { margin: '0 0.5rem' } }, ['>']),
      div({ style: Style.elements.sectionHeader }, [`Workflow ${workflowId}`])
    ]),
    _.isEmpty(workflow) ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Workflow Status', [
        div({ style: { lineHeight: '24px' } }, [makeStatusLine(style => statusIcon(status, style), status)])
      ]),
      makeSection('Workflow Timing', [
        table({ style: { marginTop: '0.3rem', lineHeight: '20px' } }, [
          tbody([
            tr([td({ style: styles.sectionTableLabel }, ['Start:']), start ? td([Utils.makeCompleteDate(start)]) : 'N/A']),
            tr([td({ style: styles.sectionTableLabel }, ['End:']), end ? td([Utils.makeCompleteDate(end)]) : 'N/A'])
          ])
        ])
      ]),
      makeSection('Links', [
        div({ style: { display: 'flex' } }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            href: `${getConfig().jobManagerUrlRoot}/${workflowId}`,
            style: { padding: '0.6rem' },
            tooltip: 'Job Manager'
          }, [
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              icon('tasks', { size: 18 }),
              span([' Job Manager'])
            ])
          ]),
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(`${bucketName}/${submissionId}/${workflowName}/${workflowId}`),
            style: { padding: '0.6rem' },
            tooltip: 'Execution directory' }, [
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              icon('folder-open', { size: 18 }),
              span([' Execution Directory'])
            ])
          ]),
          h(Link, { onClick: () => setShowLog(true), style: { padding: '.6rem' } }, [
            icon('fileAlt', { size: 18, style: { marginRight: '0.5rem' } }),
            ' View execution log'
          ])
        ])
      ]),
      makeSection('Call Statuses', [
        workflow.calls && false ? statusCell(workflow) : div({ style: { padding: '0.6rem' }}, ['No calls have been started by this workflow.'])

      ])
    ]),
    failures && h(Collapse, {
      style: { marginBottom: '1rem' },
      initialOpenState: true,
      title: div({ style: Style.elements.sectionHeader }, [
        'Workflow-Level Failures',
        h(Link, {
          style: { margin: '0 0.5rem' },
          tooltip: 'Copy failures to clipboard',
          onClick: withErrorReporting('Error copying to clipboard', async e => {
            e.stopPropagation() // this stops the collapse when copying
            await clipboard.writeText(JSON.stringify(failures, null, 2))
            setFailureCopied(true)
            await Utils.delay(1500)
            setFailureCopied(undefined)
          })
        }, [icon(failureCopied ? 'check' : 'copy-to-clipboard')])
      ])
    }, [h(ReactJson, {
      style: { whiteSpace: 'pre-wrap' },
      name: false,
      collapsed: 4,
      enableClipboard: false,
      displayDataTypes: false,
      displayObjectSize: false,
      src: simplifyDidNotStartFailures(restructureFailures(failures))
    })]),
    wdl && h(Collapse, {
      title: div({ style: Style.elements.sectionHeader }, ['Submitted workflow script'])
    }, [h(WDLViewer, { wdl })]),
    showLog && h(UriViewer, { googleProject: namespace, uri: workflowLog, onDismiss: () => setShowLog(false) })
  ])
})

export const navPaths = [
  {
    name: 'workspace-workflow-dashboard',
    path: '/workspaces/:namespace/:name/job_history/:submissionId/:workflowId',
    component: WorkflowDashboard,
    title: ({ name }) => `${name} - Workflow Dashboard`
  }
]

