import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import StepButtons from 'src/components/StepButtons'
import { FlexTable } from 'src/components/table'
import { Ajax, useCancellation } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const extractFailures = ({ calls }) =>  {
  return _.flatMap(([taskName, attempts]) => {

// iterate over the attempts and return error messages for statuses

  }, _.toPairs(calls))

//  filter out this type of error message: RetryableFailure
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

  Utils.useOnMount(() => {
    const loadData = async () => {
      const wfData = await Ajax(signal).Workflows.workflow(jobId).metadata()

      setWorkflowData(wfData)
    }

    loadData()
  })

  const calls = _.map(([name, attempts]) => ({ name: _.split('.', name)[1], attempts }), _.toPairs(callsObj))

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
