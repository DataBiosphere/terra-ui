import _ from 'lodash/fp'
import { forwardRef, Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Link, Select } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { collapseStatus, failedIcon, runningIcon, statusIcon, submittedIcon, successIcon } from 'src/components/job-common'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, Sortable, TextCell, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { SubmissionQueueStatus } from 'src/pages/workspaces/workspace/SubmissionQueueStatus'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const SubmissionDetails = _.flow(
  forwardRef,
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  })
)((props, ref) => {
  const { namespace, name, submissionId, workspace: { workspace: { bucketName } } } = props

  /*
   * State setup
   */
  const [submission, setSubmission] = useState({})
  const [methodAccessible, setMethodAccessible] = useState()
  const [statusFilter, setStatusFilter] = useState([])
  const [textFilter, setTextFilter] = useState('')
  const [sort, setSort] = useState({ field: 'workflowEntity', direction: 'asc' })
  const { Workspaces } = Ajax(useCancellation())

  /*
   * Data fetchers
   */

  useEffect(() => {
    const initialize = withErrorReporting('Unable to fetch submission details',
      async () => {
        if (_.isEmpty(submission) || _.some(({ status }) => collapseStatus(status) === 'running', submission.workflows)) {
          if (!_.isEmpty(submission)) {
            await Utils.delay(60000)
          }
          const sub = _.update(
            ['workflows'],
            _.map(wf => {
              const {
                cost, inputResolutions, messages, status,
                statusLastChangedDate, workflowEntity: { entityType, entityName } = {}, workflowId
              } = wf

              const wfAsText = _.join(' ', [
                cost, ...messages, status, statusLastChangedDate, entityType, entityName, workflowId,
                ..._.flatMap(({ inputName, value }) => [inputName, JSON.stringify(value)], inputResolutions)
              ]).toLowerCase()

              return _.set('asText', wfAsText, wf)
            }),
            await Workspaces.workspace(namespace, name).submission(submissionId).get())

          setSubmission(sub)

          if (_.isEmpty(submission)) {
            try {
              const { methodConfigurationName: configName, methodConfigurationNamespace: configNamespace } = sub
              await Workspaces.workspace(namespace, name).methodConfig(configNamespace, configName).get()
              setMethodAccessible(true)
            } catch {
              setMethodAccessible(false)
            }
          }
        }
      })

    initialize()
  }, [submission]) // eslint-disable-line react-hooks/exhaustive-deps


  /*
   * Sub-component constructors
   */
  const makeStatusLine = (iconFn, text) => div({ style: { display: 'flex', marginTop: '0.5rem', fontSize: 14 } }, [
    iconFn({ marginRight: '0.5rem' }), text
  ])

  const makeSection = (label, children) => div({
    style: {
      flex: '0 0 33%', padding: '0 0.5rem 0.5rem',
      whiteSpace: 'pre', textOverflow: 'ellipsis', overflow: 'hidden'
    }
  }, [
    div({ style: Style.elements.sectionHeader }, label),
    h(Fragment, children)
  ])

  /*
   * Data prep
   */
  const {
    cost, methodConfigurationName: workflowName, methodConfigurationNamespace: workflowNamespace, submissionDate,
    submissionEntity: { entityType, entityName } = {}, submitter, useCallCache, workflows = []
  } = submission

  const filteredWorkflows = _.flow(
    _.filter(({ status, asText }) => {
      if (_.isEmpty(statusFilter) || statusFilter.includes(status)) {
        return _.every(term => asText.includes(term.toLowerCase()), textFilter.split(/\s+/))
      } else {
        return false
      }
    }),
    _.sortBy(sort.field),
    sort.direction === 'asc' ? _.identity : _.reverse
  )(workflows)

  const { succeeded, failed, running, submitted } = _.groupBy(wf => collapseStatus(wf.status), workflows)
  /*
   * Page render
   */
  return _.isEmpty(submission) ? centeredSpinner() : div({ style: { padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    div({ style: { display: 'flex' } }, [
      div({ style: { flex: '0 0 200px', marginRight: '2rem', lineHeight: '24px' } }, [
        div({ style: Style.elements.sectionHeader }, 'Workflow Statuses'),
        succeeded && makeStatusLine(successIcon, `Succeeded: ${succeeded.length}`),
        failed && makeStatusLine(failedIcon, `Failed: ${failed.length}`),
        running && makeStatusLine(runningIcon, `Running: ${running.length}`),
        submitted && makeStatusLine(submittedIcon, `Submitted: ${submitted.length}`)
      ]),
      div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
        makeSection('Workflow Configuration',
          Utils.cond(
            [methodAccessible, () => [h(Link,
              { href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }) },
              [`${workflowNamespace}/${workflowName}`]
            )]],
            [methodAccessible === false,
              () => [div({ style: { display: 'flex', alignItems: 'center' } }, [
                `${workflowNamespace}/${workflowName}`,
                h(TooltipTrigger, {
                  content: 'This configuration was updated or deleted since this submission ran.'
                }, [
                  icon('ban', { size: 16, style: { color: colors.warning(), marginLeft: '0.3rem' } })
                ])
              ])]],
            () => [`${workflowNamespace}/${workflowName}`]
          )
        ),
        makeSection('Submitted by', [
          div([submitter]), Utils.makeCompleteDate(submissionDate)
        ]),
        makeSection('Total Run Cost', [cost ? Utils.formatUSD(cost) : 'N/A']),
        makeSection('Data Entity', [div([entityName]), div([entityType])]),
        makeSection('Submission ID', [h(Link,
          { href: bucketBrowserUrl(`${bucketName}/${submissionId}`), ...Utils.newTabLinkProps },
          submissionId
        )]),
        makeSection('Call Caching', [useCallCache ? 'Enabled' : 'Disabled'])
      ])
    ]),
    div({ style: { margin: '1rem 0', display: 'flex', alignItems: 'center' } }, [
      h(DelayedSearchInput, {
        style: { marginRight: '2rem', flexBasis: 300, borderColor: colors.dark(0.55) },
        placeholder: 'Search',
        'aria-label': 'Search',
        onChange: setTextFilter,
        value: textFilter
      }),
      div({ style: { flexBasis: 350 } }, [
        h(Select, {
          isClearable: true,
          isMulti: true,
          isSearchable: false,
          placeholder: 'Completion status',
          'aria-label': 'Completion status',
          value: statusFilter,
          onChange: data => setStatusFilter(_.map('value', data)),
          options: Utils.workflowStatuses
        })
      ]),
      div({ style: { flexGrow: '1' } }),
      h(PopupTrigger, {
        content: div({ style: { margin: '0.5rem' } }, [h(SubmissionQueueStatus)]),
        side: 'bottom'
      }, [h(Link, ['Queue Status'])])
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
              const { workflowId } = filteredWorkflows[rowIndex]
              return workflowId && h(Link, {
                ...Utils.newTabLinkProps,
                href: `${getConfig().jobManagerUrlRoot}/${workflowId}`,
                style: { flexGrow: 1, textAlign: 'center' }
              }, ['View'])
            }
          }, {
            size: { basis: 225, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'workflowEntity', onSort: setSort }, ['Data Entity']),
            cellRenderer: ({ rowIndex }) => {
              const { workflowEntity: { entityName, entityType } = {} } = filteredWorkflows[rowIndex]
              return h(TooltipCell, [entityName && `${entityName} (${entityType})`])
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
              const { workflowId, inputResolutions: [{ inputName } = {}] } = filteredWorkflows[rowIndex]
              return h(TooltipCell, { tooltip: workflowId }, [
                inputName ? h(Link, {
                  ...Utils.newTabLinkProps,
                  href: inputName && bucketBrowserUrl(`${bucketName}/${submissionId}/${inputName.split('.')[0]}/${workflowId}`)
                }, [workflowId]) : workflowId
              ])
            }
          }
        ]
      })])
    ])
  ])
})

export const navPaths = [
  {
    name: 'workspace-submission-details',
    path: '/workspaces/:namespace/:name/job_history/:submissionId',
    component: SubmissionDetails,
    title: ({ name }) => `${name} - Submission Details`
  }
]
