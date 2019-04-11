import _ from 'lodash/fp'
import { forwardRef, Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { link, Select } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { textInput } from 'src/components/input'
import { collapseStatus, failedIcon, runningIcon, statusIcon, successIcon } from 'src/components/job-common'
import { FlexTable, Sortable, TextCell, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const SubmissionDetails = _.flow(
  forwardRef,
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  }),
  ajaxCaller
)((props, ref) => {
  const { namespace, name, submissionId, ajax: { Workspaces }, workspace: { workspace: { bucketName } } } = props

  const [submission, setSubmission] = useState({})
  const [methodAccessible, setMethodAccessible] = useState()
  const [statusFilter, setStatusFilter] = useState([])
  const [textFilter, setTextFilter] = useState('')
  const [sort, setSort] = useState({ field: 'workflowEntity', direction: 'asc' })

  const getSubmission = Workspaces.workspace(namespace, name).submission(submissionId).get
  const initialize = async () => {
    try {
      const submission = await getSubmission()
      setSubmission(submission)
    } catch (e) {
      reportError('Unable to fetch submission details', e)
    }

    try {
      const { methodConfigurationName: configName, methodConfigurationNamespace: configNamespace } = submission
      await Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).get()
      setMethodAccessible(true)
    } catch {
      setMethodAccessible(false)
    }
  }

  const anyRunning = () => _.some(({ status }) => collapseStatus(status) === 'running', workflows)

  Utils.useOnMount(() => { initialize() })
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const submission = await getSubmission()
        setSubmission(submission)
      } catch (e) {
        reportError('Unable to update submission details', e)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [getSubmission])

  const {
    cost, methodConfigurationName: workflowName, methodConfigurationNamespace: workflowNamespace, submissionDate,
    submissionEntity: { entityType, entityName } = {}, submitter, useCallCache, workflows = []
  } = submission

  const filteredWorkflows = _.flow(
    _.filter(wf => {
      if (_.isEmpty(statusFilter) || statusFilter.includes(wf.status)) {
        const wfAsText = JSON.stringify(_.values(wf))
        return _.every(term => Utils.textMatch(term, wfAsText), textFilter.split(/s+/))
      } else {
        return false
      }
    }),
    _.sortBy(sort.field),
    sort.direction === 'asc' ? _.identity : _.reverse
  )(workflows)


  const makeStatusLine = (iconFn, text) => div({ style: { display: 'flex', marginTop: '0.5rem', fontSize: 14 } }, [
    iconFn({ marginRight: '0.5rem' }), text
  ])

  const makeSection = (label, children) => div({ style: { flexBasis: '33%', marginBottom: '1rem' } }, [
    div({ style: Style.elements.sectionHeader }, label),
    h(Fragment, children)
  ])

  const { succeeded, failed, running } = _.groupBy(wf => collapseStatus(wf.status), workflows)

  return _.isEmpty(submission) ? centeredSpinner() : div({ style: { padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    div({ style: { display: 'flex' } }, [
      div({ style: { flexBasis: 200, marginRight: '2rem', lineHeight: '24px' } }, [
        div({ style: Style.elements.sectionHeader }, 'Workflow Statuses'),
        succeeded && makeStatusLine(successIcon, `Succeeded: ${succeeded.length}`),
        failed && makeStatusLine(failedIcon, `Failed: ${failed.length}`),
        running && makeStatusLine(runningIcon, `Running: ${running.length}`)
      ]),
      div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
        makeSection('Workflow Configuration',
          Utils.cond(
            [methodAccessible, () => [link(
              { href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }) },
              [`${workflowNamespace}/${workflowName}`]
            )]],
            [methodAccessible === false,
              () => [div({ style: { display: 'flex', alignItems: 'center' } }, [
                `${workflowNamespace}/${workflowName}`,
                h(TooltipTrigger, {
                  content: 'This configuration was updated or deleted since this submission ran.'
                }, [
                  icon('ban', { size: 16, style: { color: colors.orange[0], marginLeft: '0.3rem' } })
                ])
              ])]],
            () => [`${workflowNamespace}/${workflowName}`]
          )
        ),
        makeSection('Submitted by', [
          div([submitter]), Utils.makeCompleteDate(submissionDate)
        ]),
        makeSection('Total Run Cost', [cost ? Utils.formatUSD(cost) : 'N/A']),
        makeSection('Data Entity', [`${entityName} (${entityType})`]),
        makeSection('Submission ID', [link(
          { href: bucketBrowserUrl(`${bucketName}/${submissionId}`), target: '_blank' },
          submissionId
        )]),
        makeSection('Call Caching', [useCallCache ? 'Enabled' : 'Disabled'])
      ])
    ]),
    div({ style: { margin: '1rem 0', display: 'flex' } }, [
      textInput({
        style: { marginRight: '2rem', flexBasis: 300, borderColor: colors.gray[3] },
        placeholder: 'Filter',
        onChange: ({ target: { value } }) => setTextFilter(value),
        value: textFilter
      }),
      div({ style: { flexBasis: 350 } }, [
        h(Select, {
          isClearable: true,
          isMulti: true,
          isSearchable: false,
          placeholder: 'Completion status',
          value: statusFilter,
          onChange: data => setStatusFilter(_.map('value', data)),
          options: Utils.workflowStatuses
        })
      ])
    ]),
    div({ style: { flex: 1 } }, [
      !filteredWorkflows.length ? 'No matching workflows.' : h(AutoSizer, [({ width, height }) => h(FlexTable, {
        width, height,
        rowCount: filteredWorkflows.length,
        columns: [
          {
            size: { basis: 75, grow: 0 },
            headerRenderer: () => {},
            cellRenderer: ({ rowIndex }) => {
              return link({
                target: '_blank',
                href: `${getConfig().jobManagerUrlRoot}/${filteredWorkflows[rowIndex].workflowId}`,
                style: { flexGrow: 1, textAlign: 'center' }
              }, ['View'])
            }
          }, {
            size: { basis: 225, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'workflowEntity', onSort: setSort }, ['Data Entity']),
            cellRenderer: ({ rowIndex }) => {
              const { entityName, entityType } = filteredWorkflows[rowIndex].workflowEntity
              return h(TooltipCell, [`${entityName} (${entityType})`])
            }
          }, {
            size: { basis: 225, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'statusLastChangedDate', onSort: setSort }, ['Last Changed']),
            cellRenderer: ({ rowIndex }) => {
              return h(TextCell, [Utils.makeCompleteDate(filteredWorkflows[rowIndex].statusLastChangedDate)])
            }
          }, {
            size: { basis: 150, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const { status } = filteredWorkflows[rowIndex]
              return div({ style: { display: 'flex' } }, [statusIcon(status, { marginRight: '0.5rem' }), status])
            }
          }, {
            size: { basis: 125, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'cost', onSort: setSort }, ['Run Cost']),
            cellRenderer: ({ rowIndex }) => {
              return cost ? h(TextCell, [Utils.formatUSD(filteredWorkflows[rowIndex].cost)]) : 'N/A'
            }
          }, {
            size: { basis: 200 },
            headerRenderer: () => h(Sortable, { sort, field: 'messages', onSort: setSort }, ['Messages']),
            cellRenderer: ({ rowIndex }) => {
              return h(TooltipCell, [h(Fragment, _.map(div, filteredWorkflows[rowIndex].messages))])
            }
          }, {
            size: { basis: 150, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'workflowId', onSort: setSort }, ['Workflow ID']),
            cellRenderer: ({ rowIndex }) => {
              const { workflowId, inputResolutions: [{ inputName }] } = filteredWorkflows[rowIndex]
              return h(TooltipCell, { tooltip: workflowId }, [
                link({
                  target: '_blank',
                  href: bucketBrowserUrl(`${bucketName}/${submissionId}/${inputName.split('.')[0]}/${workflowId}`)
                }, [workflowId])
              ])
            }
          }
        ]
      })])
    ])
  ])
})

export const addNavPaths = () => {
  Nav.defPath('workspace-submission-details', {
    path: '/workspaces/:namespace/:name/job_history/:submissionId',
    component: SubmissionDetails,
    title: ({ name }) => `${name} - Submission Details`
  })
}
