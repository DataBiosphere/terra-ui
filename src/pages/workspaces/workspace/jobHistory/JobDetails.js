import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import StepButtons from 'src/components/StepButtons'
import { FlexTable } from 'src/components/table'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const extractFailures = ({ calls } = {}) => {
  return _.flatMap(([taskName, attempts]) => {
    return _.flow(
      _.filter(attempt => {
        return attempt.executionStatus !== 'RetryableFailure' && attempt.failures
      }),
      _.map(attempt => {
        return { taskName, attempt }
      })
    )(attempts)
  }, _.toPairs(calls))
}

const JobDetails = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Job Details', activeTab: 'job history'
})(({ namespace, name, submissionId, jobId }) => {
  const signal = useCancellation()
  const [activeTab, setActiveTab] = useState('list')
  const [selectedCall, setSelectedCall] = useState()
  const [workflowData, setWorkflowData] = useState()
  const { workflowName, id, workflowRoot, inputs, outputs, labels, status, end, start, failures, calls: callsObj } = workflowData || {}

  const cache = Utils.useInstance(() => new CellMeasurerCache({
    minHeight: 10,
    fixedWidth: true
  }))

  Utils.useOnMount(() => {
    const loadData = async () => {
      const wfData = await Ajax(signal).Workflows.workflow(jobId).metadata()

      setWorkflowData(wfData)
    }

    loadData()
  })

  const calls = _.map(([name, attempts]) => ({ name: _.split('.', name)[1], attempts }), _.toPairs(callsObj))
  const callFailures = extractFailures(workflowData)

  return div({ style: { padding: '1rem' } }, [
    h(Link, {
      href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId }),
      style: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', padding: '0.5rem 0' }
    }, [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to submission']),
    !!workflowData ? h(Fragment, [div(['Name: ', workflowName]),
      div({ style: { display: 'flex' } }, [
        div({ style: Style.elements.card.container }, ['Status:', status]),
        div({ style: Style.elements.card.container }, ['Failures:', JSON.stringify(failures)])
      ]),
      selectedCall === undefined ? h(Fragment, [
        h(StepButtons, {
          tabs: [
            { key: 'list', title: 'Tasks and sub-workflows', isValid: true },
            { key: 'errors', title: 'Errors', isValid: true },
            { key: 'inputs', title: 'Inputs', isValid: true },
            { key: 'outputs', title: 'Outputs', isValid: true },
            { key: 'labels', title: 'Labels', isValid: true },
            { key: 'timing', title: 'Timing diagram', isValid: true }
          ],
          activeTab,
          onChangeTab: setActiveTab
        }),
        Utils.switchCase(activeTab,
          ['list', () => {
            return div({ style: { height: 500 } }, [
              h(AutoSizer, [
                ({ width, height }) => h(FlexTable, {
                  width, height,
                  rowCount: calls.length,
                  columns: [
                    {
                      size: { grow: 5 },
                      headerRenderer: () => 'Name',
                      cellRenderer: ({ rowIndex }) => h(Link, { onClick: () => setSelectedCall(rowIndex) }, [calls[rowIndex].name])
                    },
                    {
                      headerRenderer: () => 'Status',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Start',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Duration',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Inputs',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Outputs',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Links',
                      cellRenderer: () => 'x'
                    },
                    {
                      headerRenderer: () => 'Attempts',
                      cellRenderer: () => 'x'
                    }
                  ]
                })
              ])
            ])
          }],
          ['errors', () => {
            return div({ style: { height: 500 } }, [
              h(AutoSizer, { onResize: () => cache.clearAll() }, [
                ({ width, height }) => h(FlexTable, {
                  width, height,
                  deferredMeasurementCache: cache,
                  rowCount: callFailures.length,
                  rowHeight: cache.rowHeight,
                  columns: [
                    {
                      headerRenderer: () => 'Task Name',
                      cellRenderer: ({ rowIndex }) => callFailures[rowIndex].taskName.split('.')[1]
                    },
                    {
                      headerRenderer: () => 'Shard Index',
                      cellRenderer: ({ rowIndex }) => {
                        const { shardIndex } = callFailures[rowIndex].attempt
                        return shardIndex !== -1 ? shardIndex : null
                      }
                    },
                    {
                      size: { grow: 2 },
                      headerRenderer: () => 'Message',
                      cellRenderer: ({ rowIndex, parent }) => {
                        const { failures } = callFailures[rowIndex].attempt
                        return h(CellMeasurer, { cache, columnIndex: 0, parent, rowIndex }, [
                          div({ style: { padding: '0.5rem 0' } }, [_.map('message', failures).join(' ')])
                        ])
                      }
                    },
                    {
                      size: { basis: 100, grow: 0 },
                      headerRenderer: () => 'Information',
                      cellRenderer: ({rowIndex}) => {
                        const gsUri = callFailures[rowIndex].attempt.callRoot
                        console.log(gsUri)
                        return div([
                          h(Link, {
                            tooltip: 'Open execution directory in cloud console',
                            'aria-label': 'Open execution directory in cloud console',
                            ...Utils.newTabLinkProps,
                            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)/)[1])
                          }, [icon('folder')])
                        ])
                      }
                    }
                  ]
                })
              ])
            ])
          }]
        )
      ]) :
        h(Fragment, [
          div([h(Link, { onClick: () => setSelectedCall(undefined) }, [workflowName]), '/', calls[selectedCall].name]),
          JSON.stringify(calls[selectedCall])
        ])]) :
      centeredSpinner()
  ])
})

export const navPaths = [
  {
    name: 'workspace-job-details',
    path: '/workspaces/:namespace/:name/job-history/:submissionId/:jobId',
    component: JobDetails,
    title: () => `Job details`
  }
]
