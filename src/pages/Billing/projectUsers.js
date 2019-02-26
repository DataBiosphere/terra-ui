import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { PageBox, search, spinnerOverlay } from 'src/components/common'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import { FlexTable, HeaderCell } from 'src/components/table'
import { AutoSizer } from 'react-virtualized'

export const ProjectUsersList = ajaxCaller(class ProjectUsersList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      projectUsers: null,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing }, projectName } = this.props

    try {
      this.setState({ isDataLoaded: false })
      const rawProjectUsers = await Billing.listUsersOnBillingProject(projectName)
      const projectUsers = _.flow(
        _.groupBy('email'),
        _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
        _.sortBy('email')
      )(rawProjectUsers)
      this.setState({ projectUsers, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading billing project users list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { projectName } = this.props
    const { projectUsers, isDataLoaded, filter } = this.state
    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH USERS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageBox, {
        style: {
          padding: '1.5rem',
          flex: 1
        }
      }, [
        div({ style: styles.toolbarContainer }, [
          div({
            style: {
              ...Style.elements.sectionHeader,
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }
          }, [
            `Billing Project - ${projectName}`
          ])
        ]),
        projectUsers && !!projectUsers.length && h(AutoSizer, [
          ({ height }) => h(FlexTable, {
            width: 600,
            height,
            rowCount: projectUsers.length,
            columns: [
              {
                size: { basis: 200 },
                headerRenderer: () => h(HeaderCell, ['Email']),
                cellRenderer: ({ rowIndex }) => {
                  return projectUsers[rowIndex].email
                }
              },
              {
                size: {
                  basis: 150,
                  grow: 0
                },
                headerRenderer: () => h(HeaderCell, ['Role']),
                cellRenderer: ({ rowIndex }) => projectUsers[rowIndex].role
              }
            ]
          })
        ]),
        !isDataLoaded && spinnerOverlay
      ])

    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['projectUsers', 'filter'],
      this.state)
    )
  }
})


export const addNavPaths = () => {
  Nav.defPath('project-users-list', {
    path: '/billing/:projectName',
    component: ProjectUsersList,
    title: ({ projectName }) => `Billing Management - ${projectName}`
  })
}
