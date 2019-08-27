import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import StepButtons from 'src/components/StepButtons'
import { FlexTable } from 'src/components/table'
import * as Style from 'src/libs/style'
import { switchCase } from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const JobDetails = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Job Details', activeTab: 'job history'
})(() => {
  const [activeTab, setActiveTab] = useState('list')
  return div({ style: { padding: '1rem' } }, [
    div(['stuff']),
    div(['stuff']),
    div({ style: { display: 'flex' } }, [
      div({ style: Style.elements.card.container }, ['hi']),
      div({ style: Style.elements.card.container }, ['hi'])
    ]),
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
    switchCase(activeTab,
      ['list', () => {
        return div({ style: { height: 500 } }, [
          h(AutoSizer, [
            ({ width, height }) => h(FlexTable, {
              width, height,
              rowCount: 10,
              columns: [
                {
                  size: { grow: 5 },
                  headerRenderer: () => 'Name',
                  cellRenderer: () => 'x'
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
