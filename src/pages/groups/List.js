import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, b, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, link, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { TopBar } from 'src/components/TopBar'
import { Groups } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import { validate } from 'validate.js'


const groupNameValidator = {
  presence: { allowEmpty: false },
  format: {
    pattern: /[A-Za-z0-9_-]*$/,
    message: 'can only contain letters, numbers, underscores, and dashes'
  }
}

class NewGroupModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      groupName: '',
      groupNameTouched: false
    }
  }

  render() {
    const { onDismiss } = this.props
    const { groupName, groupNameTouched, submitting } = this.state

    const errors = validate({ groupName }, { groupName: groupNameValidator })

    return h(Modal, {
      onDismiss,
      title: 'Create New Group',
      okButton: buttonPrimary({
        disabled: errors,
        onClick: () => this.submit()
      }, ['Create Group'])
    }, [
      div({ style: styles.formLabel }, ['Enter a unique name']),
      validatedInput({
        inputProps: {
          autoFocus: true,
          value: groupName,
          onChange: e => this.setState({ groupName: e.target.value, groupNameTouched: true })
        },
        error: groupNameTouched && Utils.summarizeErrors(errors && errors.groupName)
      }),
      !(groupNameTouched && errors) && div({ style: { fontSize: 'smaller', marginTop: '0.25rem' } }, [
        'Only letters, numbers, underscores, and dashes allowed'
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess } = this.props
    const { groupName } = this.state

    try {
      this.setState({ submitting: true })
      await Groups.group(groupName).create()
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error creating group', error)
    }
  }
}

const DeleteGroupModal = pure(({ groupName, onDismiss, onSubmit }) => {
  return h(Modal, {
    onDismiss,
    title: 'Confirm',
    okButton: buttonPrimary({
      onClick: onSubmit
    }, ['Delete Group'])
  }, [
    'Are you sure you want to delete the group ',
    b([`${groupName}?`])
  ])
})

const GroupCard = pure(({ group: { groupName, groupEmail, role }, onDelete }) => {
  const isAdmin = role === 'admin'

  return a({
    href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
    style: styles.longCard
  }, [
    div({
      style: {
        width: '30%', color: isAdmin ? colors.primary[0] : undefined,
        ...styles.longTitle
      }
    }, [groupName]),
    div({ style: { flexGrow: 1 } }, [groupEmail]),
    div({ style: { width: 100, display: 'flex', alignItems: 'center' } }, [
      div({ style: { flexGrow: 1, textTransform: 'capitalize' } }, [role]),
      isAdmin && link({ onClick: e => { e.preventDefault(); onDelete() }, as: 'div' }, [
        icon('trash', { className: 'is-solid', size: 17 })
      ])
    ])
  ])
})

const NewGroupCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: styles.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Group']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export class GroupList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      groups: null,
      creatingNewGroup: false,
      deletingGroup: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    try {
      this.setState({ isDataLoaded: false, creatingNewGroup: false, deletingGroup: false, updating: false })
      const groups = await Groups.list()
      this.setState({
        isDataLoaded: true,
        groups: _.sortBy('group.groupName', groups)
      })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { groups, isDataLoaded, filter, creatingNewGroup, deletingGroup, updating } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Groups', href: Nav.getLink('groups') }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH GROUPS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          'Group Management'
        ])
      ]),
      div({ style: styles.cardContainer }, [
        h(NewGroupCard, {
          onClick: () => this.setState({ creatingNewGroup: true })
        }),
        div({ style: { flexGrow: 1 } },
          _.map(group => {
            return h(GroupCard, {
              group, key: group.groupName,
              onDelete: () => this.setState({ deletingGroup: group })
            })
          }, _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups))
        ),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewGroup && h(NewGroupModal, {
        onDismiss: () => this.setState({ creatingNewGroup: false }),
        onSuccess: () => this.refresh()
      }),
      deletingGroup && h(DeleteGroupModal, {
        groupName: deletingGroup.groupName,
        onDismiss: () => this.setState({ deletingGroup: false }),
        onSubmit: async () => {
          try {
            this.setState({ deletingGroup: false, updating: true })
            await Groups.group(deletingGroup.groupName).delete()
            this.refresh()
          } catch (error) {
            this.setState({ updating: false })
            reportError('Error deleting group', error)
          }
        }
      }),
      updating && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['groups', 'filter'],
      this.state)
    )
  }
}


export const addNavPaths = () => {
  Nav.defPath('groups', {
    path: '/groups',
    component: GroupList,
    title: 'Group Management'
  })
}
