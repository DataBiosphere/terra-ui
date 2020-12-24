import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ClipboardButton, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import {
  callCacheWizardBreadcrumbSubtitle,
  callDetailsBreadcrumbSubtitle,
  collapseCromwellExecutionStatus,
  cromwellExecutionStatusIcon,
  failedIcon,
  makeSection,
  makeStatusLine,
  runningIcon,
  statusIcon,
  submittedIcon,
  successIcon,
  unknownIcon,
  workflowDetailsBreadcrumbSubtitle
} from 'src/components/job-common'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import colors from 'src/libs/colors'

const naTextDiv = div({ style: { color: colors.dark(0.7), marginTop: '0.5rem' } }, ['N/A'])

const CallDetails = _.flow(
  Utils.forwardRefWithName('CallDetails'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  })
)((props, ref) => {
  const { namespace, name, submissionId, workflowId, callFqn, index, attempt, workspace: { workspace: { bucketName } } } = props

  /*
   * State setup
   */
  const [callMetadata, setCallMetadata] = useState()
  const [showCloudLog, setShowCloudLog] = useState()
  const [showTaskStdout, setShowTaskStdout] = useState()
  const [showTaskStderr, setShowTaskStderr] = useState()

  const signal = Utils.useCancellation()
  const stateRefreshTimer = useRef()

  /*
   * Data fetchers
   */

  Utils.useOnMount(() => {
    const loadWorkflow = async () => {
      const initialQueryIncludeKey = [
        'end', 'start', 'status', 'executionStatus', 'backendStatus', 'workflowName', 'callCaching', 'backendLogs', 'outputs', 'stdout', 'stderr'
      ]
      const excludeKey = []
      const call = await Ajax(signal).Workspaces.workspace(namespace, name).submission(submissionId).workflow(workflowId).call(callFqn, index, attempt).call_metadata(initialQueryIncludeKey, excludeKey)
      setCallMetadata(call || { status: 'Done' })

      if (call && _.includes(call.status, ['Running', 'Submitted'])) {
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
  const { start, end, executionStatus, backendStatus, backendLogs: { log: papiLog } = {}, outputs, stdout, stderr } = callMetadata || {}

  const [workflowName, callName] = callFqn.split('.')
  const browserBucketUrl = () => {
    const base = `${bucketName}/${submissionId}/${workflowName}/${workflowId}/call-${callName}`
    const withShard = Number(index) >= 0 ? `${base}/shard-${index}` : base
    const withAttempt = Number(attempt) >= 2 ? `${withShard}/attempt-${attempt}` : withShard
    return withAttempt
  }

  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    callDetailsBreadcrumbSubtitle(namespace, name, submissionId, workflowId, callFqn, index, attempt),
    callMetadata === undefined ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Call Status', [
        div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.5rem' } }, [
          div({ style: { fontWeight: 'bold' } }, ['Cromwell execution status: ']),
          executionStatus ? makeStatusLine(style => cromwellExecutionStatusIcon(executionStatus, style), executionStatus, { marginLeft: '0.5rem' }) : 'Loading...'
        ]),
        executionStatus === 'Running' && div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.5rem' } }, [
          div({ style: { fontWeight: 'bold' } }, ['Cloud execution status: ']),
          backendStatus ? makeStatusLine(style => cromwellExecutionStatusIcon(executionStatus, style), backendStatus, { marginLeft: '0.5rem' }) : 'Loading...'
        ])
      ]),
      makeSection('Call Timing', [
        div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.5rem' } }, [
          div({ style: { fontWeight: 'bold' } }, ['Start time: ']),
          start ? Utils.makeCompleteDate(start) : 'Loading...'
        ]),
        div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.5rem' } }, [
          div({ style: { fontWeight: 'bold' } }, ['End time: ']),
          end ? Utils.makeCompleteDate(end) : naTextDiv
        ])
      ]),
      makeSection('Links', [
        div({ style: { display: 'flex', flexFlow: 'row wrap' } }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(browserBucketUrl()),
            style: { display: 'flex', marginLeft: '1rem', marginTop: '0.5rem' }
          }, [icon('folder-open', { size: 18 }), ' Call execution directory']),
          h(Link, {
            onClick: () => setShowCloudLog(true),
            style: { display: 'flex', marginLeft: '1rem', marginTop: '0.5rem' }
          }, [icon('fileAlt', { size: 18 }), ' Cloud execution log']),
          stdout && h(Link, {
            onClick: () => setShowTaskStdout(true),
            style: { display: 'flex', marginLeft: '1rem', marginTop: '0.5rem' }
          }, [icon('fileAlt', { size: 18 }), ' Task stdout']),
          stderr && h(Link, {
            onClick: () => setShowTaskStderr(true),
            style: { display: 'flex', marginLeft: '1rem', marginTop: '0.5rem' }
          }, [icon('fileAlt', { size: 18 }), ' Task stderr'])
        ])
      ]),
      makeSection('Outputs', [
        outputs ? div({ style: { height: 200, overflow: 'auto', borderStyle: 'ridge', resize: 'vertical', marginTop: '0.5rem' } }, [
          h(ReactJson, {
            style: { whiteSpace: 'pre-wrap' },
            name: false,
            collapsed: 1,
            enableClipboard: false,
            displayDataTypes: false,
            displayObjectSize: true,
            src: outputs
          })
        ]) : naTextDiv
      ]),
      showCloudLog && h(UriViewer, { googleProject: namespace, uri: papiLog, onDismiss: () => setShowCloudLog(false) }),
      showTaskStdout && h(UriViewer, { googleProject: namespace, uri: stdout, onDismiss: () => setShowTaskStdout(false) }),
      showTaskStderr && h(UriViewer, { googleProject: namespace, uri: stderr, onDismiss: () => setShowTaskStderr(false) })
    ])
  ])
})

export const navPaths = [
  {
    name: 'workspace-call-details',
    path: '/workspaces/:namespace/:name/job_history/:submissionId/:workflowId/call/:callFqn/:index/:attempt',
    component: CallDetails,
    title: ({ name }) => `${name} - Call Details`
  }
]
