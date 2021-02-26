import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { a, b, div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Link, PageBox, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { AdminNotifierCheckbox } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
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

const NewGroupModal = ({ onSuccess, onDismiss, existingGroups }) => {
  const [groupName, setGroupName] = useState('')
  const [groupNameTouched, setGroupNameTouched] = useState(false)
  const [allowAccessRequests, setAllowAccessRequests] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const submit = _.flow(
    Utils.withBusyState(setSubmitting),
    withErrorReporting('Error creating group')
  )(async () => {
    const groupAjax = Ajax().Groups.group(groupName)
    await groupAjax.create()
    await groupAjax.setPolicy('admin-notifier', allowAccessRequests)
    onSuccess()
  })

  const errors = validate({ groupName }, { groupName: groupNameValidator(existingGroups) })

  return h(Modal, {
    onDismiss,
    title: 'Create New Group',
    okButton: h(ButtonPrimary, {
      disabled: errors,
      onClick: () => submit()
    }, ['Create Group'])
  }, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { required: true, htmlFor: id }, ['Enter a unique name']),
      h(ValidatedInput, {
        inputProps: {
          id,
          autoFocus: true,
          value: groupName,
          onChange: v => {
            setGroupName(v)
            setGroupNameTouched(true)
          }
        },
        error: groupNameTouched && Utils.summarizeErrors(errors && errors.groupName)
      })
    ])]),
    !(groupNameTouched && errors) && formHint('Only letters, numbers, underscores, and dashes allowed'),
    h(AdminNotifierCheckbox, {
      checked: allowAccessRequests,
      onChange: setAllowAccessRequests
    }),
    submitting && spinnerOverlay
  ])
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

const GroupList = () => {
  // State
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [groups, setGroups] = useState(() => StateHistory.get().groups || null)
  const [creatingNewGroup, setCreatingNewGroup] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const signal = Utils.useCancellation()


  // Helpers
  const refresh = withErrorReporting('Error loading group list', async () => {
    setIsDataLoaded(false)
    setCreatingNewGroup(false)
    setDeletingGroup(false)
    setUpdating(false)

    const rawGroups = await Ajax(signal).Groups.list()
    const groups = _.flow(
      _.groupBy('groupName'),
      _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
      _.sortBy('groupName')
    )(rawGroups)
    setGroups(groups)
    setIsDataLoaded(true)
  })


  // Lifecycle
  Utils.useOnMount(() => {
    refresh()
  })

  useEffect(() => {
    StateHistory.update({ filter, groups })
  }, [filter, groups])


  // Render
  const filteredGroups = _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups)

  return h(FooterWrapper, [
    h(TopBar, { title: 'Groups' }, [
      h(DelayedSearchInput, {
        'aria-label': 'Search groups',
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH GROUPS',
        onChange: setFilter,
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
          onClick: () => setCreatingNewGroup(true)
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
                  onDelete: () => setDeletingGroup(group)
                })
              }, filteredGroups)
            ])
          }
        ),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewGroup && h(NewGroupModal, {
        existingGroups: _.map('groupName', groups),
        onDismiss: () => setCreatingNewGroup(false),
        onSuccess: refresh
      }),
      deletingGroup && h(DeleteGroupModal, {
        groupName: deletingGroup.groupName,
        onDismiss: () => setDeletingGroup(false),
        onSubmit: _.flow(
          withErrorReporting('Error deleting group'),
          Utils.withBusyState(setUpdating)
        )(async () => {
          setDeletingGroup(false)
          await Ajax().Groups.group(deletingGroup.groupName).delete()
          refresh()
        })
      }),
      updating && spinnerOverlay
    ])
  ])
}

export const navPaths = [
  {
    name: 'groups',
    path: '/groups',
    component: GroupList,
    title: 'Group Management'
  }
]
