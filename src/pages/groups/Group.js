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
    const { onDismiss, onSubmit } = this.props
    const { userEmail, emailTouched, adminSelected } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })

    return h(Modal, {
      onDismiss,
      title: 'Add user to Saturn Group',
      okButton: buttonPrimary({
        onClick: onSubmit
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
      })
    ])
  }
}

const EditUserModal = pure(({ onDismiss, onSubmit }) => {
  return h(Modal, {
    onDismiss,
    title: 'Edit Roles',
    okButton: buttonPrimary({
      onClick: onSubmit
    }, ['Change Role'])
  })
})

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

const MemberCard = pure(({ member: { email, isAdmin }, onEdit, onDelete }) => {
  return div({
    style: styles.longCard
  }, [
    div({ style: { flex: '1' } }, [email]),
    div({ style: { flex: '0 0 150px' } }, [isAdmin ? 'Admin' : 'Member']),
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
        members: _.concat(
          _.map(adm => ({ email: adm, isAdmin: true }), adminsEmails),
          _.map(mem => ({ email: mem, isAdmin: false }), membersEmails)
        )
      })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { members, isDataLoaded, filter, creatingNewUser, editingUser, deletingUser } = this.state
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
        onDismiss: () => this.setState({ creatingNewUser: false }),
        onSubmit: () => {
          this.setState({ creatingNewUser: false })
          this.refresh()
        }
      }),
      editingUser && h(EditUserModal, {
        onDismiss: () => this.setState({ editingUser: false }),
        onSubmit: () => {
          this.setState({ editingUser: false })
          this.refresh()
        }
      }),
      deletingUser && h(DeleteUserModal, {
        userEmail: deletingUser.email,
        onDismiss: () => this.setState({ deletingUser: false }),
        onSubmit: () => {
          this.setState({ deletingUser: false })
          this.refresh()
        }
      })
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
