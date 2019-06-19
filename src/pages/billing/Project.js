import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, Select, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon, spinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
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
      billingAccountName: null,
      ...StateHistory.get()
    }
  }

  updateBillingAccount = _.flow(
    withErrorReporting('Error updating billing account'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async newAccountName => {
    const { ajax: { GoogleBilling }, project: { projectName } } = this.props
    const { billingAccountName } = await GoogleBilling.changeBillingAccount({ projectId: projectName, newAccountName })
    this.setState({ billingAccountName })
  })

  loadBillingInfo = withErrorReporting('Error loading current billing account',
    async () => {
      const { ajax: {  GoogleBilling }, project: { projectName }, hasBillingScope } = this.props
      if (hasBillingScope) {
        const { billingAccountName } = await GoogleBilling.getBillingInfo(projectName)
        this.setState({ billingAccountName })
      }
    })

  refresh = withErrorReporting('Error loading billing project users list',
    async () => {
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

  componentDidMount = Utils.withBusyState(
    loading => this.setState({ loading }),
    () => Promise.all([
      this.refresh(),
      this.loadBillingInfo()
    ])
  )

  render() {
    const { project: { projectName, creationStatus }, ajax: { Billing }, billingAccounts, hasBillingScope, authorizeAndLoadAccounts } = this.props
    const { projectUsers, loading, updating, filter, addingUser, deletingUser, editingUser, billingAccountName } = this.state
    const adminCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1

    return h(Fragment, [
      div({ style: { padding: '1.5rem 3rem', flexGrow: 1 } }, [
        div({ style: { color: colors.dark(), fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' } }, [
          projectName,
          span({ style: { fontWeight: 500, fontSize: 14, margin: '0 1.5rem 0 3rem' } }, creationStatus),
          Utils.cond(
            [creationStatus === 'Ready', () => icon('check', { style: { color: colors.success() } })],
            [creationStatus === 'Creating', () => spinner({ size: 16 })],
            () => icon('error-standard', { style: { color: colors.danger() } })
          ),
          span({ style: { flexShrink: 0, fontWeight: 500, fontSize: 14, margin: '0 0.75rem 0 auto' } }, 'Billing Account For This Project:'),
          hasBillingScope ? h(Select, {
            value: billingAccountName,
            isClearable: false,
            styles: { container: old => ({ ...old, width: 320 }) },
            options: _.map(({ displayName, accountName }) => ({ label: displayName, value: accountName }), billingAccounts),
            onChange: ({ value: newAccountName }) => billingAccountName !== newAccountName && this.updateBillingAccount(newAccountName)
          }) : buttonPrimary({ onClick: async () =>  await authorizeAndLoadAccounts() }, 'Authorize')
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
        onSubmit: _.flow(
          withErrorReporting('Error removing member from billing project'),
          Utils.withBusyState(v => this.setState({ updating: v }))
        )(async () => {
          this.setState({ deletingUser: false })
          await Billing.project(projectName).removeUser(deletingUser.roles, deletingUser.email)
          this.refresh()
        })
      }),
      (loading || updating) && spinnerOverlay
    ])
  }

  componentDidUpdate(prevProps) {
    if (this.props.hasBillingScope !== prevProps.hasBillingScope) {
      Utils.withBusyState(loading => this.setState({ loading }), this.loadBillingInfo)()
    }

    StateHistory.update(_.pick(
      ['projectUsers', 'filter'],
      this.state)
    )
  }
})
