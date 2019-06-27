import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, Clickable, link, spinnerOverlay } from 'src/components/common'
import { DelayedSearchInput } from 'src/components/input'
import { collapseStatus, failedIcon, runningIcon, submittedIcon, successIcon } from 'src/components/job-common'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, HeaderCell, TextCell, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { SubmissionQueueStatus } from 'src/pages/workspaces/workspace/SubmissionQueueStatus'
import { rerunFailures } from 'src/pages/workspaces/workspace/tools/FailureRerunner'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  submissionsTable: {
    padding: '1rem', flex: 1
  },
  deemphasized: {
    color: colors.dark(0.7)
  },
  statusDetailCell: {
    align: 'center',
    style: { padding: '0.5rem' }
  }
}


const isTerminal = submissionStatus => submissionStatus === 'Aborted' || submissionStatus === 'Done'


const collapsedStatuses = _.flow(
  _.toPairs,
  _.map(([status, count]) => ({ [collapseStatus(status)]: count })),
  _.reduce(_.mergeWith(_.add), {})
)

const statusCell = workflowStatuses => {
  const { succeeded, failed, running, submitted } = collapsedStatuses(workflowStatuses)

  return h(TooltipTrigger, {
    side: 'bottom',
    type: 'light',
    content: table({ style: { margin: '0.5rem' } }, [
      tbody({}, [
        tr({}, [
          td(styles.statusDetailCell, [successIcon()]),
          td(styles.statusDetailCell, [failedIcon()]),
          td(styles.statusDetailCell, [runningIcon()]),
          td(styles.statusDetailCell, [submittedIcon()])
        ]),
        tr({}, [
          td(styles.statusDetailCell, [succeeded || 0]),
          td(styles.statusDetailCell, [failed || 0]),
          td(styles.statusDetailCell, [running || 0]),
          td(styles.statusDetailCell, [submitted || 0])
        ])
      ])
    ])
  }, [
    div([
      succeeded && successIcon({ marginRight: '0.5rem' }),
      failed && failedIcon({ marginRight: '0.5rem' }),
      running && runningIcon({ marginRight: '0.5rem' }),
      submitted && submittedIcon({ marginRight: '0.5rem' })
    ])
  ])
}


