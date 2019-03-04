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


const roleSelector = ({ roles, adminCanEdit, updateState }) => {
  const isAdmin = _.includes('admin', roles)
  const tooltip = !adminCanEdit && 'This user is the only admin of this group'
  return h(Fragment, [
    h(TooltipTrigger, { content: tooltip }, [
      h(LabeledCheckbox, {
        checked: isAdmin,
        disabled: !adminCanEdit,
        onChange: () => updateState([!isAdmin ? 'admin' : 'member'])
      }, [label({ style: { margin: '0 2rem 0 0.25rem' } }, ['Can manage users (admin)'])])
    ])
  ])
}


const NewUserModal = ajaxCaller(class NewUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userEmail: '',
      roles: ['member']
    }
  }

  render() {
    const { onDismiss } = this.props
    const { userEmail, roles, submitting, submitError } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })

    return h(Modal, {
      onDismiss,
      title: 'Add user to Terra Group',
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
        onChange: e => this.setState({ userEmail: e.target.value })
      }),
      Forms.formLabel('Role'),
      roleSelector({ roles, adminCanEdit: true, updateState: roles => this.setState({ roles }) }),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { groupName, onSuccess, ajax: { Groups } } = this.props
    const { userEmail, roles } = this.state

    try {
      this.setState({ submitting: true })
      await Groups.group(groupName).addUser(roles, userEmail)
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
      isAdmin: _.includes('admin', props.user.roles)
    }
  }

  render() {
    const { onDismiss, user: { email } } = this.props
    const { isAdmin, submitting } = this.state

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
        checked: isAdmin,
        onChange: () => this.setState({ isAdmin: !isAdmin })
      }, [
        label({ style: { margin: '0 2rem 0 0.25rem' } }, ['Can manage users (owner)'])
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { groupName, user: { email, roles }, onSuccess, ajax: { Groups } } = this.props
    const { isAdmin } = this.state

    try {
      this.setState({ submitting: true })
      await Groups.group(groupName).changeUserRoles(email, roles, [isAdmin ? 'admin' : 'member'])
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

const MemberCard = pure(({ member: { email, roles }, adminCanEdit, onEdit, onDelete }) => {
  const canEdit = adminCanEdit || !_.includes('admin', roles)
  const tooltip = !canEdit && 'This user is the only admin of this group'

  return div({
    style: Style.cardList.longCard
  }, [
    div({ style: { flex: '1' } }, [email]),
    div({ style: { flex: '0 0 100px' } }, [_.includes('admin', roles) ? 'Admin' : 'Member']),
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

export const GroupDetails = ajaxCaller(class GroupDetails extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      members: null,
      creatingNewUser: false,
      editingUser: false,
      deletingUser: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { groupName, ajax: { Groups } } = this.props

    try {
      this.setState({ loading: true, creatingNewUser: false, editingUser: false, deletingUser: false, updating: false })

      const groupAjax = Groups.group(groupName)
      const [membersEmails, adminsEmails] = await Promise.all([groupAjax.listMembers(), groupAjax.listAdmins()])

      const rolesByMember = _.mergeAllWith((a, b) => { if (_.isArray(a)) return a.concat(b) }, [
        _.fromPairs(_.map(email => [email, ['admin']], adminsEmails)),
        _.fromPairs(_.map(email => [email, ['member']], membersEmails))
      ])
      const members = _.flow(
        _.toPairs,
        _.map(([email, roles]) => ({ email, roles })),
        _.sortBy(member => member.email.toUpperCase())
      )(rolesByMember)
      this.setState({ members, adminCanEdit: adminsEmails.length > 1 })
    } catch (error) {
      reportError('Error loading group list', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { members, adminCanEdit, loading, filter, creatingNewUser, editingUser, deletingUser, updating } = this.state
    const { groupName, ajax: { Groups } } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Groups', href: Nav.getLink('groups') }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH GROUP',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageBox, [
        div({ style: Style.cardList.toolbarContainer }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
            `Group Management: ${groupName}`
          ])
        ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewUserCard, {
            onClick: () => this.setState({ creatingNewUser: true })
          }),
          div({ style: { flexGrow: 1 } },
            _.map(member => {
              return h(MemberCard, {
                member, adminCanEdit,
                onEdit: () => this.setState({ editingUser: member }),
                onDelete: () => this.setState({ deletingUser: member })
              })
            }, _.filter(({ email }) => Utils.textMatch(filter, email), members))
          ),
          loading && spinnerOverlay
        ]),
        creatingNewUser && h(NewUserModal, {
          groupName,
          onDismiss: () => this.setState({ creatingNewUser: false }),
          onSuccess: () => this.refresh()
        }),
        editingUser && h(EditUserModal, {
          user: editingUser, groupName, adminCanEdit,
          onDismiss: () => this.setState({ editingUser: false }),
          onSuccess: () => this.refresh()
        }),
        deletingUser && h(DeleteUserModal, {
          userEmail: deletingUser.email,
          onDismiss: () => this.setState({ deletingUser: false }),
          onSubmit: async () => {
            try {
              this.setState({ updating: true, deletingUser: false })
              await Groups.group(groupName).removeUser(deletingUser.roles, deletingUser.email)
              this.refresh()
            } catch (error) {
              this.setState({ updating: false })
              reportError('Error removing member from group', error)
            }
          }
        }),
        updating && spinnerOverlay
      ])
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['members', 'filter'],
      this.state)
    )
  }
})


export const addNavPaths = () => {
  Nav.defPath('group', {
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`
  })
}
