import _ from 'lodash/fp'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { FlexTable, HeaderCell, TextCell } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  pageContainer: {
    margin: '1rem', minHeight: 500, height: '100%', display: 'flex', flexGrow: 1
  },
  submissionsTable: {
    flex: 1
  },
  table: {
    deemphasized: {
      color: Style.colors.textFaded
    }
  },
  sidebar: {
    flex: '0 0 auto', margin: '0 6rem 0 4rem'
  },
  statusIcon: {
    class: 'is-solid', style: { marginRight: '0.5rem' }
  },
  workflowLabelsHeader: {
    ...Style.elements.sectionHeader, marginBottom: '1rem'
  },
  workflowLabel: status => ({
    lineHeight: '2rem',
    padding: '0.5rem 1rem',
    backgroundColor: colorForStatus(status), color: 'white'
  }),
  newSubmission: {
    backgroundColor: Style.colors.highlightFaded
  }
}


const iconForStatus = status => {
  switch (status) {
    case 'Succeeded':
      return icon('check-circle', styles.statusIcon)
    case 'Aborting':
    case 'Aborted':
    case 'Failed':
      return icon('warning-standard', styles.statusIcon)
    default:
      return icon('sync', styles.statusIcon)
  }
}

const colorForStatus = status => {
  switch (status) {
    case 'Succeeded':
      return Style.colors.success
    case 'Aborting':
    case 'Aborted':
    case 'Failed':
      return Style.colors.standout
    default:
      return Style.colors.primary
  }
}


export const flagNewSubmission = submissionId => {
  sessionStorage.setItem('new-submission', submissionId)
}


class JobHistory extends Component {
  constructor(props) {
    super(props)

    const submissionId = sessionStorage.getItem('new-submission')
    if (submissionId) {
      sessionStorage.removeItem('new-submission')
      this.state = { newSubmissionId: submissionId }
      setTimeout(() => this.setState({ newSubmissionId: undefined }), 0)
    }
  }

  async refresh() {
    const { namespace, name } = this.props

    try {
      this.setState({ loading: true })
      const submissions = _.orderBy('submissionDate', 'desc', await Rawls.workspace(namespace, name).listSubmissions())
      this.setState({ submissions })
    } catch (error) {
      reportError('Error loading submissions list', error)
      this.setState({ submissions: [] })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { namespace, name } = this.props

    return h(WorkspaceContainer, {
      namespace, name,
      breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
      title: 'Job History', activeTab: 'job history',
      refresh: () => this.refresh()
    }, [
      div({ style: styles.pageContainer }, [
        this.renderSubmissions(),
        this.renderSidebar()
      ])
    ])
  }

  renderSubmissions() {
    const { namespace } = this.props
    const { submissions, loading, newSubmissionId } = this.state

    return div({ style: styles.submissionsTable }, [
      loading && spinnerOverlay,
      submissions && h(AutoSizer, [
        ({ width, height }) => h(FlexTable, {
          width, height, rowCount: submissions.length,
          rowStyle: rowIndex => {
            const { submissionId } = submissions[rowIndex]
            return {
              transition: 'all 1s cubic-bezier(0.33, -2, 0.74, 0.05)',
              ...(submissionId === newSubmissionId ? styles.newSubmission : {})
            }
          },
          columns: [
            {
              headerRenderer: () => h(HeaderCell, ['Workflow']),
              cellRenderer: ({ rowIndex }) => {
                const { methodConfigurationNamespace, methodConfigurationName, submitter } = submissions[rowIndex]
                return div({}, [
                  div({}, [
                    methodConfigurationNamespace !== namespace && span({ style: styles.table.deemphasized }, [
                      `${methodConfigurationNamespace}/`
                    ]),
                    methodConfigurationName
                  ]),
                  div({}, [
                    span({ style: styles.table.deemphasized }, 'Submitted by '),
                    submitter
                  ])
                ])
              }
            },
            {
              size: { basis: 150, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Status']),
              cellRenderer: ({ rowIndex }) => {
                const { status } = submissions[rowIndex]
                return h(TextCell, status)
              }
            },
            {
              size: { basis: 250, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Run']),
              cellRenderer: ({ rowIndex }) => {
                const { submissionDate } = submissions[rowIndex]
                return h(TextCell, Utils.makePrettyDate(submissionDate))
              }
            }
          ]
        })
      ])
    ])
  }

  renderSidebar() {
    const { submissions } = this.state

    const statuses = _.flow(
      _.remove({ status: 'Done' }),
      _.map('workflowStatuses'),
      _.reduce(_.mergeWith(_.add), {}),
      _.toPairs
    )(submissions)

    return div({ style: styles.sidebar }, [
      div({ style: styles.workflowLabelsHeader }, ['Active Workflows']),
      _.isEmpty(statuses) && 'None',
      ..._.map(
        ([status, count]) => div({ style: styles.workflowLabel(status) }, [
          iconForStatus(status),
          `${count} ${status}`
        ]),
        statuses)
    ])
  }

  componentDidMount() {
    this.refresh()
  }
}


export const addNavPaths = () => {
  Nav.defPath('workspace-job-history', {
    path: '/workspaces/:namespace/:name/job_history',
    component: JobHistory,
    title: ({ name }) => `${name} - Job History`
  })
}
