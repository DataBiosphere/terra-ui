import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ClipboardButton, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import {
  collapseCromwellExecutionStatus, failedIcon, makeSection, makeStatusLine, runningIcon, statusIcon,
  submittedIcon, successIcon, unknownIcon, workflowDetailsBreadcrumbSubtitle
} from 'src/components/job-common'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  sectionTableLabel: { fontWeight: 600 }
}

// Note: this can take a while with large data inputs. Consider memoization if the page ever needs re-rendering.
const groupCallStatuses = _.flow(
  _.values,
  _.flattenDepth(1),
  _.countBy(a => collapseCromwellExecutionStatus(a.executionStatus))
)

const statusCell = ({ calls }) => {
  const { succeeded, failed, running, submitted, ...others } = groupCallStatuses(calls)

  const makeRow = (count, icon, text) => {
    return !!count && div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.25rem' } }, [
      icon,
      ` ${count} ${text}`
    ])
  }

  return h(Fragment, [
    makeRow(submitted, submittedIcon(), 'Submitted'),
    makeRow(running, runningIcon(), 'Running'),
    makeRow(succeeded, successIcon(), 'Succeeded'),
    makeRow(failed, failedIcon(), 'Failed'),
    _.map(([name, count]) => makeRow(count, unknownIcon(), name), _.toPairs(others))
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
  const [workflow, setWorkflow] = useState()
  const [showLog, setShowLog] = useState(false)

  const signal = Utils.useCancellation()
  const stateRefreshTimer = useRef()

  /*
   * Data fetchers
   */

  Utils.useOnMount(() => {
    const loadWorkflow = async () => {
      const includeKey = [
        'end', 'executionStatus', 'failures', 'start', 'status', 'submittedFiles:workflow', 'workflowLog', 'workflowName'
      ]
      const wf = await Ajax(signal).Workspaces.workspace(namespace, name).submission(submissionId).getWorkflow(workflowId, includeKey)
      setWorkflow(wf)

      if (_.includes(wf.status, ['Running', 'Submitted'])) {
        stateRefreshTimer.current = setTimeout(loadWorkflow, 60000)
      }
    }

    loadWorkflow()
    return () => {
      clearTimeout(stateRefreshTimer.current)
    }
  })

  /*
   * Page render
   */
  const { end, failures, start, status, workflowLog, workflowName, submittedFiles: { workflow: wdl } = {} } = workflow || {}

  const restructureFailures = failuresArray => {
    const filtered = _.filter(({ message }) => !_.isEmpty(message) && !message.startsWith('Will not start job'), failuresArray)
    const sizeDiff = failuresArray.length - filtered.length
    const newMessage = sizeDiff > 0 ? [{
      message: `${sizeDiff} jobs were queued in Cromwell but never sent to the cloud backend due to failures elsewhere in the workflow`
    }] : []
    const simplifiedFailures = [...filtered, ...newMessage]

    return _.map(({ message, causedBy }) => ({
      message,
      ...(!_.isEmpty(causedBy) ? { causedBy: restructureFailures(causedBy) } : {})
    }), simplifiedFailures)
  }

  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    workflowDetailsBreadcrumbSubtitle(namespace, name, submissionId, workflowId),
    workflow === undefined ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Workflow Status', [
        div({ style: { lineHeight: '24px' } }, [makeStatusLine(style => statusIcon(status, style), status)])
      ]),
      makeSection('Workflow Timing', [
        div({ style: { marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem' } }, [
          div({ style: styles.sectionTableLabel }, ['Start:']), div([start ? Utils.makeCompleteDate(start) : 'N/A']),
          div({ style: styles.sectionTableLabel }, ['End:']), div([end ? Utils.makeCompleteDate(end) : 'N/A'])
        ])
      ]),
      makeSection('Links', [
        div({ style: { display: 'flex', marginTop: '0.5rem' } }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            href: `${getConfig().jobManagerUrlRoot}/${workflowId}`,
            style: { display: 'flex' },
            tooltip: 'Job Manager'
          }, [icon('tasks', { size: 18 }), ' Job Manager']),
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(`${bucketName}/${submissionId}/${workflowName}/${workflowId}`),
            style: { display: 'flex', marginLeft: '1rem' },
            tooltip: 'Execution directory'
          }, [icon('folder-open', { size: 18 }), ' Execution Directory']),
          h(Link, {
            onClick: () => setShowLog(true),
            style: { display: 'flex', marginLeft: '1rem' }
          }, [icon('fileAlt', { size: 18 }), ' View execution log'])
        ])
      ]),
      makeSection('Call Statuses', [
        workflow.calls ? statusCell(workflow) : div({ style: { marginTop: '0.5rem' } }, ['No calls have been started by this workflow.'])
      ])
    ]),
    failures && h(Collapse, {
      style: { marginBottom: '1rem' },
      initialOpenState: true,
      title: div({ style: Style.elements.sectionHeader }, [
        'Workflow-Level Failures',
        h(ClipboardButton, {
          text: JSON.stringify(failures, null, 2),
          style: { marginLeft: '0.5rem' },
          onClick: e => e.stopPropagation() // this stops the collapse when copying
        })
      ])
    }, [h(ReactJson, {
      style: { whiteSpace: 'pre-wrap' },
      name: false,
      collapsed: 4,
      enableClipboard: false,
      displayDataTypes: false,
      displayObjectSize: false,
      src: restructureFailures(failures)
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
