import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { PageBox, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { AdminNotifierCheckbox, DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import { DelayedSearchInput } from 'src/components/input'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const GroupDetails = ({ groupName }) => {
  // State
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [members, setMembers] = useState(() => StateHistory.get().members || null)
  const [creatingNewUser, setCreatingNewUser] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adminCanEdit, setAdminCanEdit] = useState(false)
  const [allowAccessRequests, setAllowAccessRequests] = useState(false)

  const signal = Utils.useCancellation()


  // Helpers
  const refresh = _.flow(
    withErrorReporting('Error loading group list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    setCreatingNewUser(false)
    setEditingUser(false)
    setDeletingUser(false)
    setUpdating(false)

    const groupAjax = Ajax(signal).Groups.group(groupName)
    const [membersEmails, adminsEmails, allowAccessRequests] = await Promise.all([
      groupAjax.listMembers(), groupAjax.listAdmins(), groupAjax.getPolicy('admin-notifier')
    ])

    const rolesByMember = _.mergeAllWith((a, b) => { if (_.isArray(a)) return a.concat(b) }, [
      _.fromPairs(_.map(email => [email, ['admin']], adminsEmails)),
      _.fromPairs(_.map(email => [email, ['member']], membersEmails))
    ])
    const members = _.flow(
      _.toPairs,
      _.map(([email, roles]) => ({ email, roles })),
      _.sortBy(member => member.email.toUpperCase())
    )(rolesByMember)
    setMembers(members)
    setAdminCanEdit(adminsEmails.length > 1)
    setAllowAccessRequests(allowAccessRequests)
  })


  // Lifecycle
  Utils.useOnMount(() => {
    refresh()
  })

  useEffect(() => {
    StateHistory.update({ filter, members })
  }, [filter, members])


  // Render
  return h(FooterWrapper, [
    h(TopBar, { title: 'Groups', href: Nav.getLink('groups') }, [
      h(DelayedSearchInput, {
        'aria-label': 'Search group',
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH GROUP',
        onChange: setFilter,
        value: filter
      })
    ]),
    h(PageBox, { role: 'main', style: { flexGrow: 1 } }, [
      div({ style: Style.cardList.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          `Group Management: ${groupName}`
        ])
      ]),
      h(AdminNotifierCheckbox, {
        checked: allowAccessRequests,
        onChange: _.flow(
          withErrorReporting('Error changing access request permission'),
          Utils.withBusyState(setUpdating)
        )(async () => {
          await Ajax().Groups.group(groupName).setPolicy('admin-notifier', !allowAccessRequests)
          return refresh()
        })
      }),
      div({ style: Style.cardList.cardContainer }, [
        h(NewUserCard, {
          onClick: () => setCreatingNewUser(true)
        }),
        div({ style: { flexGrow: 1 } },
          _.map(member => {
            return h(MemberCard, {
              adminLabel: 'admin',
              userLabel: 'member',
              member, adminCanEdit,
              onEdit: () => setEditingUser(member),
              onDelete: () => setDeletingUser(member)
            })
          }, _.filter(({ email }) => Utils.textMatch(filter, email), members))
        ),
        loading && spinnerOverlay
      ]),
      creatingNewUser && h(NewUserModal, {
        adminLabel: 'admin',
        userLabel: 'member',
        title: 'Add user to Terra Group',
        addUnregisteredUser: true,
        addFunction: Ajax().Groups.group(groupName).addUser,
        onDismiss: () => setCreatingNewUser(false),
        onSuccess: refresh
      }),
      editingUser && h(EditUserModal, {
        adminLabel: 'admin',
        userLabel: 'member',
        user: editingUser,
        saveFunction: Ajax().Groups.group(groupName).changeUserRoles,
        onDismiss: () => setEditingUser(false),
        onSuccess: refresh
      }),
      deletingUser && h(DeleteUserModal, {
        userEmail: deletingUser.email,
        onDismiss: () => setDeletingUser(false),
        onSubmit: _.flow(
          withErrorReporting('Error removing member from group'),
          Utils.withBusyState(setUpdating)
        )(async () => {
          setDeletingUser(false)
          await Ajax().Groups.group(groupName).removeUser(deletingUser.roles, deletingUser.email)
          refresh()
        })
      }),
      updating && spinnerOverlay
    ])
  ])
}


export const navPaths = [
  {
    name: 'group',
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`
  }
]
