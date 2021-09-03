import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
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
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'


const workspaceLastModifiedWidth = 150
const workspaceExpandIconSize = 20

const BillingAccountStatusIcon = {
  Updating: 'loadingSpinner',
  Done: 'success-standard',
  Error: 'error-standard'
}

const getBillingAccountStatusIconOrEmpty = (() => {
  const size = 16
  const blank = div({ style: { width: size } },
    [div({ className: 'sr-only' }, ['Status'])])
  return shape => icon(shape, { size }) || blank
})()

const WorkspaceCardHeaders = Utils.memoWithName('WorkspaceCardHeaders', ({ sort, onSort }) => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem', marginBottom: '0.5rem' } }, [
    getBillingAccountStatusIconOrEmpty(null),
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

const WorkspaceCard = Utils.memoWithName('WorkspaceCard', ({ workspace, billingAccountStatusIcon, isExpanded, onExpand }) => {
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
        getBillingAccountStatusIconOrEmpty(billingAccountStatusIcon),
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

const BillingAccountSummaryPanel = (() => {

  const StatusAndCount = ({ icon, status, count }) => h(Fragment, [
    div({ style: { marginLeft: '0.5rem', float: 'left' } }, [getBillingAccountStatusIconOrEmpty(icon)]),
    div({ style: { marginLeft: '1rem', float: 'left' } }, [`${status} (${count})`])
  ])

  const maybeSummarize = (icon, status, count) => count > 0 &&
    div({ style: { float: 'left', marginLeft: '1rem' } },
      [h(StatusAndCount, { icon, status, count })])

  return Utils.memoWithName('BillingAccountSummaryPanel', ({
    billingProject: {
        workspacesWithCorrectBillingAccount,
        workspacesWithIncorrectBillingAccount
      }
    }) => {
      const [done, errors, updating] = _.flow(
        _.partition(_.has('billingAccountErrorMessage')),
        _.concat([workspacesWithCorrectBillingAccount]),
        _.map(_.size)
      )(workspacesWithIncorrectBillingAccount)

      return div({ style: { padding: '1rem' } }, [
        p('Your billing account is updating...'),
        h(Fragment, [
          maybeSummarize(BillingAccountStatusIcon.Error, 'error', errors),
          maybeSummarize(BillingAccountStatusIcon.Updating, 'updating', updating),
          maybeSummarize(BillingAccountStatusIcon.Done, 'done', done)
        ]),
        p('Try again or '),
      ])
    }
  )
})()

const ProjectDetail = ({ project, billingAccounts, authorizeAndLoadAccounts }) => {
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
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [showSpendReportConfigurationModal, setShowSpendReportConfigurationModal] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState()
  const [selectedDatasetProjectName, setSelectedDatasetProjectName] = useState(null)
  const [selectedDatasetName, setSelectedDatasetName] = useState(null)
  const [tab, setTab] = useState(query.tab || 'workspaces')
  const [expandedWorkspaceName, setExpandedWorkspaceName] = useState()
  const [sort, setSort] = useState({ field: 'email', direction: 'asc' })
  const [workspaceSort, setWorkspaceSort] = useState({ field: 'name', direction: 'asc' })
  const [billingProject, setBillingProject] = useState(project)

  const signal = Utils.useCancellation()

  const adminCanEdit = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1

  const getBillingAccountStatusIcon = workspace => Utils.cond(
    [_.isEmpty(billingProject.workspacesWithIncorrectBillingAccount), () => null],
    [billingProject.billingAccount === workspace.billingAccount, () => BillingAccountStatusIcon.Done],
    ['billingAccountErrorMessage' in workspace, () => BillingAccountStatusIcon.Error],
    [Utils.DEFAULT, () => BillingAccountStatusIcon.Updating]
  )

  const tabToTable = {
    workspaces: h(Fragment, [
      h(WorkspaceCardHeaders, { sort: workspaceSort, onSort: setWorkspaceSort }),
      div({ role: 'list', 'aria-label': `workspaces in billing project ${billingProject.projectName}`, style: { flexGrow: 1, width: '100%' } }, [
        _.flow(
          _.map('workspace'),
          _.filter({ namespace: billingProject.projectName }),
          _.orderBy([workspaceSort.field], [workspaceSort.direction]),
          _.map(workspace => {
            const isExpanded = expandedWorkspaceName === workspace.name
            return h(WorkspaceCard, {
              workspace,
              billingAccountStatusIcon: getBillingAccountStatusIcon(workspace),
              key: workspace.workspaceId,
              isExpanded,
              onExpand: () => setExpandedWorkspaceName(isExpanded ? undefined : workspace.name)
            })
          })
        )(workspaces)
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
  const updateBillingProject = withErrorReporting('Error updating billing project')(
    () => Ajax(signal).Billing.billingProject(billingProject.projectName).then(setBillingProject)
  )

  const setBillingAccount = _.flow(
    withErrorReporting('Error updating billing account'),
    Utils.withBusyState(setUpdatingAccount)
  )(async newAccountName => {
    Ajax().Metrics.captureEvent(Events.changeBillingAccount, {
      oldName: billingProject.billingAccount,
      newName: newAccountName,
      billingProjectName: billingProject.projectName
    })
    await Ajax(signal).Billing.changeBillingAccount({
      billingProjectName: billingProject.projectName,
      newBillingAccountName: newAccountName
    })
    await updateBillingProject()
  })

  const updateSpendConfiguration = _.flow(
    withErrorReporting('Error updating workflow spend report configuration'),
    Utils.withBusyState(setUpdating)
  )(() => Ajax(signal).Billing.updateSpendConfiguration({
    billingProjectName: billingProject.projectName,
    datasetGoogleProject: selectedDatasetProjectName,
    datasetName: selectedDatasetName
  }))

  const refresh = _.flow(
    withErrorReporting('Error loading billing project users list'),
    Utils.withBusyState(setRefreshing)
  )(async () => {
    setAddingUser(false)
    setDeletingUser(false)
    setUpdating(false)
    setEditingUser(false)
    const rawProjectUsers = await Ajax(signal).Billing.project(billingProject.projectName).listUsers()
    const projectUsers = _.flow(
      _.groupBy('email'),
      _.map(gs => ({ ..._.omit('role', gs[0]), roles: _.map('role', gs) })),
      _.sortBy('email')
    )(rawProjectUsers)
    setProjectUsers(projectUsers)
  })

  // Lifecycle
  Utils.useOnMount(refresh)

  useEffect(() => StateHistory.update({ projectUsers }), [projectUsers])

  // There's some madness going on when using state variables in polling effects - the reference
  // never updates (i.e. it's bound to the value that the component was first mounted with).
  // `useGetter` works around this and I have no idea why.
  const getShowBillingModal = Utils.useGetter(showBillingModal)
  const getBillingProject = Utils.useGetter(billingProject)
  Utils.usePollingEffect(
    async () => getShowBillingModal() ||
      _.isEmpty(getBillingProject().workspacesWithIncorrectBillingAccount) ||
      await Promise.all([updateBillingProject(), refreshWorkspaces()]),
    { ms: 5000 }
  )

  const { displayName = null } = _.find({ accountName: billingProject.billingAccount }, billingAccounts) || { displayName: 'No Access' }

  return h(Fragment, [
    _.size(billingProject.workspacesWithIncorrectBillingAccount) > 0 &&
    div({}, [h(BillingAccountSummaryPanel, { billingProject })]),
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
            onClick: async () => {
              setShowBillingModal(false)
              await setBillingAccount(selectedBilling)
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
      addFunction: Ajax().Billing.project(billingProject.projectName).addUser,
      onDismiss: () => setAddingUser(false),
      onSuccess: refresh
    }),
    editingUser && h(EditUserModal, {
      adminLabel: billingRoles.owner,
      userLabel: billingRoles.user,
      user: editingUser,
      saveFunction: Ajax().Billing.project(billingProject.projectName).changeUserRoles,
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
        await Ajax().Billing.project(billingProject.projectName).removeUser(deletingUser.roles, deletingUser.email)
        refresh()
      })
    }),
    (refreshing || updatingAccount || updating) && spinnerOverlay
  ])
}

export default ProjectDetail
