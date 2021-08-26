import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, HeaderRenderer, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, MemberCardHeaders, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon, spinner } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { SimpleTabBar } from 'src/components/tabBars'
import { ariaSort } from 'src/components/table'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'


const workspaceStatusIconWidth = 16
const workspaceLastModifiedWidth = 150
const workspaceExpandIconSize = 20

const paddingForWorkspaceStatusIcon =
  div({ style: { width: workspaceStatusIconWidth } },
    [div({ className: 'sr-only' }, ['Status'])])

const WorkspaceCardHeaders = Utils.memoWithName('WorkspaceCardHeaders', ({ sort, onSort }) => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem', marginBottom: '0.5rem' } }, [
    paddingForWorkspaceStatusIcon,
    div({ 'aria-sort': ariaSort(sort, 'name'), style: { flex: 1, paddingLeft: '1rem' } }, [
      h(HeaderRenderer, { sort, onSort, name: 'name' })
    ]),
    div({ 'aria-sort': ariaSort(sort, 'createdBy'), style: { flex: 1 } }, [
      h(HeaderRenderer, { sort, onSort, name: 'createdBy' })
    ]),
    div({ 'aria-sort': ariaSort(sort, 'lastModified'), style: { flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [
      h(HeaderRenderer, { sort, onSort, name: 'lastModified' })
    ]),
    div({ style: { flex: `0 0 ${workspaceExpandIconSize}px` } }, [
      div({ className: 'sr-only' }, ['Expand'])
    ])
  ])
})

const rowBase = { display: 'flex', alignItems: 'center', width: '100%' }

const ExpandedInfoRow = Utils.memoWithName('ExpandedInfoRow', ({ title, details, additionalInfo }) => {
  const expandedInfoStyles = {
    row: { ...rowBase, marginTop: '0.5rem', height: '1rem' },
    title: { fontWeight: 600, width: '20%', paddingRight: '1rem', height: '1rem' },
    details: { flexGrow: 1, width: '20%', paddingRight: '1rem', height: '1rem', ...Style.noWrapEllipsis },
    additionalInfo: { flexGrow: 1 }
  }

  return div({ style: expandedInfoStyles.row }, [
    div({ style: expandedInfoStyles.title }, [title]),
    div({ style: expandedInfoStyles.details }, [details]),
    div({ style: expandedInfoStyles.additionalInfo }, [additionalInfo])
  ])
})

