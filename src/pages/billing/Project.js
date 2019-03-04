import _ from 'lodash/fp'
import { Fragment } from 'react'
import { b, div, h, label } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, LabeledCheckbox, link, PageBox, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const NewUserModal = ajaxCaller(class NewUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userEmail: ''
    }
  }

  render() {
    const { onDismiss } = this.props
    const { userEmail, isOwner, submitting, submitError } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })

    return h(Modal, {
      onDismiss,
      title: 'Add user to Billing Project',
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        onClick: () => this.submit(),
        disabled: errors
      }, ['Add User'])
    }, [
      Forms.requiredFormLabel('User email'),
      textInput({
        autoFocus: true,
        value: userEmail,
        onChange: e => this.setState({ userEmail: e.target.value, emailTouched: true })
      }),
      Forms.formLabel('Role'),
      h(LabeledCheckbox, {
        checked: isOwner,
        onChange: () => this.setState({ isOwner: !isOwner })
      }, [
        label({ style: { margin: '0 2rem 0 0.25rem' } }, ['Can manage users (owner)'])
      ]),
      div({ style: { marginTop: '1rem' } },
        'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project. '),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { projectName, onSuccess, ajax: { Billing } } = this.props
    const { userEmail, isOwner } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.project(projectName).addUser([isOwner ? 'owner' : 'user'], userEmail)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      if (400 <= error.status <= 499) {
        this.setState({ submitError: (await error.json()).message })
      } else {
        reportError('Error adding user', error)
      }
    }
  }
})

const EditUserModal = ajaxCaller(class EditUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOwner: _.includes('Owner', props.user.roles)
    }
  }

  render() {
    const { onDismiss, user: { email } } = this.props
    const { isOwner, submitting } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Edit Roles',
      okButton: buttonPrimary({
        onClick: () => this.submit()
      }, ['Change Role'])
    }, [
      div({ style: { marginBottom: '0.25rem' } }, [
        'Edit role for ',
        b([email])
      ]),
      h(LabeledCheckbox, {
        checked: isOwner,
        onChange: () => this.setState({ isOwner: !isOwner })
      }, [
        label({ style: { margin: '0 2rem 0 0.25rem' } }, ['Can manage users (owner)'])
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { projectName, user: { email, roles }, onSuccess, ajax: { Billing } } = this.props
    const { isOwner } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.project(projectName).removeUser(roles, email)
      await Billing.project(projectName).addUser([isOwner ? 'owner' : 'user'], email)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error updating user', error)
    }
  }
})


const DeleteUserModal = pure(({ onDismiss, onSubmit, userEmail }) => {
  return h(Modal, {
    onDismiss,
    title: 'Confirm',
    okButton: buttonPrimary({
      onClick: onSubmit
    }, ['Remove'])
  }, [
    div(['Are you sure you want to remove']),
    b(`${userEmail}?`)
  ])
})

const MemberCard = pure(({ member: { email, roles }, ownerCanEdit, onEdit, onDelete }) => {
  const canEdit = ownerCanEdit || !_.includes('Owner', roles)
  const tooltip = !canEdit && 'This user is the only owner of this project'

  return div({
    style: Style.cardList.longCard
  }, [
    div({ style: { flex: '1' } }, [email]),
    div({ style: { flex: '0 0 150px' } }, [_.includes('Owner', roles) ? 'Owner' : 'User']),
    div({ style: { flex: 'none' } }, [
      link({
        onClick: onEdit
      }, ['Edit Role']),
      ' | ',
      h(TooltipTrigger, { content: tooltip }, [
        link({
          disabled: !canEdit,
          onClick: canEdit ? onDelete : undefined
        }, ['Remove'])
      ])
    ])
  ])
})

const NewUserCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Add a User']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

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
    const ownerCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1

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
                member, ownerCanEdit,
                onEdit: () => this.setState({ editingUser: member }),
                onDelete: () => this.setState({ deletingUser: member })
              })
            }, _.filter(({ email }) => Utils.textMatch(filter, email), projectUsers))
          ),
          loading && spinnerOverlay
        ]),
        addingUser && h(NewUserModal, {
          projectName,
          onDismiss: () => this.setState({ addingUser: false }),
          onSuccess: () => this.refresh()
        }),
        editingUser && h(EditUserModal, {
          user: editingUser, projectName,
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
