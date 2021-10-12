import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, HeaderRenderer, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, MemberCardHeaders, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { SimpleTabBar } from 'src/components/tabBars'
import { ariaSort } from 'src/components/table'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { contactUsActive } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import { topBarHeight } from 'src/libs/style'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'


const workspaceLastModifiedWidth = 150
const workspaceExpandIconSize = 20
const billingAccountIconSize = 16

const BillingAccountIcon = {
  updating: { shape: 'sync', color: colors.warning() },
  done: { shape: 'check', color: colors.accent() },
  error: { shape: 'warning-standard', color: colors.danger() }
}

const getBillingAccountIcon = status => {
  const { shape, color } = BillingAccountIcon[status]
  return icon(shape, { size: billingAccountIconSize, color })
}

const WorkspaceCardHeaders = Utils.memoWithName('WorkspaceCardHeaders', ({ needsStatusColumn, sort, onSort }) => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem', marginBottom: '0.5rem' } }, [
    needsStatusColumn && div({ style: { width: billingAccountIconSize } }, [
      div({ className: 'sr-only' }, ['Status'])
    ]),
    div({ 'aria-sort': ariaSort(sort, 'name'), style: { flex: 1, paddingLeft: needsStatusColumn ? '1rem' : '2rem' } }, [
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

const ExpandedInfoRow = Utils.memoWithName('ExpandedInfoRow', ({ title, details, errorMessage }) => {
  const expandedInfoStyles = {
    row: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' },
    title: { fontWeight: 600, width: '20%', padding: '0.5rem 1rem 0 2rem', height: '1rem' },
    details: { width: '20%', marginTop: '0.5rem', height: '1rem', ...Style.noWrapEllipsis },
    errorMessage: {
      padding: '0.5rem', width: '55%', backgroundColor: colors.light(0.3),
      border: `solid 2px ${colors.danger(0.3)}`, borderRadius: 5
    }
  }

  return div({ style: expandedInfoStyles.row }, [
    div({ style: expandedInfoStyles.title }, [title]),
    div({ style: expandedInfoStyles.details }, [details]),
    errorMessage && div({ style: expandedInfoStyles.errorMessage }, [errorMessage])
  ])
})

const WorkspaceCard = Utils.memoWithName('WorkspaceCard', ({ workspace, billingAccountStatus, isExpanded, onExpand }) => {
  const { namespace, name, createdBy, lastModified, googleProject, billingAccountDisplayName, billingAccountErrorMessage } = workspace
  const workspaceCardStyles = {
    field: {
      ...Style.noWrapEllipsis, flex: 1, height: '1rem', width: `calc(50% - ${(workspaceLastModifiedWidth + workspaceExpandIconSize) / 2}px)`, paddingRight: '1rem'
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
    expandedInfoContainer: { display: 'flex', flexDirection: 'column', width: '100%' }
  }

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    h(IdContainer, [id => h(Fragment, [
      div({ style: workspaceCardStyles.row }, [
        billingAccountStatus && getBillingAccountIcon(billingAccountStatus),
        div({ style: { ...workspaceCardStyles.field, display: 'flex', alignItems: 'center', paddingLeft: billingAccountStatus ? '1rem' : '2rem' } }, [
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
        div({ style: { height: '1rem', flex: `0 0 ${workspaceLastModifiedWidth}px` } }, [
          Utils.makeStandardDate(lastModified)
        ]),
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
      isExpanded && div({ id, style: { ...workspaceCardStyles.row, padding: '0.5rem', border: `1px solid ${colors.light()}` } }, [
        div({ style: workspaceCardStyles.expandedInfoContainer }, [
          h(ExpandedInfoRow, { title: 'Google Project', details: googleProject }),
          h(ExpandedInfoRow, { title: 'Billing Account', details: billingAccountDisplayName, errorMessage: billingAccountErrorMessage })
        ])
      ])
    ])])
  ])
})

const BillingAccountSummaryPanel = (() => {
  const StatusAndCount = ({ status, count }) => div({ style: { display: 'float' } }, [
    div({ style: { float: 'left' } }, [getBillingAccountIcon(status)]),
    div({ style: { float: 'left', marginLeft: '0.5rem' } }, [`${status} (${count})`])
  ])

  const maybeAddStatus = (status, count) => count > 0 && div({ style: { marginRight: '2rem' } }, [
    h(StatusAndCount, { status, count })
  ])

  return Utils.memoWithName(
    'BillingAccountSummaryPanel',
    ({ counts: { done, error, updating } }) => div({
      style: {
        padding: '0.5rem 2rem 1rem',
        position: 'absolute',
        top: topBarHeight,
        right: '3rem',
        width: '30rem',
        backgroundColor: colors.light(0.5),
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)'
      }
    }, [
      div({ style: { padding: '1rem 0' } }, 'Your billing account is updating...'),
      div({ style: { display: 'flex', justifyContent: 'flex-start' } }, [
        maybeAddStatus('updating', updating),
        maybeAddStatus('done', done),
        maybeAddStatus('error', error)
      ]),
      error > 0 && div({ style: { padding: '1rem 0 0' } }, [
        'Try again or ',
        h(Link, { onClick: () => contactUsActive.set(true) }, [
          'contact us regarding unresolved errors'
        ]), '.'
      ])
    ]))
})()

const groupByBillingAccountStatus = (billingProject, workspaces) => {
  const group = workspace => Utils.cond(
    [billingProject.billingAccount === workspace.billingAccount, () => 'done'],
    ['billingAccountErrorMessage' in workspace, () => 'error'],
    [Utils.DEFAULT, () => 'updating']
  )

  return _.mapValues(ws => new Set(ws), _.groupBy(group, workspaces))
}

const ProjectDetail = ({ billingProject, reloadBillingProject, billingAccounts, authorizeAndLoadAccounts }) => {
  // State
  const { query } = Nav.useRoute()
  // Rather than using a localized StateHistory store here, we use the existing `workspaceStore` value (via the `useWorkspaces` hook)
  const { workspaces, refresh: refreshWorkspaces } = useWorkspaces()

  const [projectUsers, setProjectUsers] = useState(() => StateHistory.get().projectUsers || [])
  const [addingUser, setAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [updating, setUpdating] = useState(false)
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
    _.map('workspace'),
    _.filter({ namespace: billingProject.projectName })
  )(workspaces), [billingProject, workspaces])

  const groups = groupByBillingAccountStatus(billingProject, workspacesInProject)
  const billingAccountsOutOfDate = !(_.isEmpty(groups.error) && _.isEmpty(groups.updating))
  const getBillingAccountStatus = workspace => _.findKey(g => g.has(workspace), groups)

  const tabToTable = {
    workspaces: h(Fragment, [
      h(WorkspaceCardHeaders, {
        needsStatusColumn: billingAccountsOutOfDate,
        sort: workspaceSort,
        onSort: setWorkspaceSort
      }),
      div({ role: 'list', 'aria-label': `workspaces in billing project ${billingProject.projectName}`, style: { flexGrow: 1, width: '100%' } }, [
        _.flow(
          _.orderBy([workspaceSort.field], [workspaceSort.direction]),
          _.map(workspace => {
            const isExpanded = expandedWorkspaceName === workspace.name
            return h(WorkspaceCard, {
              workspace: { ...workspace, billingAccountDisplayName: billingAccounts[workspace.billingAccount]?.displayName },
              billingAccountStatus: billingAccountsOutOfDate && getBillingAccountStatus(workspace),
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
      div({ role: 'table', 'aria-label': `users in billing project ${billingProject.projectName}` }, [
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
  const setBillingAccount = _.flow(
    reportErrorAndRethrow('Error updating billing account'),
    Utils.withBusyState(setUpdating)
  )(newAccountName => {
    Ajax().Metrics.captureEvent(Events.changeBillingAccount, {
      oldName: billingProject.billingAccount,
      newName: newAccountName,
      billingProjectName: billingProject.projectName
    })
    return Ajax(signal).Billing.changeBillingAccount({
      billingProjectName: billingProject.projectName,
      newBillingAccountName: newAccountName
    })
  })

  const updateSpendConfiguration = _.flow(
    reportErrorAndRethrow('Error updating workflow spend report configuration'),
    Utils.withBusyState(setUpdating)
  )(() => Ajax(signal).Billing.updateSpendConfiguration({
    billingProjectName: billingProject.projectName,
    datasetGoogleProject: selectedDatasetProjectName,
    datasetName: selectedDatasetName
  }))

  const collectUserRoles = _.flow(
    _.groupBy('email'),
    _.entries,
    _.map(([email, members]) => ({ email, roles: _.map('role', members) })),
    _.sortBy('email')
  )

  const reloadBillingProjectUsers = _.flow(
    reportErrorAndRethrow('Error loading billing project users list'),
    Utils.withBusyState(setUpdating)
  )(() => Ajax(signal).Billing.listProjectUsers(billingProject.projectName)
    .then(collectUserRoles)
    .then(setProjectUsers)
  )

  const removeUserFromBillingProject = _.flow(
    reportErrorAndRethrow('Error removing member from billing project'),
    Utils.withBusyState(setUpdating)
  )(_.partial(Ajax().Billing.removeProjectUser, [billingProject.projectName]))

  // Lifecycle
  Utils.useOnMount(() => { reloadBillingProjectUsers() })

  useEffect(() => { StateHistory.update({ projectUsers }) }, [projectUsers])

  // usePollingEffect calls the "effect" in a while-loop and binds references once on mount.
  // As such, we need a layer of indirection to get current values.
  const getShowBillingModal = Utils.useGetter(showBillingModal)
  const getBillingAccountsOutOfDate = Utils.useGetter(billingAccountsOutOfDate)
  Utils.usePollingEffect(
    () => !getShowBillingModal() && getBillingAccountsOutOfDate() && refreshWorkspaces(),
    { ms: 5000 }
  )

  const { displayName = null } = _.find({ accountName: billingProject.billingAccount }, billingAccounts) || { displayName: 'No Access' }

  return h(Fragment, [
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [billingProject.projectName]),
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
              setShowBillingModal(Auth.hasBillingScope())
            }
          }
        }, [icon('edit', { size: 12 })]),
        showBillingModal && h(Modal, {
          title: 'Change Billing Account',
          onDismiss: () => setShowBillingModal(false),
          okButton: h(ButtonPrimary, {
            disabled: !selectedBilling || billingProject.billingAccount === selectedBilling,
            onClick: () => {
              setShowBillingModal(false)
              setBillingAccount(selectedBilling).then(reloadBillingProject)
            }
          }, ['Ok'])
        }, [
          h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
            h(Select, {
              id,
              value: selectedBilling || billingProject.billingAccount,
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
              await updateSpendConfiguration(billingProject.projectName, selectedDatasetProjectName, selectedDatasetName)
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
            reloadBillingProjectUsers()
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
      addFunction: _.partial(Ajax().Billing.addProjectUser, [billingProject.projectName]),
      onDismiss: () => setAddingUser(false),
      onSuccess: () => {
        setAddingUser(false)
        reloadBillingProjectUsers()
      }
    }),
    editingUser && h(EditUserModal, {
      adminLabel: billingRoles.owner,
      userLabel: billingRoles.user,
      user: editingUser,
      saveFunction: _.partial(Ajax().Billing.changeUserRoles, [billingProject.projectName]),
      onDismiss: () => setEditingUser(false),
      onSuccess: () => {
        setEditingUser(false)
        reloadBillingProject().then(reloadBillingProjectUsers)
      }
    }),
    !!deletingUser && h(DeleteUserModal, {
      userEmail: deletingUser.email,
      onDismiss: () => setDeletingUser(false),
      onSubmit: () => {
        setDeletingUser(false)
        removeUserFromBillingProject(deletingUser.roles, deletingUser.email)
          .then(reloadBillingProject)
          .then(reloadBillingProjectUsers)
      }
    }),
    billingAccountsOutOfDate && h(BillingAccountSummaryPanel, { counts: _.mapValues(_.size, groups) }),
    updating && spinnerOverlay
  ])
}

export default ProjectDetail
