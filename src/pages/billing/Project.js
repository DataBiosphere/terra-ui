import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, Select, SimpleTabBar, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, MemberCardHeaders, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'


const workspaceLastModifiedWidth = 200
const styles = {
  workspaceCardField: {
    flex: 1, width: `calc(50% - ${workspaceLastModifiedWidth / 2}px)`, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
  }
}


const WorkspaceCard = Utils.memoWithName('WorkspaceCard', ({ workspace }) => div({
  style: Style.cardList.longCardShadowless
}, [
  div({ style: styles.workspaceCardField }, [workspace.name]),
  div({ style: styles.workspaceCardField }, [workspace.createdBy]),
  div({ style: { flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [workspace.lastModified])
]))

const ProjectDetail = ({ project, project: { projectName, creationStatus }, billingAccounts, authorizeAndLoadAccounts }) => {
  // State
  const { query } = Nav.useRoute()
  // Rather than using a localized StateHistory store here, we use the existing `workspaceStore` value (via the `useWorkspaces` hook)
  const { workspaces, refresh: refreshWorkspaces } = useWorkspaces()

  const [projectUsers, setProjectUsers] = useState(() => StateHistory.get().projectUsers || null)
  const [addingUser, setAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updatingAccount, setUpdatingAccount] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingBillingInfo, setLoadingBillingInfo] = useState(false)
  const [billingAccountName, setBillingAccountName] = useState(null)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState()
  const [tab, setTab] = useState(query.tab || 'workspaces')

  const [sort, setSort] = useState({ field: 'email', direction: 'asc' })

  const signal = Utils.useCancellation()

  const adminCanEdit = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1

  const tabToTable = {
    workspaces: div({ style: { flexGrow: 1, width: '100%' } }, [
      _.flow(
        _.filter({ workspace: { namespace: projectName } }),
        _.map(({ workspace }) => h(WorkspaceCard, { workspace, key: workspace.workspaceId }))
      )(workspaces)
    ]),
    users: h(Fragment, [
      h(NewUserCard, {
        onClick: () => setAddingUser(true)
      }, [
        icon('plus-circle', { size: 14 }),
        div({ style: { marginLeft: '0.5rem' } }, ['Add User'])
      ]),
      h(MemberCardHeaders, { sort, onSort: setSort }),
      div(
        _.map(member => {
          return h(MemberCard, {
            key: member.email,
            adminLabel: billingRoles.owner,
            userLabel: billingRoles.user,
            member, adminCanEdit,
            onEdit: () => setEditingUser(member),
            onDelete: () => setDeletingUser(member)
          })
        }, _.orderBy([sort.field], [sort.direction], projectUsers))
      )
    ])
  }

  const tabs = _.map(key => ({
    key,
    title: span({ style: { padding: '0 0.5rem' } }, [
      _.capitalize(key)
    ]),
    tableName: _.lowerCase(key)
  }), _.keys(tabToTable))

  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = qs.stringify({
      ...query, tab: tab === tabs[0].key ? undefined : tab
    }, { addQueryPrefix: true })

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  })

  // Helpers
  const updateBillingAccount = _.flow(
    withErrorReporting('Error updating billing account'),
    Utils.withBusyState(setUpdatingAccount)
  )(async newAccountName => {
    const { billingAccountName } = await Ajax(signal).GoogleBilling.changeBillingAccount({ projectId: projectName, newAccountName })
    setBillingAccountName(billingAccountName)
  })

  const loadBillingInfo = _.flow(
    withErrorReporting('Error loading current billing account'),
    Utils.withBusyState(setLoadingBillingInfo)
  )(async () => {
    if (Auth.hasBillingScope()) {
      const { billingAccountName } = await Ajax(signal).GoogleBilling.getBillingInfo(projectName)
      setBillingAccountName(billingAccountName)
    }
  })

  const refresh = _.flow(
    withErrorReporting('Error loading billing project users list'),
    Utils.withBusyState(setRefreshing)
  )(async () => {
    setAddingUser(false)
    setDeletingUser(false)
    setUpdating(false)
    setEditingUser(false)
    // const rawWorkspaces = await Ajax(signal).Workspaces.list()
    // setWorkspaces(_.map(response => response.workspace, _.filter(response => response.workspace.namespace === projectName, rawWorkspaces)))
    refreshWorkspaces()
    const rawProjectUsers = await Ajax(signal).Billing.project(project.projectName).listUsers()
    const projectUsers = _.flow(
      _.groupBy('email'),
      _.map(gs => ({ ..._.omit('role', gs[0]), roles: _.map('role', gs) })),
      _.sortBy('email')
    )(rawProjectUsers)
    setProjectUsers(projectUsers)
  })


  // Lifecycle
  Utils.useOnMount(() => {
    refresh()
    loadBillingInfo()
  })

  useEffect(() => {
    StateHistory.update({ projectUsers })
  }, [projectUsers])


  // Render
  const { displayName = null } = _.find({ accountName: billingAccountName }, billingAccounts) || { displayName: 'No Access' }

  return h(Fragment, [
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
        projectName,
        span({ style: { fontWeight: 500, fontSize: 14, margin: '0 1.5rem 0 3rem' } }, creationStatus),
        Utils.cond(
          [creationStatus === 'Ready', () => icon('check', { style: { color: colors.success() } })],
          [creationStatus === 'Creating', () => spinner({ size: 16 })],
          () => icon('error-standard', { style: { color: colors.danger() } })
        )
      ]),
      div({ style: { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', marginTop: '0.5rem', marginLeft: '1rem' } }, [
        !!displayName && span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, margin: '0 0.75rem 0 0' } }, 'Billing Account:'),
        !!displayName && span({ style: { flexShrink: 0 } }, displayName),
        h(Link, {
          'aria-label': 'Change Billing Account',
          style: { marginLeft: '0.5rem' },
          onClick: async () => {
            if (Auth.hasBillingScope()) {
              setShowBillingModal(true)
            } else {
              await authorizeAndLoadAccounts()
              await loadBillingInfo()
              setShowBillingModal(Auth.hasBillingScope())
            }
          }
        }, [icon('edit', { size: 12 })]),
        showBillingModal && h(Modal, {
          title: 'Change Billing Account',
          onDismiss: () => setShowBillingModal(false),
          okButton: h(ButtonPrimary, {
            disabled: !selectedBilling || billingAccountName === selectedBilling,
            onClick: async () => {
              setShowBillingModal(false)
              await updateBillingAccount(selectedBilling)
            }
          }, ['Ok'])
        }, [
          h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
            h(Select, {
              id,
              value: selectedBilling || billingAccountName,
              isClearable: false,
              options: _.map(({ displayName, accountName }) => ({ label: displayName, value: accountName }), billingAccounts),
              onChange: ({ value: newAccountName }) => setSelectedBilling(newAccountName)
            })
          ])])
        ])
      ]),
      h(SimpleTabBar, {
        style: { marginTop: '2rem', textTransform: 'none', padding: '0 1rem', fontSize: 12, height: '1.5rem' },
        tabStyle: { borderBottomWidth: 4 },
        value: tab,
        onChange: newTab => {
          if (newTab === tab) {
            refresh()
          } else {
            setTab(newTab)
          }
        },
        tabs
      }),
      div({
        style: {
          padding: '1rem 1rem 0',
          backgroundColor: colors.light(),
          flexGrow: 1
        }
      }, [
        tabToTable[tab]
      ])
    ]),
    addingUser && h(NewUserModal, {
      adminLabel: billingRoles.owner,
      userLabel: billingRoles.user,
      title: 'Add user to Billing Project',
      footer: 'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
      addFunction: Ajax().Billing.project(projectName).addUser,
      onDismiss: () => setAddingUser(false),
      onSuccess: refresh
    }),
    editingUser && h(EditUserModal, {
      adminLabel: billingRoles.owner,
      userLabel: billingRoles.user,
      user: editingUser,
      saveFunction: Ajax().Billing.project(projectName).changeUserRoles,
      onDismiss: () => setEditingUser(false),
      onSuccess: refresh
    }),
    !!deletingUser && h(DeleteUserModal, {
      userEmail: deletingUser.email,
      onDismiss: () => setDeletingUser(false),
      onSubmit: _.flow(
        withErrorReporting('Error removing member from billing project'),
        Utils.withBusyState(setUpdating)
      )(async () => {
        setDeletingUser(false)
        await Ajax().Billing.project(projectName).removeUser(deletingUser.roles, deletingUser.email)
        refresh()
      })
    }),
    (refreshing || loadingBillingInfo || updatingAccount || updating) && spinnerOverlay
  ])
}

export default ProjectDetail
