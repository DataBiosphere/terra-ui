import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, pre, table, tbody, td, tr } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { makeSection, makeStatusLine, statusIcon } from 'src/components/job-common'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  sectionTableLabel: { paddingRight: '0.6rem', fontWeight: 600 }
}

const WorkflowDashboard = _.flow(
  Utils.forwardRefWithName('WorkflowDashboard'),
  wrapWorkspace({
    breadcrumbs: props => [
      ...breadcrumbs.commonPaths.workspaceJobHistory(props),
      breadcrumbs.breadcrumbElement(`submission ${props.submissionId}`, Nav.getLink('workspace-submission-details', props))
    ],
    title: props => `Workflow ${props.workflowId}`, activeTab: 'job history'
  })
)((props, ref) => {
  const { namespace, name, submissionId, workflowId, workspace: { workspace: { bucketName } } } = props

  /*
   * State setup
   */
  const [workflow, setWorkflow] = useState({})
  const [rootCopied, setRootCopied] = useState()
  const [showLog, setShowLog] = useState(false)
  const [failureCopied, setFailureCopied] = useState()

  const signal = Utils.useCancellation()

  /*
   * Data fetchers
   */

  useEffect(() => {
    const initialize = withErrorReporting('Unable to fetch Workflow Details',
      async () => {
        console.log(workflow)
        // If the workflow is empty, or we need to refresh after 60s:
        if (_.isEmpty(workflow) || _.includes(workflow.status, ['Running', 'Submitted'])) {
          if (!_.isEmpty(workflow)) {
            await Utils.delay(60000)
          }
          const includeKey = [
            'backendLogs',
            'backendStatus',
            'end',
            'executionStatus',
            'callCaching:hit',
            'failures',
            'id',
            'jobId',
            'start',
            'status',
            'stderr',
            'stdout',
            'submission',
            'submittedFiles:workflow',
            'subworkflowId',
            'workflowLog',
            'workflowName',
            'workflowRoot'
          ]
          const wf = await Ajax(signal).Workspaces.workspace(namespace, name).submission(submissionId).getWorkflow(workflowId, includeKey)
          setWorkflow(wf)
        }
      })

    initialize()
  }, [workflow]) // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * Data prep
   */
  const {
    end,
    failures,
    start,
    status,
    workflowLog,
    workflowName,
    workflowRoot,
    submittedFiles: { workflow: wdl } = {}
  } = workflow

  const unescapeBackslashes = obj => {
    return JSON.stringify(obj, null, 2).replaceAll('\\\\', '\\')
  }
  
  const restructureFailures = failuresArray => {
    const restructureFailure = failure => {
      const causedBy = failure.causedBy && failure.causedBy.length > 0 ? { causedBy: restructureFailures(failure.causedBy) } : {}
      return {
        message: failure.message,
        ...causedBy
      }
    }

    return _.map(f => restructureFailure(f), failuresArray)
  }

  /*
   * Page render
   */
  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    h(Link, {
      href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId }),
      style: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', padding: '0.5rem 0' }
    }, [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to submission']),
    _.isEmpty(workflow) ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Status', [
        div({ style: { lineHeight: '24px' } }, [makeStatusLine(style => statusIcon(status, style), status)])
      ]),
      makeSection('Timing', [
        table({ style: { marginTop: '0.3rem', lineHeight: '20px' } }, [
          tbody([
            tr([td({ style: styles.sectionTableLabel }, ['Start:']), td([Utils.makeCompleteDate(start)])]),
            tr([td({ style: styles.sectionTableLabel }, ['End:']), td([Utils.makeCompleteDate(end)])])
          ])
        ])
      ]),
      makeSection('Workflow Storage', [
        div({ style: { display: 'flex' } }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            style: Style.noWrapEllipsis,
            href: bucketBrowserUrl(`${bucketName}/${submissionId}/${workflowName}/${workflowId}`),
            tooltip: 'Open in Google Cloud Storage Browser'
          }, [workflowRoot]),
          h(Link, {
            style: { margin: '0 0.5rem' },
            tooltip: 'Copy gs:// URI to clipboard',
            onClick: withErrorReporting('Error copying to clipboard', async () => {
              await clipboard.writeText(workflowRoot)
              setRootCopied(true)
              await Utils.delay(1500)
              setRootCopied(undefined)
            })
          }, [icon(rootCopied ? 'check' : 'copy-to-clipboard')])
        ]),
        div({ style: { marginTop: '1rem' } }, [
          h(Link, { onClick: () => setShowLog(true) }, ['View execution log'])
        ])
      ])
    ]),
    failures && h(Collapse, {
      style: { marginBottom: '1rem'},
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
      collapsed: 2,
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
