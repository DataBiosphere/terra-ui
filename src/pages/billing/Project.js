import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, Select, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { formHint, RequiredFormLabel } from 'src/libs/forms'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'

const billingProjectNameValidator = existing => ({
  presence: { allowEmpty: false },
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /^[a-z]([a-z0-9-])*$/,
    message: 'must start with a letter and can only contain lowercase letters, numbers, and hyphens.'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

const NewBillingProjectCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Project']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

const NewBillingProjectModal = ajaxCaller(class NewBillingProjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjectName: '',
      billingProjectNameTouched: false,
      existing: []
    }
  }

  async loadBillingAccounts() {
    const { ajax: { Billing } } = this.props
    try {
      const billingAccounts = await Billing.listAccounts()
      this.setState({ billingAccounts })
    } catch (error) {
      reportError('Error loading billing accounts', error)
    }
  }

  async componentDidMount() {
    this.loadBillingAccounts()
  }

  render() {
    const { onDismiss } = this.props
    const { billingProjectName, billingProjectNameTouched, submitting, chosenBillingAccount, billingAccounts, existing } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })

    return h(Modal, {
      onDismiss,
      title: 'Create Billing Project',
      showCancel: !(billingAccounts && billingAccounts.length === 0),
      showButtons: !!billingAccounts,
      okButton: billingAccounts && billingAccounts.length !== 0 ?
        buttonPrimary({
          disabled: errors || !chosenBillingAccount || !chosenBillingAccount.firecloudHasAccess,
          onClick: () => this.submit()
        }, ['Create Billing Project']) :
        buttonPrimary({
          onClick: () => onDismiss()
        }, ['Ok'])
    }, [
      !billingAccounts && spinnerOverlay,
      billingAccounts && billingAccounts.length === 0 && h(Fragment, [
        `You don't have access to any billing accounts.  `,
        a({
          style: { color: colors.blue[0], fontWeight: 700 },
          href: `https://gatkforums.broadinstitute.org/firecloud/discussion/9762/howto-set-up-a-google-billing-account-non-broad-users`,
          target: '_blank'
        }, ['Learn how to create a billing account.  ', icon('pop-out', { size: 20 })])
      ]),
      billingAccounts && billingAccounts.length !== 0 && h(Fragment, [
        h(RequiredFormLabel, ['Enter name']),
        validatedInput({
          inputProps: {
            autoFocus: true,
            value: billingProjectName,
            onChange: e => this.setState({ billingProjectName: e.target.value, billingProjectNameTouched: true })
          },
          error: billingProjectNameTouched && Utils.summarizeErrors(errors && errors.billingProjectName)
        }),
        !(billingProjectNameTouched && errors) && formHint('Name must be unique and cannot be changed.'),
        h(RequiredFormLabel, ['Select billing account']),
        div({ style: { fontSize: 14 } }, [
          h(Select, {
            isMulti: false,
            placeholder: 'Select billing account',
            value: chosenBillingAccount,
            onChange: selected => this.setState({ chosenBillingAccount: selected.value }),
            options: _.map(account => {
              return {
                value: account,
                label: account.displayName
              }
            }, billingAccounts)
          })
        ]),
        !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 500, fontSize: 12 } }, [
          div({ style: { color: colors.red[0], margin: '0.25rem 0 0.25rem 0', fontSize: 13 } }, [
            'Terra does not have access to this account. To grant access, add ', span({ style: { fontWeight: 'bold' } }, 'billing@firecloud.org'),
            ' as a Billing Account User on the ',
            a({
              style: { color: colors.blue[0], fontWeight: 700 },
              href: `https://console.cloud.google.com/billing/${chosenBillingAccount.accountName.split('/')[1]}?authuser=${Auth.getUser().email}`,
              target: '_blank'
            }, ['Google Cloud Console ', icon('pop-out', { size: 12 })])
          ]),
          // The following lines will be re-added soon:
          // div({ style: { marginBottom: '0.25rem' } }, [
          //   '2. Click ',
          //   h(Clickable, {
          //     as: 'span',
          //     style: { color: colors.blue[0], fontWeight: 700 },
          //     onClick: () => {
          //       this.setState({ billingAccounts: undefined })
          //       this.loadBillingAccounts()
          //     }
          //   }, ['HERE']), ' to refresh your billing accounts.'
          // ]),
          div({ style: { marginTop: '0.5rem' } }, [
            'Need help? ',
            a({
              style: { color: colors.blue[0], fontWeight: 700 },
              href: `https://gatkforums.broadinstitute.org/firecloud/discussion/9762/howto-set-up-a-google-billing-account-non-broad-users`,
              target: '_blank'
            }, ['Click here ', icon('pop-out', { size: 12 })]), ' for more information.'
          ])
        ])
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { Billing } } = this.props
    const { billingProjectName, chosenBillingAccount, existing } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.createProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          this.setState({ existing: _.concat(billingProjectName, existing), submitting: false })
          break
        default:
          reportError('Error creating billing project', error)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }
})


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
      creatingBillingProject: false,
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
    const { projectUsers, loading, updating, filter, addingUser, deletingUser, editingUser, creatingBillingProject } = this.state
    const adminCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1
    const creationStatus = 'Ready'

    return h(Fragment, [
      div({ style: { padding: '1.5rem 3rem' } }, [
        div({ style: { color: colors.gray[0], fontSize: 16, fontWeight: 600 } },
          [
            `BILLING PROJECT: ${projectName}`,
            span({ style: { fontWeight: 500, fontSize: 14, margin: '0 1.5rem 0 3rem' } }, creationStatus),
            span({ style: {  } }, [
              icon(Utils.cond(
                [creationStatus === 'Ready', 'check'],
                [creationStatus === 'Creating', 'loadingSpinner'],
                'error-standard'), {
                style: { color: colors.green[0], marginRight: '1rem' }
              })
            ])
          ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewUserCard, {
            onClick: () => this.setState({ addingUser: true })
          }), div({ style: { width: '600px' } },
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
      h(NewBillingProjectCard, {
        onClick: async () => {
          try {
            await Auth.ensureBillingScope()
            this.setState({ creatingBillingProject: true })
          } catch (error) {
            reportError('Failed to grant permissions', 'To create a new billing project, you must allow Terra to view your Google billing account(s).')
          }
        }
      }),
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
      creatingBillingProject && h(NewBillingProjectModal, {
        onDismiss: () => this.setState({ creatingBillingProject: false }),
        onSuccess: () => this.setState({ creatingBillingProject: false })
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
