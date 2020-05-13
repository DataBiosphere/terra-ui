import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { a, b, div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Link, PageBox, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { AdminNotifierCheckbox } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { formHint, FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { validate } from 'validate.js'


const groupNameValidator = existing => ({
  presence: { allowEmpty: false },
  format: {
    pattern: /[A-Za-z0-9_-]*$/,
    message: 'can only contain letters, numbers, underscores, and dashes'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

const NewGroupModal = class NewGroupModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      groupName: '',
      groupNameTouched: false,
      allowAccessRequests: true
    }
  }

  render() {
    const { onDismiss, existingGroups } = this.props
    const { groupName, groupNameTouched, allowAccessRequests, submitting } = this.state

    const errors = validate({ groupName }, { groupName: groupNameValidator(existingGroups) })

    return h(Modal, {
      onDismiss,
      title: 'Create New Group',
      okButton: h(ButtonPrimary, {
        disabled: errors,
        onClick: () => this.submit()
      }, ['Create Group'])
    }, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { required: true, htmlFor: id }, ['Enter a unique name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            value: groupName,
            onChange: v => this.setState({ groupName: v, groupNameTouched: true })
          },
          error: groupNameTouched && Utils.summarizeErrors(errors && errors.groupName)
        })
      ])]),
      !(groupNameTouched && errors) && formHint('Only letters, numbers, underscores, and dashes allowed'),
      h(AdminNotifierCheckbox, {
        checked: allowAccessRequests,
        onChange: v => this.setState({ allowAccessRequests: v })
      }),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess } = this.props
    const { groupName, allowAccessRequests } = this.state

    try {
      this.setState({ submitting: true })
      const groupAjax = Ajax().Groups.group(groupName)
      await groupAjax.create()
      await groupAjax.setPolicy('admin-notifier', allowAccessRequests)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error creating group', error)
    }
  }
}

const DeleteGroupModal = ({ groupName, onDismiss, onSubmit }) => {
  return h(Modal, {
    onDismiss,
    title: 'Confirm Group Delete',
    okButton: h(ButtonPrimary, {
      onClick: onSubmit
    }, ['Delete Group'])
  }, [
    'Are you sure you want to delete the group ',
    b([`${groupName}?`])
  ])
}

const GroupCard = Utils.memoWithName('GroupCard', ({ group: { groupName, groupEmail, role }, onDelete }) => {
  const isAdmin = !!_.includes('admin', role)

  return div({ style: Style.cardList.longCard }, [
    a({
      href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
      style: {
        ...Style.cardList.longTitle,
        marginRight: '1rem',
        width: '30%', color: isAdmin ? colors.accent() : undefined
      }
    }, [groupName]),
    div({ style: { flexGrow: 1 } }, [groupEmail]),
    div({ style: { width: 100, display: 'flex', alignItems: 'center' } }, [
      div({ style: { flexGrow: 1 } }, [isAdmin ? 'Admin' : 'Member']),
      isAdmin && h(Link, {
        'aria-label': `Delete group ${groupName}`,
        onClick: onDelete,
        style: { margin: '-1rem', padding: '1rem' }
      }, [
        icon('trash', { size: 17 })
      ])
    ])
  ])
})

const NewGroupCard = ({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Group']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
}

const noGroupsMessage = div({ style: { fontSize: 20, margin: '0 1rem' } }, [
  div([
    'Create a group to share your workspaces with others.'
  ]),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(Link, {
      ...Utils.newTabLinkProps,
      href: `https://support.terra.bio/hc/en-us/articles/360026775691`
    }, [`How do I use groups to manage authorization?`])
  ])
])

export const GroupList = ajaxCaller(class GroupList extends Component {
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
    const { ajax: { Groups } } = this.props

    try {
      this.setState({ isDataLoaded: false, creatingNewGroup: false, deletingGroup: false, updating: false })
      const rawGroups = await Groups.list()
      const groups = _.flow(
        _.groupBy('groupName'),
        _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
        _.sortBy('groupName')
      )(rawGroups)
      this.setState({ groups, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { groups, isDataLoaded, filter, creatingNewGroup, deletingGroup, updating } = this.state
    const filteredGroups = _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups)

    return h(FooterWrapper, [
      h(TopBar, { title: 'Groups' }, [
        h(DelayedSearchInput, {
          'aria-label': 'Search groups',
          style: { marginLeft: '2rem', width: 500 },
          placeholder: 'SEARCH GROUPS',
          onChange: v => this.setState({ filter: v }),
          value: filter
        })
      ]),
      h(PageBox, { role: 'main', style: { flexGrow: 1 } }, [
        div({ style: Style.cardList.toolbarContainer }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
            'Group Management'
          ])
        ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewGroupCard, {
            onClick: () => this.setState({ creatingNewGroup: true })
          }),
          Utils.cond(
            [groups && _.isEmpty(groups), () => noGroupsMessage],
            [!_.isEmpty(groups) && _.isEmpty(filteredGroups), () => {
              return div({ style: { fontStyle: 'italic' } }, ['No matching groups'])
            }],
            () => {
              return div({ style: { flexGrow: 1 } }, [
                _.map(group => {
                  return h(GroupCard, {
                    group, key: `${group.groupName}`,
                    onDelete: () => this.setState({ deletingGroup: group })
                  })
                }, filteredGroups)
              ])
            }
          ),
          !isDataLoaded && spinnerOverlay
        ]),
        creatingNewGroup && h(NewGroupModal, {
          existingGroups: _.map('groupName', groups),
          onDismiss: () => this.setState({ creatingNewGroup: false }),
          onSuccess: () => this.refresh()
        }),
        deletingGroup && h(DeleteGroupModal, {
          groupName: deletingGroup.groupName,
          onDismiss: () => this.setState({ deletingGroup: false }),
          onSubmit: async () => {
            try {
              this.setState({ deletingGroup: false, updating: true })
              await Ajax().Groups.group(deletingGroup.groupName).delete()
              this.refresh()
            } catch (error) {
              this.setState({ updating: false })
              reportError('Error deleting group', error)
            }
          }
        }),
        updating && spinnerOverlay
      ])
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['groups', 'filter'],
      this.state)
    )
  }
})


export const navPaths = [
  {
    name: 'groups',
    path: '/groups',
    component: GroupList,
    title: 'Group Management'
  }
]
