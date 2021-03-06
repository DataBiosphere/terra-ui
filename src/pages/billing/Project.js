import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Select, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'


const ProjectDetail = ({ project, project: { projectName, creationStatus }, billingAccounts, authorizeAndLoadAccounts }) => {
  // State
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

  const signal = Utils.useCancellation()


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
  const adminCanEdit = _.filter(({ roles }) => _.includes('Owner', roles), projectUsers).length > 1
  const { displayName = null } = _.find({ accountName: billingAccountName }, billingAccounts) || {}

  return h(Fragment, [
    div({ style: { padding: '1.5rem 3rem', flexGrow: 1 } }, [
      div({ style: { color: colors.dark(), fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' } }, [
        projectName,
        span({ style: { fontWeight: 500, fontSize: 14, margin: '0 1.5rem 0 3rem' } }, creationStatus),
        Utils.cond(
          [creationStatus === 'Ready', () => icon('check', { style: { color: colors.success() } })],
          [creationStatus === 'Creating', () => spinner({ size: 16 })],
          () => icon('error-standard', { style: { color: colors.danger() } })
        ),
        !!displayName && span({ style: { flexShrink: 0, fontWeight: 500, fontSize: 14, margin: '0 0.75rem 0 auto' } }, 'Billing Account:'),
        !!displayName && span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14 } }, displayName),
        h(ButtonPrimary, {
          style: { marginLeft: 'auto' },
          onClick: async () => {
            if (Auth.hasBillingScope()) {
              setShowBillingModal(true)
            } else {
              await authorizeAndLoadAccounts()
              await loadBillingInfo()
              setShowBillingModal(Auth.hasBillingScope())
            }
          }
        }, 'Change Account'),
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
      div({
        style: {
          marginTop: '1rem',
          display: 'flex'
        }
      }, [
        h(NewUserCard, {
          onClick: () => setAddingUser(true)
        }),
        div({ style: { flexGrow: 1 } },
          _.map(member => {
            return h(MemberCard, {
              adminLabel: 'Owner',
              userLabel: 'User',
              member, adminCanEdit,
              onEdit: () => setEditingUser(member),
              onDelete: () => setDeletingUser(member)
            })
          }, projectUsers)
        )
      ])
    ]),
    addingUser && h(NewUserModal, {
      adminLabel: 'Owner',
      userLabel: 'User',
      title: 'Add user to Billing Project',
      footer: 'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
      addFunction: Ajax().Billing.project(projectName).addUser,
      onDismiss: () => setAddingUser(false),
      onSuccess: refresh
    }),
    editingUser && h(EditUserModal, {
      adminLabel: 'Owner',
      userLabel: 'User',
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
