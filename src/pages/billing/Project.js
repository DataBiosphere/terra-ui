import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon, spinner } from 'src/components/icons'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class ProjectDetail extends Component {
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

  refresh = _.flow(
    withErrorReporting('Error loading billing project users list'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async () => {
    const { ajax: { Billing }, project } = this.props
    this.setState({ addingUser: false, deletingUser: false, updating: false, editingUser: false })
    const rawProjectUsers = await Billing.project(project.projectName).listUsers()
    const projectUsers = _.flow(
      _.groupBy('email'),
      _.map(gs => ({ ..._.omit('role', gs[0]), roles: _.map('role', gs) })),
      _.sortBy('email')
    )(rawProjectUsers)
    this.setState({ projectUsers })
  })

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { project: { projectName, creationStatus } } = this.props
    const { projectUsers, loading, updating, filter, addingUser, deletingUser, editingUser } = this.state
    const adminCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1

    return h(Fragment, [
      div({ style: { padding: '1.5rem 3rem', flexGrow: 1 } }, [
        div({ style: { color: colors.dark(), fontSize: 16, fontWeight: 600 } }, [
          projectName,
          span({ style: { fontWeight: 500, fontSize: 14, margin: '0 1.5rem 0 3rem' } }, creationStatus),
          Utils.cond(
            [creationStatus === 'Ready', () => icon('check', { style: { color: colors.success() } })],
            [creationStatus === 'Creating', () => spinner({ size: 16 })],
            () => icon('error-standard', { style: { color: colors.danger() } })
          )
        ]),
        div({
          style: {
            marginTop: '1rem',
            display: 'flex'
          }
        }, [
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
          )
        ])
      ]),
      addingUser && h(NewUserModal, {
        adminLabel: 'Owner',
        userLabel: 'User',
        title: 'Add user to Billing Project',
        footer: 'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
        addFunction: Ajax().Billing.project(projectName).addUser,
        onDismiss: () => this.setState({ addingUser: false }),
        onSuccess: () => this.refresh()
      }),
      editingUser && h(EditUserModal, {
        adminLabel: 'Owner',
        userLabel: 'User',
        user: editingUser,
        saveFunction: Ajax().Billing.project(projectName).changeUserRoles,
        onDismiss: () => this.setState({ editingUser: false }),
        onSuccess: () => this.refresh()
      }),
      !!deletingUser && h(DeleteUserModal, {
        userEmail: deletingUser.email,
        onDismiss: () => this.setState({ deletingUser: false }),
        onSubmit: _.flow(
          withErrorReporting('Error removing member from billing project'),
          Utils.withBusyState(v => this.setState({ updating: v }))
        )(async () => {
          this.setState({ deletingUser: false })
          await Ajax().Billing.project(projectName).removeUser(deletingUser.roles, deletingUser.email)
          this.refresh()
        })
      }),
      (loading || updating) && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['projectUsers', 'filter'],
      this.state)
    )
  }
})
