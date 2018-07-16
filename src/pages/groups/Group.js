import _ from 'lodash/fp'
import { Fragment } from 'react'
import { b, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, link, RadioButton, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import validate from 'validate.js'


class NewUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userEmail: '',
      emailTouched: false,
      adminSelected: false
    }
  }

  render() {
    const { onDismiss } = this.props
    const { userEmail, emailTouched, adminSelected, submitting } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })

    return h(Modal, {
      onDismiss,
      title: 'Add user to Saturn Group',
      okButton: buttonPrimary({
        onClick: () => this.submit(),
        disabled: !userEmail || errors
      }, ['Add User'])
    }, [
      div({ style: styles.formLabel }, ['User email']),
      validatedInput({
        inputProps: {
          value: userEmail,
          onChange: e => this.setState({ userEmail: e.target.value, emailTouched: true })
        },
        error: emailTouched && Utils.summarizeErrors(errors && errors.userEmail)
      }),
      div({ style: styles.formLabel }, ['Role']),
      h(RadioButton, {
        text: 'Admin', checked: adminSelected,
        onChange: () => this.setState({ adminSelected: true })
      }),
      h(RadioButton, {
        text: 'Member', checked: !adminSelected,
        onChange: () => this.setState({ adminSelected: false })
      }),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { groupName, onSuccess } = this.props
    const { userEmail, adminSelected } = this.state

    try {
      this.setState({ submitting: true })
      await Rawls.group(groupName).addMember(adminSelected ? 'admin' : 'member', userEmail)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error adding user', error)
    }
  }
}

class EditUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      role: props.user.role
    }
  }

  render() {
    const { onDismiss, user: { email } } = this.props
    const { role, submitting } = this.state

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
      h(RadioButton, {
        text: 'Admin', checked: role === 'admin',
        onChange: () => this.setState({ role: 'admin' })
      }),
      h(RadioButton, {
        text: 'Member', checked: role === 'member',
        onChange: () => this.setState({ role: 'member' })
      }),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { groupName, user: { email }, onSuccess } = this.props
    const { role } = this.state

    try {
      this.setState({ submitting: true })
      await Rawls.group(groupName).changeMemberRole(email, this.props.user.role, role)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error updating user', error)
    }
  }
}

const DeleteUserModal = pure(({ onDismiss, onSubmit, userEmail }) => {
  return h(Modal, {
    onDismiss,
    title: 'Confirm',
    okButton: buttonPrimary({
      onClick: onSubmit
    }, ['Delete User'])
  }, [
    'Are you sure you want to delete the user ',
    b(`${userEmail}?`)
  ])
})

const MemberCard = pure(({ member: { email, role }, onEdit, onDelete }) => {
  return div({
    style: styles.longCard
  }, [
    div({ style: { flex: '1' } }, [email]),
    div({ style: { flex: '0 0 150px', textTransform: 'capitalize' } }, [role]),
    div({ style: { flex: '0 0 auto', textAlign: 'right' } }, [
      link({ onClick: onEdit }, ['Edit Role']),
      ' | ',
      link({ onClick: onDelete }, ['Remove'])
    ])
  ])
})

const NewUserCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: styles.shortCreateCard,
    onClick
  }, [
    div(['Add a User']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export class GroupDetails extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      members: null,
      creatingNewUser: false,
      editingUser: false,
      deletingUser: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { groupName } = this.props

    try {
      this.setState({ isDataLoaded: false })
      const { membersEmails, adminsEmails } = await Rawls.group(groupName).listMembers()
      this.setState({
        isDataLoaded: true,
        members: _.sortBy('email', _.concat(
          _.map(adm => ({ email: adm, role: 'admin' }), adminsEmails),
          _.map(mem => ({ email: mem, role: 'member' }), membersEmails)
        ))
      })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { members, isDataLoaded, filter, creatingNewUser, editingUser, deletingUser, updating } = this.state
    const { groupName } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Groups' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH GROUP',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          `Group Management: ${groupName}`
        ]),
        div({ style: styles.toolbarButtons }, [
          h(Clickable, {
            style: styles.toolbarButton,
            onClick: () => {}
          }, [icon('filter', { className: 'is-solid', size: 24 })])
        ])
      ]),
      div({ style: styles.cardContainer }, [
        h(NewUserCard, {
          onClick: () => this.setState({ creatingNewUser: true })
        }),
        div({ style: { flexGrow: 1 } },
          _.map(member => {
            return h(MemberCard, {
              member,
              onEdit: () => this.setState({ editingUser: member }),
              onDelete: () => this.setState({ deletingUser: member })
            })
          }, _.filter(({ email }) => Utils.textMatch(filter, email), members))
        ),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewUser && h(NewUserModal, {
        groupName,
        onDismiss: () => this.setState({ creatingNewUser: false }),
        onSuccess: () => {
          this.setState({ creatingNewUser: false })
          this.refresh()
        }
      }),
      editingUser && h(EditUserModal, {
        user: editingUser, groupName,
        onDismiss: () => this.setState({ editingUser: false }),
        onSuccess: () => {
          this.setState({ editingUser: false })
          this.refresh()
        }
      }),
      deletingUser && h(DeleteUserModal, {
        userEmail: deletingUser.email,
        onDismiss: () => this.setState({ deletingUser: false }),
        onSubmit: async () => {
          try {
            this.setState({ updating: true, deletingUser: false })
            await Rawls.group(groupName).removeMember(deletingUser.role, deletingUser.email)
            this.setState({ updating: false })
            this.refresh()
          } catch (error) {
            reportError('Error removing member from group', error)
          }
        }
      }),
      updating && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['members', 'filter'],
      this.state)
    )
  }
}


export const addNavPaths = () => {
  Nav.defPath('group', {
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`
  })
}
