import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, Clickable, link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { FlexTable, HeaderCell, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { rerunFailures } from 'src/pages/workspaces/workspace/tools/FailureRerunner'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


export const linkToJobManager = true

const styles = {
  submissionsTable: {
    padding: '1rem', flex: 1
  },
  deemphasized: {
    color: colors.gray[1]
  },
  statusDetailCell: {
    align: 'center',
    style: { padding: '0.5rem' }
  }
}


const collapseStatus = status => {
  switch (status) {
    case 'Succeeded':
      return 'succeeded'
    case 'Aborting':
    case 'Aborted':
    case 'Failed':
      return 'failed'
    default:
      return 'running'
  }
}

const isTerminal = submissionStatus => submissionStatus === 'Aborted' || submissionStatus === 'Done'

const successIcon = style => icon('check', { size: 24, style: { color: colors.green[0], ...style } })
const failedIcon = style => icon('warning-standard', { className: 'is-solid', size: 24, style: { color: colors.red[0], ...style } })
const runningIcon = style => icon('sync', { size: 24, style: { color: colors.green[0], ...style } })


export const flagNewSubmission = submissionId => {
  sessionStorage.setItem('new-submission', submissionId)
}

const collapsedStatuses = _.flow(
  _.toPairs,
  _.map(([status, count]) => ({ [collapseStatus(status)]: count })),
  _.reduce(_.mergeWith(_.add), {})
)

const statusCell = workflowStatuses => {
  const { succeeded, failed, running } = collapsedStatuses(workflowStatuses)

  return h(TooltipTrigger, {
    side: 'bottom',
    type: 'light',
    content: table({ style: { margin: '0.5rem' } }, [
      tbody({}, [
        tr({}, [
          td(styles.statusDetailCell, [successIcon()]),
          td(styles.statusDetailCell, [failedIcon()]),
          td(styles.statusDetailCell, [runningIcon()])
        ]),
        tr({}, [
          td(styles.statusDetailCell, [succeeded || 0]),
          td(styles.statusDetailCell, [failed || 0]),
          td(styles.statusDetailCell, [running || 0])
        ])
      ])
    ])
  }, [
    div([
      succeeded && successIcon({ marginRight: '0.5rem' }),
      failed && failedIcon({ marginRight: '0.5rem' }),
      running && runningIcon({ marginRight: '0.5rem' })
    ])
  ])
}

const animationLengthMillis = 1000


const JobHistory = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  }),
  ajaxCaller
)(class JobHistory extends Component {
  constructor(props) {
    super(props)

    const newSubmissionId = sessionStorage.getItem('new-submission')
    if (newSubmissionId) {
      sessionStorage.removeItem('new-submission')
      this.state = { newSubmissionId, highlightNewSubmission: true }
    }
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces } } = this.props

    try {
      this.setState({ loading: true })
      const submissions = _.orderBy('submissionDate', 'desc', await Workspaces.workspace(namespace, name).listSubmissions())
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

    if (this.state.newSubmissionId) {
      await Utils.waitOneTick()
      this.setState({ highlightNewSubmission: false })
      await Utils.delay(animationLengthMillis)
      this.setState({ newSubmissionId: undefined })
    }
  }

  render() {
    const { namespace, name, ajax: { Workspaces }, workspace: { workspace: { workflowCollectionName } } } = this.props
    const { submissions, loading, aborting, newSubmissionId, highlightNewSubmission, linkToFC } = this.state

    return div({ style: styles.submissionsTable }, [
      submissions && !!submissions.length && h(AutoSizer, [
        ({ width, height }) => h(FlexTable, {
          width, height, rowCount: submissions.length,
          hoverHighlight: true,
          styleRow: rowIndex => {
            const { submissionId } = submissions[rowIndex]
            if (newSubmissionId === submissionId) {
              return {
                transition: `background-color ${animationLengthMillis}ms cubic-bezier(0.33, -2, 0.74, 0.05)`,
                backgroundColor: highlightNewSubmission ? colors.blue[5] : 'white'
              }
            }
          },
          columns: [
            {
              size: { basis: 500, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Job (click for details)']),
              cellRenderer: ({ rowIndex }) => {
                const {
                  methodConfigurationNamespace, methodConfigurationName, submitter, submissionId
                } = submissions[rowIndex]
                const viewInJobManager = linkToJobManager && !!workflowCollectionName
                return h(Fragment, [
                  div([
                    div([
                      methodConfigurationNamespace !== namespace && span({ style: styles.deemphasized }, [
                        `${methodConfigurationNamespace}/`
                      ]),
                      link(viewInJobManager ? {
                        target: '_blank',
                        href: `${getConfig().jobManagerUrlRoot}?q=submission-id%3D${submissionId}`
                      } : {
                        onClick: () => this.setState({
                          linkToFC: `${getConfig().firecloudUrlRoot}/#workspaces/${namespace}/${name}/monitor/${submissionId}`
                        })
                      }, [
                        methodConfigurationName, icon('pop-out', {
                          size: 10,
                          style: { marginLeft: '0.2rem' }
                        })
                      ])
                    ]),
                    div([
                      span({ style: styles.deemphasized }, 'Submitted by '),
                      submitter
                    ])
                  ])
                ])
              }
            },
            {
              size: { basis: 175, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['No. of Workflows']),
              cellRenderer: ({ rowIndex }) => {
                const { workflowStatuses } = submissions[rowIndex]
                return h(TextCell, Utils.formatNumber(_.sum(_.values(workflowStatuses))))
              }
            },
            {
              size: { basis: 150, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Status']),
              cellRenderer: ({ rowIndex }) => {
                const {
                  methodConfigurationNamespace, methodConfigurationName, submissionId, workflowStatuses,
                  status, submissionEntity
                } = submissions[rowIndex]
                return h(Fragment, [
                  statusCell(workflowStatuses), status === 'Aborting' && 'Aborting',
                  (collapsedStatuses(workflowStatuses).running && status !== 'Aborting') && h(TooltipTrigger, {
                    content: 'Abort all workflows'
                  }, [
                    h(Clickable, {
                      onClick: () => this.setState({ aborting: submissionId })
                    }, [
                      icon('times-circle', { size: 20, style: { color: colors.green[0], marginLeft: '0.5rem' } })
                    ])
                  ]),
                  isTerminal(status) && workflowStatuses['Failed'] &&
                  submissionEntity && h(TooltipTrigger, {
                    content: 'Re-run failures'
                  }, [
                    h(Clickable, {
                      onClick: () => rerunFailures({
                        namespace,
                        name,
                        submissionId,
                        configNamespace: methodConfigurationNamespace,
                        configName: methodConfigurationName,
                        onDone: () => this.refresh()
                      })
                    }, [
                      icon('sync', { size: 18, style: { color: colors.green[0], marginLeft: '0.5rem' } })
                    ])
                  ])
                ])
              }
            },
            {
              size: { basis: 150, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Submitted']),
              cellRenderer: ({ rowIndex }) => {
                const { submissionDate } = submissions[rowIndex]
                return h(TooltipTrigger, { content: Utils.makeCompleteDate(submissionDate) }, [
                  h(TextCell, Utils.makePrettyDate(submissionDate))
                ])
              }
            },
            {
              headerRenderer: () => h(HeaderCell, ['Data entity']),
              cellRenderer: ({ rowIndex }) => {
                const { submissionEntity: { entityName, entityType } = {} } = submissions[rowIndex]
                return h(TextCell, [entityType ? `${entityName} (${entityType})` : 'N/A'])
              }
            }
          ]
        })
      ]),
      submissions && !submissions.length && div(['No jobs run']),
      aborting && h(Modal, {
        onDismiss: () => this.setState({ aborting: undefined }),
        title: 'Abort All Workflows',
        showX: true,
        okButton: () => {
          Workspaces.workspace(namespace, name).submission(aborting).abort()
            .then(() => this.refresh())
            .catch(e => this.setState({ loading: false }, () => reportError('Error aborting submission', e)))
          this.setState({ aborting: undefined, loading: true })
        }
      }, [
        `Are you sure you want to abort ${
          Utils.formatNumber(collapsedStatuses(_.find({ submissionId: aborting }, submissions).workflowStatuses).running)
        } running workflow(s)?`
      ]),
      linkToFC && h(Modal, {
        onDismiss: () => this.setState({ linkToFC: undefined }),
        title: 'Legacy Workflow Details',
        okButton: buttonPrimary({
          as: 'a',
          href: linkToFC,
          target: '_blank',
          onClick: () => this.setState({ linkToFC: undefined })
        }, 'Go To FireCloud')
      }, [
        `We are currently introducing Terra's new job management component for accessing workflow details. However, this
        workspace isn't yet ready to use the new job manager. For now, workflow details can be found in our legacy system,
        FireCloud. You will be asked to sign in to FireCloud to view your workflow details.`
      ]),
      loading && spinnerOverlay
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


export const addNavPaths = () => {
  Nav.defPath('workspace-job-history', {
    path: '/workspaces/:namespace/:name/job_history',
    component: JobHistory,
    title: ({ name }) => `${name} - Job History`
  })
}
