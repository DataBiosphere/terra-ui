import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { Link } from 'src/components/common'
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
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  sectionTableLabel: { paddingRight: '0.6rem', fontWeight: 600 }
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
    return !!count && div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.3rem' } }, [
      icon,
      span([` ${count} ${text}`])
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
  const [workflow, setWorkflow] = useState({})
  const [showLog, setShowLog] = useState(false)
  const [failureCopied, setFailureCopied] = useState()

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
  const { end, failures, start, status, workflowLog, workflowName, submittedFiles: { workflow: wdl } = {} } = workflow

  const restructureFailures = failuresArray => {
    const filtered = _.filter(({ message }) => !_.isEmpty(message) && !message.startsWith('Will not start job'), failuresArray)
    const sizeDiff = failuresArray.length - filtered.length
    const newMessage = sizeDiff > 0 ? [{ message: `${sizeDiff} jobs were queued in Cromwell but never sent to the cloud backend due to failures elsewhere in the workflow` }] : []
    const simplifiedFailures = [...filtered, ...newMessage]

    return _.map(({ message, causedBy }) => ({
      message,
      ...(!_.isEmpty(causedBy) ? { causedBy: restructureFailures(causedBy) } : {})
    }), simplifiedFailures)
  }

  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    workflowDetailsBreadcrumbSubtitle(namespace, name, submissionId, workflowId),
    _.isEmpty(workflow) ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Workflow Status', [
        div({ style: { lineHeight: '24px' } }, [makeStatusLine(style => statusIcon(status, style), status)])
      ]),
      makeSection('Workflow Timing', [
        table({ style: { marginTop: '0.3rem', lineHeight: '20px' } }, [
          tbody([
            tr([td({ style: styles.sectionTableLabel }, ['Start:']), td([start ? Utils.makeCompleteDate(start) : 'N/A'])]),
            tr([td({ style: styles.sectionTableLabel }, ['End:']), td([end ? Utils.makeCompleteDate(end) : 'N/A'])])
          ])
        ])
      ]),
      makeSection('Links', [
        div({ style: { display: 'flex' } }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            href: `${getConfig().jobManagerUrlRoot}/${workflowId}`,
            style: { padding: '0.6rem', display: 'flex' },
            tooltip: 'Job Manager'
          }, [
            icon('tasks', { size: 18 }),
            span([' Job Manager'])
          ]),
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(`${bucketName}/${submissionId}/${workflowName}/${workflowId}`),
            style: { padding: '0.6rem', display: 'flex' },
            tooltip: 'Execution directory'
          }, [
            icon('folder-open', { size: 18 }),
            span([' Execution Directory'])
          ]),
          h(Link, {
            onClick: () => setShowLog(true),
            style: { padding: '.6rem', display: 'flex' }
          }, [
            icon('fileAlt', { size: 18 }),
            span([' View execution log'])
          ])
        ])
      ]),
      makeSection('Call Statuses', [
        workflow.calls ? statusCell(workflow) : div({ style: { padding: '0.6rem' } }, ['No calls have been started by this workflow.'])

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

