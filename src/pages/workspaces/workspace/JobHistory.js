import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import DropdownBox from 'src/components/DropdownBox'
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


const collapseStatus = status => {
  switch (status) {
    case 'Succeeded':
      return 'Succeeded'
    case 'Aborting':
    case 'Aborted':
    case 'Failed':
      return 'Failed'
    default:
      return 'Running'
  }
}

const iconForStatus = status => {
  switch (collapseStatus(status)) {
    case 'Succeeded':
      return icon('check-circle', styles.statusIcon)
    case 'Failed':
      return icon('warning-standard', styles.statusIcon)
    default:
      return icon('sync', styles.statusIcon)
  }
}

const colorForStatus = status => {
  switch (collapseStatus(status)) {
    case 'Succeeded':
      return Style.colors.success
    case 'Failed':
      return Style.colors.standout
    default:
      return Style.colors.primary
  }
}


export const flagNewSubmission = submissionId => {
  sessionStorage.setItem('new-submission', submissionId)
}


class StatusCell extends Component {
  render() {
    const { workflowStatuses } = this.props
    const { open } = this.state

    const collapsed = _.flow(
      _.toPairs,
      _.map(([status, count]) => ({ [collapseStatus(status)]: count })),
      _.reduce(_.mergeWith(_.add), {})
    )(workflowStatuses)

    const collapsedKeys = _.keys(collapsed)

    return h(Fragment, [
      _.includes('Succeeded', collapsedKeys) && icon('check', { size: 24, style: { marginRight: '0.5rem', color: Style.colors.success } }),
      _.includes('Failed', collapsedKeys) && icon('warning-standard', { class: 'is-solid', size: 24, style: { marginRight: '0.5rem', color: Style.colors.error } }),
      _.includes('Running', collapsedKeys) && icon('sync', { size: 24, style: { marginRight: '0.5rem', color: Style.colors.success } }),
      h(DropdownBox, {
        open,
        width: 'auto',
        onToggle: open => this.setState({ open })
      }, [
        table({}, [
          tbody({}, [
            tr({}, [
              td({ align: 'center', style: { padding: '0.5rem' } }, [icon('check', { size: 24, style: { color: Style.colors.success } })]),
              td({ align: 'center', style: { padding: '0.5rem' } }, [icon('warning-standard', { class: 'is-solid', size: 24, style: { color: Style.colors.error } })]),
              td({ align: 'center', style: { padding: '0.5rem' } }, [icon('sync', { size: 24, style: { color: Style.colors.success } })])
            ]),
            tr({}, [
              td({ align: 'center', style: { padding: '0.5rem' } }, [collapsed['Succeeded'] || 0]),
              td({ align: 'center', style: { padding: '0.5rem' } }, [collapsed['Failed'] || 0]),
              td({ align: 'center', style: { padding: '0.5rem' } }, [collapsed['Running'] || 0])
            ])
          ])
        ])
      ])
    ])
  }
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
              headerRenderer: () => 'Workflows',
              cellRenderer: ({ rowIndex }) => {
                const { workflowStatuses } = submissions[rowIndex]
                return h(TextCell, Utils.formatNumber(_.sum(_.values(workflowStatuses))))
              }
            },
            {
              size: { basis: 150, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Status']),
              cellRenderer: ({ rowIndex }) => {
                const { workflowStatuses } = submissions[rowIndex]
                return h(StatusCell, { workflowStatuses })
              }
            },
            {
              size: { basis: 250, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Submitted']),
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
