import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { PageBox, search, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export const ProjectUsersList = ajaxCaller(class ProjectUsersList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      projectUsers: null,
      addingUser: false,
      editingUser: false,
      deletingUser: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing }, projectName } = this.props

    try {
      this.setState({ loading: true, addingUser: false, deletingUser: false, updating: false, editingUser: false })
      const rawProjectUsers = await Billing.project(projectName).listUsers()
      const projectUsers = _.flow(
        _.groupBy('email'),
        _.map(gs => ({ ..._.omit('role', gs[0]), roles: _.map('role', gs) })),
        _.sortBy('email')
      )(rawProjectUsers)
      this.setState({ projectUsers, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading billing project users list', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { projectName, ajax: { Billing } } = this.props
    const { projectUsers, loading, updating, filter, addingUser, deletingUser, editingUser } = this.state
    const adminCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1

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
        div({ style: { ...Style.cardList.toolbarContainer, marginBottom: '1rem' } }, [
          div({
            style: {
              ...Style.elements.sectionHeader,
              textTransform: 'uppercase'
            }
          }, [`Billing Project - ${projectName}`])
        ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewUserCard, {
            onClick: () => this.setState({ addingUser: true })
          }),
          div({ style: { flexGrow: 1 } },
            _.map(member => {
              return h(MemberCard, {
                adminLabel: 'Owner',
                userLabel: 'User',
                member, adminCanEdit,
                onEdit: () => this.setState({ editingUser: member }),
                onDelete: () => this.setState({ deletingUser: member })
              })
            }, _.filter(({ email }) => Utils.textMatch(filter, email), projectUsers))
          ),
          loading && spinnerOverlay
        ]),
        addingUser && h(NewUserModal, {
          adminLabel: 'Owner',
          userLabel: 'User',
          title: 'Add user to Billing Project',
          footer: 'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
          addFunction: Billing.project(projectName).addUser,
          onDismiss: () => this.setState({ addingUser: false }),
          onSuccess: () => this.refresh()
        }),
        editingUser && h(EditUserModal, {
          adminLabel: 'Owner',
          userLabel: 'User',
          user: editingUser,
          saveFunction: Billing.project(projectName).changeUserRoles,
          onDismiss: () => this.setState({ editingUser: false }),
          onSuccess: () => this.refresh()
        }),
        !!deletingUser && h(DeleteUserModal, {
          userEmail: deletingUser.email,
          onDismiss: () => this.setState({ deletingUser: false }),
          onSubmit: async () => {
            try {
              this.setState({ updating: true, deletingUser: false })
              await Billing.project(projectName).removeUser(deletingUser.roles, deletingUser.email)
              this.refresh()
            } catch (error) {
              this.setState({ updating: false })
              reportError('Error removing member from billing project', error)
            }
          }
        }),
        updating && spinnerOverlay
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
  Nav.defPath('project', {
    path: '/billing/:projectName',
    component: ProjectUsersList,
    title: ({ projectName }) => `Billing Management - ${projectName}`
  })
}