const JobHistory = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  }),
  ajaxCaller
)(class JobHistory extends Component {
  constructor(props) {
    super(props)

    this.state = {
      submissions: undefined,
      loading: false,
      aborting: false,
      textFilter: ''
    }
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces } } = this.props

    try {
      this.setState({ loading: true })
      const submissions = _.flow(
        _.orderBy('submissionDate', 'desc'),
        _.map(sub => {
          const {
            methodConfigurationName, methodConfigurationNamespace, status, submissionDate,
            submissionEntity: { entityType, entityName } = {}, submissionId, submitter
          } = sub

          const subAsText = _.join(' ', [
            methodConfigurationName, methodConfigurationNamespace, status, submissionDate, entityType, entityName, submissionId, submitter
          ]).toLowerCase()

          return _.set('asText', subAsText, sub)
        })
      )(await Workspaces.workspace(namespace, name).listSubmissions())

      this.setState({ submissions })

      if (_.some(({ status }) => !isTerminal(status), submissions)) {
        this.scheduledRefresh = setTimeout(() => this.refresh(), 1000 * 60)
      }
    } catch (error) {
      reportError('Error loading submissions list', error)
      this.setState({ submissions: [] })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { namespace, name, workspace: { workspace: { bucketName } } } = this.props
    const { submissions, loading, aborting, textFilter } = this.state

    const filteredSubmissions = _.filter(({ asText }) => _.every(term => asText.includes(term.toLowerCase()), textFilter.split(/\s+/)), submissions)

    return h(Fragment, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', margin: '1rem 1rem 0' } }, [
        h(PopupTrigger, {
          content: div({ style: { margin: '0.5rem' } }, [h(SubmissionQueueStatus)]),
          side: 'bottom'
        }, [link({}, ['Queue Status'])]),
        h(DelayedSearchInput, {
          style: { width: 300, marginLeft: '1rem' },
          placeholder: 'Search',
          onChange: v => this.setState({ textFilter: v }),
          defaultValue: textFilter
        })
      ]),
      div({ style: styles.submissionsTable }, [
        !_.isEmpty(filteredSubmissions) && h(AutoSizer, [
          ({ width, height }) => h(FlexTable, {
            width, height, rowCount: filteredSubmissions.length,
            hoverHighlight: true,
            columns: [
              {
                size: { basis: 500, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Submission (click for details)']),
                cellRenderer: ({ rowIndex }) => {
                  const {
                    methodConfigurationNamespace, methodConfigurationName, submitter, submissionId, workflowStatuses
                  } = filteredSubmissions[rowIndex]
                  const { failed, running } = collapsedStatuses(workflowStatuses)

                  return h(Clickable, {
                    as: 'a',
                    hover: { backgroundColor: Utils.cond([!!failed, colors.danger(0.2)], [!!running, colors.accent(0.2)], colors.success(0.2)) },
                    style: {
                      flex: 1, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      margin: '0 -1rem', padding: '0 1rem', minWidth: 0,
                      color: 'unset', fontWeight: 500,
                      backgroundColor: Utils.cond([!!failed, colors.danger(0.1)], [!!running, colors.accent(0.1)], colors.success(0.1))
                    },
                    href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId })
                  }, [
                    div({ style: Style.noWrapEllipsis }, [
                      methodConfigurationNamespace !== namespace && span({ style: styles.deemphasized }, [
                        `${methodConfigurationNamespace}/`
                      ]),
                      methodConfigurationName
                    ]),
                    div({ style: Style.noWrapEllipsis }, [
                      span({ style: styles.deemphasized }, 'Submitted by '),
                      submitter
                    ])
                  ])
                }
              },
              {
                size: { basis: 250, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Data entity']),
                cellRenderer: ({ rowIndex }) => {
                  const { submissionEntity: { entityName, entityType } = {} } = filteredSubmissions[rowIndex]
                  return h(TooltipCell, [entityName && `${entityName} (${entityType})`])
                }
              },
              {
                size: { basis: 170, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['No. of Workflows']),
                cellRenderer: ({ rowIndex }) => {
                  const { workflowStatuses } = filteredSubmissions[rowIndex]
                  return h(TextCell, Utils.formatNumber(_.sum(_.values(workflowStatuses))))
                }
              },
              {
                size: { basis: 150, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Status']),
                cellRenderer: ({ rowIndex }) => {
                  const { workflowStatuses, status } = filteredSubmissions[rowIndex]
                  return h(Fragment, [
                    statusCell(workflowStatuses), _.keys(collapsedStatuses(workflowStatuses)).length === 1 && status
                  ])
                }
              },
              {
                size: { min: 220, max: 220 },
                headerRenderer: () => h(HeaderCell, ['Actions']),
                cellRenderer: ({ rowIndex }) => {
                  const {
                    methodConfigurationNamespace, methodConfigurationName, submissionId, workflowStatuses,
                    status, submissionEntity
                  } = filteredSubmissions[rowIndex]
                  return h(Fragment, [
                    (!isTerminal(status) && status !== 'Aborting') && buttonPrimary({
                      onClick: () => this.setState({ aborting: submissionId })
                    }, ['Abort workflows']),
                    isTerminal(status) && (workflowStatuses['Failed'] || workflowStatuses['Aborted']) &&
                    submissionEntity && buttonPrimary({
                      onClick: () => rerunFailures({
                        namespace,
                        name,
                        submissionId,
                        configNamespace: methodConfigurationNamespace,
                        configName: methodConfigurationName,
                        onDone: () => this.refresh()
                      })
                    }, ['Relaunch failures'])
                  ])
                }
              },
              {
                size: { basis: 150, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Submitted']),
                cellRenderer: ({ rowIndex }) => {
                  const { submissionDate } = filteredSubmissions[rowIndex]
                  return h(TooltipCell, { tooltip: Utils.makeCompleteDate(submissionDate) }, [Utils.makePrettyDate(submissionDate)])
                }
              },
              {
                size: { basis: 150, grow: 1 },
                headerRenderer: () => h(HeaderCell, ['Submission ID']),
                cellRenderer: ({ rowIndex }) => {
                  const { submissionId } = filteredSubmissions[rowIndex]
                  return h(TooltipCell, { tooltip: submissionId }, [
                    link({
                      ...Utils.newTabLinkProps,
                      href: bucketBrowserUrl(`${bucketName}/${submissionId}`)
                    }, [submissionId])
                  ])
                }
              }
            ]
          })
        ]),
        _.isEmpty(filteredSubmissions) && div(['No jobs']),
        aborting && h(Modal, {
          onDismiss: () => this.setState({ aborting: undefined }),
          title: 'Abort All Workflows',
          showX: true,
          okButton: () => {
            Ajax().Workspaces.workspace(namespace, name).submission(aborting).abort()
              .then(() => this.refresh())
              .catch(e => this.setState({ loading: false }, () => reportError('Error aborting submission', e)))
            this.setState({ aborting: undefined, loading: true })
          }
        }, [
          `Are you sure you want to abort ${
            Utils.formatNumber(collapsedStatuses(_.find({ submissionId: aborting }, filteredSubmissions).workflowStatuses).running)
          } running workflow(s)?`
        ]),
        loading && spinnerOverlay
      ])
    ])
  }

  async componentDidMount() {
    this.refresh()
  }

  componentWillUnmount() {
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh)
    }
  }
})


export const navPaths = [
  {
    name: 'workspace-job-history',
    path: '/workspaces/:namespace/:name/job_history',
    component: JobHistory,
    title: ({ name }) => `${name} - Job History`
  }
]