const WorkspaceCard = Utils.memoWithName('WorkspaceCard', ({ workspace, statusIcon, isExpanded, onExpand }) => {
  const { namespace, name, createdBy, lastModified, googleProject, billingAccountName } = workspace
  const workspaceCardStyles = {
    field: {
      ...Style.noWrapEllipsis, flex: 1, height: '1rem', width: `calc(50% - ${(workspaceLastModifiedWidth + workspaceExpandIconSize) / 2}px)`, paddingRight: '1rem'
    },
    row: rowBase,
    expandedInfoContainer: { display: 'flex', flexDirection: 'column', width: '100%' }
  }

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless, flexDirection: 'column' } }, [
    h(IdContainer, [id => h(Fragment, [
      div({ style: workspaceCardStyles.row }, [
        statusIcon,
        div({ style: { ...workspaceCardStyles.field, display: 'flex', alignItems: 'center', paddingLeft: '1rem' } }, [
          h(Link, {
            style: Style.noWrapEllipsis,
            href: Nav.getLink('workspace-dashboard', { namespace, name }),
            onClick: () => {
              Ajax().Metrics.captureEvent(Events.billingProjectGoToWorkspace, {
                billingProjectName: namespace,
                workspaceName: name
              })
            }
          }, [name])
        ]),
        div({ style: workspaceCardStyles.field }, [createdBy]),
        div({ style: { height: '1rem', flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [Utils.makeStandardDate(lastModified)]),
        div({ style: { flex: `0 0 ${workspaceExpandIconSize}px` } }, [
          h(Link, {
            'aria-label': 'expand workspace',
            'aria-expanded': isExpanded,
            'aria-controls': isExpanded ? id : undefined,
            'aria-owns': isExpanded ? id : undefined,
            style: { display: 'flex', alignItems: 'center' },
            onClick: () => {
              Ajax().Metrics.captureEvent(Events.billingProjectExpandWorkspace, {
                billingProjectName: namespace,
                workspaceName: name
              })
              onExpand()
            }
          }, [
            icon(isExpanded ? 'angle-up' : 'angle-down', { size: workspaceExpandIconSize })
          ])
        ])
      ]),
      isExpanded && div({ id, style: workspaceCardStyles.row }, [
        div({ style: workspaceCardStyles.expandedInfoContainer }, [
          h(ExpandedInfoRow, { title: 'Google Project', details: googleProject }),
          h(ExpandedInfoRow, { title: 'Billing Account', details: billingAccountName })
        ])
      ])
    ])])
  ])
})

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
  const [showSpendReportConfigurationModal, setShowSpendReportConfigurationModal] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState()
  const [selectedDatasetProjectName, setSelectedDatasetProjectName] = useState(null)
  const [selectedDatasetName, setSelectedDatasetName] = useState(null)
  const [tab, setTab] = useState(query.tab || 'workspaces')
  const [expandedWorkspaceName, setExpandedWorkspaceName] = useState()
  const [sort, setSort] = useState({ field: 'email', direction: 'asc' })
  const [workspaceSort, setWorkspaceSort] = useState({ field: 'name', direction: 'asc' })

  const signal = Utils.useCancellation()

  const adminCanEdit = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1

  const workspacesInProject = useMemo(() => _.flow(
    _.map(({ workspace }) => workspace),
    _.filter({ namespace: projectName })
  )(workspaces), [workspaces, projectName])

  const getBillingAccountStatusIcon = (() => {
    const allWorkspacesHaveCorrectBillingAccount =
      _.isEmpty(_.remove({ billingAccount: billingAccountName }, workspacesInProject))
    const getIcon = shape => icon(shape, { size: workspaceStatusIconWidth })
    return workspace => allWorkspacesHaveCorrectBillingAccount ? paddingForWorkspaceStatusIcon :
      billingAccountName === workspace.billingAccount ? getIcon('success-standard') :
        'billingAccountErrorMessage' in workspace ? getIcon('error-standard') :
          getIcon('loadingSpinner')
  })()

  const tabToTable = {
    workspaces: h(Fragment, [
      h(WorkspaceCardHeaders, { sort: workspaceSort, onSort: setWorkspaceSort }),
      div({ role: 'list', 'aria-label': `workspaces in billing project ${projectName}`, style: { flexGrow: 1, width: '100%' } }, [
        _.flow(
          _.orderBy([workspaceSort.field], [workspaceSort.direction]),
          _.map(workspace => {
            const isExpanded = expandedWorkspaceName === workspace.name
            return h(WorkspaceCard, {
              workspace,
              statusIcon: getBillingAccountStatusIcon(workspace),
              key: workspace.workspaceId,
              isExpanded,
              onExpand: () => setExpandedWorkspaceName(isExpanded ? undefined : workspace.name)
            })
          })
        )(workspacesInProject)
      ])
    ]),
    users: h(Fragment, [
      h(NewUserCard, {
        onClick: () => setAddingUser(true)
      }, [
        icon('plus-circle', { size: 14 }),
        div({ style: { marginLeft: '0.5rem' } }, ['Add User'])
      ]),
      div({ role: 'table', 'aria-label': `users in billing project ${projectName}` }, [
        h(MemberCardHeaders, { sort, onSort: setSort }),
        div(_.map(member => {
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
    Ajax().Metrics.captureEvent(Events.changeBillingAccount, {
      oldName: billingAccountName,
      newName: newAccountName,
      billingProjectName: projectName
    })
    await Ajax(signal).Billing.changeBillingAccount({ billingProjectName: projectName, newBillingAccountName: newAccountName })
    setBillingAccountName(newAccountName)
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

  const updateSpendConfiguration = _.flow(
    withErrorReporting('Error updating workflow spend report configuration'),
    Utils.withBusyState(setUpdating)
  )(async () => {
    await Ajax(signal).Billing.updateSpendConfiguration({ billingProjectName: projectName, datasetGoogleProject: selectedDatasetProjectName, datasetName: selectedDatasetName })
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
          tooltip: 'Change Billing Account',
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
            }),
            div({ style: { marginTop: '1rem' } },
              ['Note: Changing the billing account for this billing project will clear the workflow spend report configuration.'])
          ])])
        ])
      ]),
      div({ style: { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', margin: '0.5rem 0 0 1rem' } }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, marginRight: '0.75rem' } }, 'Workflow Spend Report Configuration:'),
        span({ style: { flexShrink: 0 } }, 'Edit'),
        h(Link, {
          tooltip: 'Configure Workflow Spend Reporting',
          style: { marginLeft: '0.5rem' },
          onClick: async () => {
            if (Auth.hasBillingScope()) {
              setShowSpendReportConfigurationModal(true)
            } else {
              await authorizeAndLoadAccounts()
              setShowSpendReportConfigurationModal(Auth.hasBillingScope())
            }
          }
        }, [icon('edit', { size: 12 })]),
        showSpendReportConfigurationModal && h(Modal, {
          title: 'Configure Workflow Spend Reporting',
          onDismiss: () => setShowSpendReportConfigurationModal(false),
          okButton: h(ButtonPrimary, {
            disabled: !selectedDatasetProjectName || !selectedDatasetName,
            onClick: async () => {
              setShowSpendReportConfigurationModal(false)
              await updateSpendConfiguration(projectName, selectedDatasetProjectName, selectedDatasetName)
            }
          }, ['Ok'])
        }, [
          h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['Dataset Project Name']),
            h(TextInput, {
              id,
              onChange: setSelectedDatasetProjectName
            })
          ])]),
          h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['Dataset Name']),
            h(TextInput, {
              id,
              onChange: setSelectedDatasetName
            }),
            div({ style: { marginTop: '1rem' } }, [
              ['See '],
              h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360037862771', ...Utils.newTabLinkProps }, ['our documentation']),
              [' for details on configuring workflow spend reporting for billing projects.']
            ])
          ])])
        ])
      ]),
      h(SimpleTabBar, {
        'aria-label': 'project details',
        style: { marginTop: '2rem', textTransform: 'none', padding: '0 1rem', height: '1.5rem' },
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
      }, [
        div({
          style: {
            padding: '1rem 1rem 0',
            backgroundColor: colors.light(),
            flexGrow: 1
          }
        }, [
          tabToTable[tab]
        ])
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
