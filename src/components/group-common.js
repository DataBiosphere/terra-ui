import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { b, div, h, label } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, LabeledCheckbox, link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { AutocompleteSearch } from 'src/components/input'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { FormLabel, RequiredFormLabel } from 'src/libs/forms'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  suggestionContainer: {
    display: 'flex', alignItems: 'center',
    padding: '0.5rem 1rem',
    borderBottom: `1px solid ${colors.dark(0.4)}`
  }
}

export const NewUserCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Add a User']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export const MemberCard = pure(({ member: { email, roles }, adminCanEdit, onEdit, onDelete, adminLabel, userLabel }) => {
  const canEdit = adminCanEdit || !_.includes(adminLabel, roles)
  const tooltip = !canEdit && `This user is the only ${adminLabel}`

  return div({
    style: Style.cardList.longCard
  }, [
    div({ style: { flex: '1' } }, [email]),
    div({ style: { flex: '0 0 150px', textTransform: 'capitalize' } }, [_.includes(adminLabel, roles) ? adminLabel : userLabel]),
    div({ style: { flex: 'none' } }, [
      h(TooltipTrigger, { content: tooltip }, [
        link({
          disabled: !canEdit,
          onClick: canEdit ? onEdit : undefined
        }, ['Edit Role'])
      ]),
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

export const NewUserModal = ajaxCaller(class NewUserModal extends Component {
  static propTypes = {
    addFunction: PropTypes.func.isRequired,
    adminLabel: PropTypes.string.isRequired,
    footer: PropTypes.node,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    userLabel: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      userEmail: '',
      roles: [props.userLabel],
      submitting: false
    }
  }

  async componentDidMount() {
    const { ajax: { Workspaces, Groups } } = this.props

    try {
      const [shareSuggestions, groups] = await Promise.all([
        Workspaces.getShareLog(),
        Groups.list()
      ])

      const suggestions = _.flow(
        _.map('groupEmail'),
        _.concat(shareSuggestions),
        _.uniq
      )(groups)

      this.setState({ suggestions })
    } catch (error) {
      reportError('Error looking up collaborators', error)
    }
  }

  render() {
    const { adminLabel, userLabel, title, onDismiss, footer } = this.props
    const { userEmail, roles, suggestions, submitting, submitError } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })
    const isAdmin = _.includes(adminLabel, roles)

    const userEmailInvalid = !!validate({ userEmail }, { userEmail: { email: true } })
    const canAdd = value => value !== userEmail || !userEmailInvalid

    return h(Modal, {
      onDismiss,
      title,
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        onClick: () => this.submit(),
        disabled: errors
      }, ['Add User'])
    }, [
      h(RequiredFormLabel, ['User email']),
      h(AutocompleteSearch, {
        autoFocus: true,
        value: userEmail,
        onChange: v => this.setState({ userEmail: v }),
        renderSuggestion: suggestion => div({ style: styles.suggestionContainer }, [
          div({ style: { flex: 1 } }, [
            !canAdd(suggestion) && h(TooltipTrigger, {
              content: 'Not a valid email address'
            }, [
              icon('warning-standard', { style: { color: colors.danger(), marginRight: '0.5rem' } })
            ]),
            suggestion
          ])
        ]),
        onSuggestionSelected: selection => {
          this.setState({ userEmail: selection })
        },
        onKeyDown: e => {
          // 27 = Escape
          if (e.which === 27 && !!userEmail) {
            this.setState({ userEmail: '' })
            e.stopPropagation()
          }
        },
        suggestions: suggestions,
        style: { fontSize: 16 },
        theme: { suggestion: { padding: 0 } }
      }),
      h(FormLabel, ['Role']),
      h(LabeledCheckbox, {
        checked: isAdmin,
        onChange: () => this.setState({ roles: [isAdmin ? userLabel : adminLabel] })
      }, [
        label({ style: { margin: '0 2rem 0 0.25rem' } }, [`Can manage users (${adminLabel})`])
      ]),
      footer && div({ style: { marginTop: '1rem' } }, [footer]),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.danger() } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { addFunction, onSuccess } = this.props
    const { userEmail, roles } = this.state

    try {
      this.setState({ submitting: true })
      await addFunction(roles, userEmail)
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

export const EditUserModal = class EditUserModal extends Component {
  static propTypes = {
    adminLabel: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    saveFunction: PropTypes.func.isRequired,
    user: PropTypes.shape({
      email: PropTypes.string.isRequired,
      roles: PropTypes.array.isRequired
    }).isRequired,
    userLabel: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      isAdmin: _.includes(props.adminLabel, props.user.roles)
    }
  }

  render() {
    const { adminLabel, onDismiss, user: { email } } = this.props
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
        label({ style: { margin: '0 2rem 0 0.25rem' } }, [`Can manage users (${adminLabel})`])
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { adminLabel, userLabel, user: { email, roles }, onSuccess, saveFunction } = this.props
    const { isAdmin } = this.state

    const applyAdminChange = _.flow(
      _.without([isAdmin ? userLabel : adminLabel]),
      _.union([isAdmin ? adminLabel : userLabel])
    )

    try {
      this.setState({ submitting: true })
      await saveFunction(email, roles, applyAdminChange(roles))
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error updating user', error)
    }
  }
}

export const DeleteUserModal = pure(({ onDismiss, onSubmit, userEmail }) => {
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
