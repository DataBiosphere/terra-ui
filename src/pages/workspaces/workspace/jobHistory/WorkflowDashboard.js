import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, table, tbody, td, tr } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { makeSection, makeStatusLine, statusIcon } from 'src/components/job-common'
import { TooltipCell } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { cond } from 'src/libs/utils'
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
    status,
    start,
    end,
    failures,
    workflowRoot,
    workflowName
  } = workflow

  const stringifyAndNewline = string => {
    return JSON.stringify(string, null, 2).replaceAll('\\n', '\n').replaceAll('\\"', '"')
  }

  const fakeExampleFailure = [{
    "message": "error 1",
    "causedBy": [{
      "message": "error1.1",
      "causedBy": []
    }, {
      "message": "error1.1",
      "causedBy": []
    }]
  },
  {
    "message": "error 2",
    "causedBy": [{
      "message": "error2.1",
      "causedBy": []
    }, {
      "message": "error2.2",
      "causedBy": [{
        "message": "error 2.2.1",
        "causedBy": [{
          "message": "error2.2.1.1",
          "causedBy": []
        }, {
          "message": "error2.2.1.2",
          "causedBy": []
        }]
      }]
    }]
  }]

  const realExampleFailure =  [{
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [],
                    message: 'Read timed out'
                  }
                ],
                message: 'java.net.SocketTimeoutException: Read timed out\nblah\nblah\nblah'
              }
            ],
            message: '[Attempted 10 time(s)] - GcsBatchFlow.BatchFailedException: java.net.SocketTimeoutException: Read timed out'
          },
          {
            causedBy: [
              {
                causedBy: [
                  {
                    causedBy: [],
                    message: 'Read timed out'
                  }
                ],
                message: 'java.net.SocketTimeoutException: Read timed out'
              }
            ],
            message: 'PART 2!! [Attempted 10 time(s)] - GcsBatchFlow.BatchFailedException: java.net.SocketTimeoutException: Read timed out'
          }
        ]


  const treeProps = {
    name: false,
    collapsed: 2,
    collapseStringsAfterLength: 50,
    displayDataTypes: false,
    displayObjectSize: false
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
    _.isEmpty(workflow) ? centeredSpinner(): div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
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
      makeSection('Workflow-Level Failure', [
        failures ? h(ReactJson, { ...treeProps, src: restructureFailures(failures) }) : 'No workflow level failures'
      ]
      ),
      makeSection('Real example failure', [
        h(ReactJson, { ...treeProps, src: restructureFailures(realExampleFailure) })
      ]),
      makeSection('Fake example failure', [
        h(ReactJson, { ...treeProps, src: restructureFailures(fakeExampleFailure) })
      ]),
      makeSection('Workflow Storage', [
        h(TooltipCell, { tooltip: workflowId }, [
          h(Link, {
            ...Utils.newTabLinkProps,
            style: { lineHeight: '1.5' },
            href: bucketBrowserUrl(`${bucketName}/${submissionId}/${workflowName}/${workflowId}`)
          }, ['🔗 Workflow Execution Root'])
        ])
      ])
    ])
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
