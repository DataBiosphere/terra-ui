import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { a, b, div, h, h2 } from 'react-hyperscript-helpers'
import { ButtonPrimary, HeaderRenderer, IdContainer, Link, PageBox, PageBoxVariants, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { AdminNotifierCheckbox } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { ariaSort } from 'src/components/table'
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
      onClick: submit
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
        error: groupNameTouched && Utils.summarizeErrors(errors?.groupName)
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

const roleSectionWidth = 20

const GroupCardHeaders = Utils.memoWithName('GroupCardHeaders', ({ sort, onSort }) => {
  return div({ role: 'row', style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem' } }, [
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupName'), style: { width: '30%', marginRight: '1rem' } }, [
      h(HeaderRenderer, { sort, onSort, name: 'groupName' })
    ]),
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupEmail'), style: { flexGrow: 1 } }, [
      h(HeaderRenderer, { sort, onSort, name: 'groupEmail' })
    ]),
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'role'), style: { width: '20%' } }, [
      // This behaves strangely due to the fact that role is an array. If you have multiple roles it can do strange things.
      h(HeaderRenderer, { sort, onSort, name: 'role' })
    ]),
    // Width is the same as the menu icon.
    div({ role: 'columnheader', style: { width: roleSectionWidth } }, [
      div({ className: 'sr-only' }, ['Actions'])
    ])
  ])
})

const GroupCard = Utils.memoWithName('GroupCard', ({ group: { groupName, groupEmail, role }, onDelete }) => {
  const isAdmin = !!_.includes('admin', role)

  return div({ role: 'row', style: Style.cardList.longCardShadowless }, [
    div({ role: 'rowheader', style: { marginRight: '1rem', width: '30%' } }, [
      a({
        href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
        'aria-disabled': !isAdmin,
        style: {
          ...Style.cardList.longTitle,
          color: isAdmin ? colors.accent() : undefined
        }
      }, [groupName])
    ]),
    div({ role: 'cell', style: { flexGrow: 1 } }, [groupEmail]),
    div({ role: 'cell', style: { width: '20%' } }, [isAdmin ? 'Admin' : 'Member']),
    div({ role: 'cell', style: { width: roleSectionWidth, display: 'flex', alignItems: 'center' } }, [
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
  return h(ButtonPrimary, {
    style: { textTransform: 'none' },
    onClick
  }, [
    icon('plus', { size: 14 }),
    div({ style: { marginLeft: '0.5rem' } }, ['Create a New Group'])
  ])
}

const noGroupsMessage = div({ style: { fontSize: 20, margin: '1rem 1rem 0' } }, [
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
  const [sort, setSort] = useState({ field: 'groupName', direction: 'asc' })

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
    h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.LIGHT }, [
      div({ style: Style.cardList.toolbarContainer }, [
        h2({ style: { ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' } }, [
          'Group Management'
        ])
      ]),
      div({ style: { marginTop: '1rem' } }, [
        h(NewGroupCard, {
          onClick: () => setCreatingNewGroup(true)
        }),
        Utils.cond(
          [groups && _.isEmpty(groups), () => noGroupsMessage],
          [!_.isEmpty(groups) && _.isEmpty(filteredGroups), () => {
            return div({ style: { fontStyle: 'italic', marginTop: '1rem' } }, ['No matching groups'])
          }],
          () => {
            return div({ role: 'table', 'aria-label': 'groups list' }, [
              h(GroupCardHeaders, { sort, onSort: setSort }),
              div({ style: { flexGrow: 1, marginTop: '1rem' } }, [
                _.map(group => {
                  return h(GroupCard, {
                    group, key: `${group.groupName}`,
                    onDelete: () => setDeletingGroup(group)
                  })
                }, _.orderBy([sort.field], [sort.direction], filteredGroups))
              ])
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
