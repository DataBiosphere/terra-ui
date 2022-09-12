import { subDays } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { ComponentProps, Fragment, lazy, Suspense, useEffect, useMemo, useState } from 'react'

import { absoluteSpinnerOverlay, ButtonPrimary, HeaderRenderer, IdContainer, Link, Select } from 'src/components/common'
import { DeleteUserModal, EditUserModal, MemberCard, MemberCardHeaders, NewUserCard, NewUserModal } from 'src/components/group-common'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { SimpleTabBar } from 'src/components/tabBars'
import { ariaSort } from 'src/components/table'
import { useWorkspaces } from 'src/components/workspace-utils'
import {
  Ajax, BillingAccount, BillingProject, BillingProjectUser,
  RemoveBillingAcctArgs,
  UpdateSpendConfigurationArgs
} from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import {
  memoWithName,
  useCancellation,
  useGetter,
  useOnMount,
  usePollingEffect
} from 'src/libs/react-utils'
import { contactUsActive } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { topBarHeight } from 'src/libs/style'
import { div, h, h3, span } from 'src/libs/ts-hyperscript'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'
import Highcharts from 'highcharts'
import { UserRolesEntry } from 'src/libs/state-history'


const workspaceLastModifiedWidth = 150
const workspaceExpandIconSize = 20
const billingAccountIconSize = 16

const billingAccountIcons = {
  updating: { shape: 'sync', color: colors.warning() },
  done: { shape: 'check', color: colors.accent() },
  error: { shape: 'warning-standard', color: colors.danger() }
}

const getBillingAccountIcon = status => {
  const { shape, color } = billingAccountIcons[status]
  return icon(shape, ({ size: billingAccountIconSize, color } as any))
}

const WorkspaceCardHeaders = memoWithName('WorkspaceCardHeaders', ({ needsStatusColumn, sort, onSort }) => {
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

interface ExpandedInfoRowProps {
  title: string;
  details: string;
  errorMessage?: string;
}
const ExpandedInfoRow = ({ title, details, errorMessage }: ExpandedInfoRowProps) => {
  const expandedInfoStyles = {
    row: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' },
    title: { fontWeight: 600, width: '20%', padding: '0.5rem 1rem 0 2rem', height: '1rem' },
    details: { width: '20%', marginTop: '0.5rem', height: '1rem', ...Style.noWrapEllipsis } as React.CSSProperties,
    errorMessage: {
      padding: '0.5rem', width: '55%', backgroundColor: colors.light(0.3),
      border: `solid 2px ${colors.danger(0.3)}`, borderRadius: 5
    }
  }

  return div({ style: expandedInfoStyles.row }, [
    div({ style: expandedInfoStyles.title, 'data-xyz': '7' }, [title]),
    div({ style: expandedInfoStyles.details }, [details]),
    errorMessage && div({ style: expandedInfoStyles.errorMessage }, [errorMessage])
  ])
}

const WorkspaceCard = memoWithName('WorkspaceCard', ({ workspace, billingAccountStatus, isExpanded, onExpand }) => {
  const { namespace, name, createdBy, lastModified, googleProject, billingAccountDisplayName, billingAccountErrorMessage } = workspace
  const workspaceCardStyles: Record<string, React.CSSProperties> = {
    field: {
      ...Style.noWrapEllipsis, flex: 1, height: '1rem', width: `calc(50% - ${(workspaceLastModifiedWidth + workspaceExpandIconSize) / 2}px)`, paddingRight: '1rem'
    } as React.CSSProperties,
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
    expandedInfoContainer: { display: 'flex', flexDirection: 'column', width: '100%' }
  }

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless as React.CSSProperties, padding: 0, flexDirection: 'column' } }, [
    h(IdContainer, [id => h(Fragment, [
      div({ style: workspaceCardStyles.row }, [
        billingAccountStatus && getBillingAccountIcon(billingAccountStatus),
        div({ style: { ...workspaceCardStyles.field, display: 'flex', alignItems: 'center', paddingLeft: billingAccountStatus ? '1rem' : '2rem' } }, [
          h(Link, {
            style: Style.noWrapEllipsis as React.CSSProperties,
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

const BillingAccountSummaryPanel = ({ counts: { done, error, updating } }) => {
  const StatusAndCount = ({ status, count }) => div({ style: { display: 'float' } }, [
    div({ style: { float: 'left' } }, [getBillingAccountIcon(status)]),
    div({ style: { float: 'left', marginLeft: '0.5rem' } }, [`${status} (${count})`])
  ])

  const maybeAddStatus = (status, count) => count > 0 && div({ style: { marginRight: '2rem' } }, [
    h(StatusAndCount, { status, count })
  ])

  return div({
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
    div({ style: { padding: '1rem 0' } }, ['Your billing account is updating...']),
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
  ])
}

const groupByBillingAccountStatus = (billingProject, workspaces) => {
  const group = workspace => Utils.cond(
    [billingProject.billingAccount === workspace.billingAccount, () => 'done'],
    [!!workspace.billingAccountErrorMessage, () => 'error'],
    [Utils.DEFAULT, () => 'updating']
  )

  // Return Sets to reduce the time complexity of searching for the status of any workspace from
  // O(N * W) to O(N * 1), where
  //   N is the number of statuses a billing account change could have,
  //   W is the number of workspaces in a billing project (can be very large for GP).
  // Note we need to perform this search W times for each billing project; using a set reduces time
  // complexity by an order of magnitude.
  return _.mapValues((ws: unknown[]) => new Set(ws), _.groupBy(group, workspaces))
}

const LazyChart = lazy(() => import('src/components/Chart'))
const maxWorkspacesInChart = 10
const spendReportKey = 'spend report'

export interface ProjectDetailProps {
  authorizeAndLoadAccounts: () => Promise<void>;
  billingAccounts: Record<string, BillingAccount>;
  billingProject: BillingProject;
  isAlphaSpendReportUser: boolean;
  isOwner: boolean;
  reloadBillingProject: () => Promise<void>;
}

const ProjectDetail: React.FC<ProjectDetailProps> = (
  { authorizeAndLoadAccounts, billingAccounts, billingProject, isAlphaSpendReportUser, isOwner, reloadBillingProject }: ProjectDetailProps
) => {
  // State
  const { query } = Nav.useRoute()
  // Rather than using a localized StateHistory store here, we use the existing `workspaceStore` value (via the `useWorkspaces` hook)
  const { workspaces, refresh: refreshWorkspaces } = useWorkspaces()

  const [projectUsers, setProjectUsers] = useState(() => StateHistory.get().projectUsers || [])
  const projectOwners = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers)
  const [addingUser, setAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<any>(false)
  const [updating, setUpdating] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [showBillingRemovalModal, setShowBillingRemovalModal] = useState(false)
  const [showSpendReportConfigurationModal, setShowSpendReportConfigurationModal] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState<any>()
  const [selectedDatasetProjectName, setSelectedDatasetProjectName] = useState(null)
  const [selectedDatasetName, setSelectedDatasetName] = useState<string | null>(null)
  const [tab, setTab] = useState(query.tab || 'workspaces')
  const [expandedWorkspaceName, setExpandedWorkspaceName] = useState()
  const [sort, setSort] = useState({ field: 'email', direction: 'asc' })
  const [workspaceSort, setWorkspaceSort] = useState({ field: 'name', direction: 'asc' })
  const [projectCost, setProjectCost] = useState<any>(null)
  const [costPerWorkspace, setCostPerWorkspace] = useState(
    { workspaceNames: [], computeCosts: [], otherCosts: [], storageCosts: [], numWorkspaces: 0, costFormatter: x => x }
  )
  const [updatingProjectCost, setUpdatingProjectCost] = useState(false)
  const [spendReportLengthInDays, setSpendReportLengthInDays] = useState(30)

  const signal = useCancellation()

  const projectHasMultipleOwners = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1

  const workspacesInProject = useMemo(() => _.filter(
    { namespace: billingProject.projectName },
    _.map('workspace', workspaces)
  ), [billingProject, workspaces])

  const spendChartOptions = {
    chart: { marginTop: 50, spacingLeft: 20, style: { fontFamily: 'inherit' }, type: 'bar' },
    credits: { enabled: false },
    legend: { reversed: true },
    plotOptions: { series: { stacking: 'normal' } },
    series: [
      { name: 'Compute', data: costPerWorkspace.computeCosts },
      { name: 'Storage', data: costPerWorkspace.storageCosts },
      { name: 'Other', data: costPerWorkspace.otherCosts }
    ],
    title: {
      align: 'left', style: { fontSize: '16px' }, y: 25,
      text: costPerWorkspace.numWorkspaces > maxWorkspacesInChart ? `Top ${maxWorkspacesInChart} Spending Workspaces` : 'Spend By Workspace'
    },
    tooltip: {
      followPointer: true,
      shared: true,
      headerFormat: '{point.key}',
      pointFormatter: function() { // eslint-disable-line object-shorthand
        // Highcharts callbacks do funny business with this context
        const point = this as unknown as Highcharts.Point
        return `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: ${costPerWorkspace.costFormatter(point.y)}`
      }
    },
    xAxis: {
      categories: costPerWorkspace.workspaceNames, crosshair: true,
      labels: { style: { fontSize: '12px' } }
    },
    yAxis: {
      crosshair: true, min: 0,
      labels: {
        formatter: function() {
          // Highcharts callbacks do funny business with this context
          const label = this as unknown as Highcharts.AxisLabelsFormatterContextObject
          return costPerWorkspace.costFormatter(label.value)
        },
        style: { fontSize: '12px' }
      },
      title: { enabled: false },
      width: '96%'
    },
    accessibility: {
      point: {
        descriptionFormatter: point => {
          return `${point.index + 1}. Workspace ${point.category}, ${point.series.name}: ${costPerWorkspace.costFormatter(point.y)}.`
        }
      }
    },
    exporting: { buttons: { contextButton: { x: -15 } } }
  }

  type CostCardProps = ComponentProps<'div'> & {
    title: string;
    amount: string;
  }
  const CostCard = ({ title, amount, ...props }: CostCardProps) => {
    return div({
      ...props,
      style: {
        ...Style.elements.card.container as React.CSSProperties,
        backgroundColor: 'white',
        padding: undefined,
        boxShadow: undefined,
        gridRowStart: 2
      }
    }, [
      div({ style: { flex: 'none', padding: '0.625rem 1.25rem' }, 'aria-live': projectCost !== null ? 'polite' : 'off', 'aria-atomic': true }, [
        h3({ style: { fontSize: 16, color: colors.accent(), margin: '0.25rem 0.0rem', fontWeight: 'normal' } }, [title]),
        div({ style: { fontSize: 32, height: 40, fontWeight: 'bold', gridRowStart: '2' } }, [amount])
      ])
    ])
  }

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
      div({ role: 'list', 'aria-label': `workspaces in billing project ${billingProject.projectName}`, style: { flexGrow: 1, width: '100%' } },
        _.flow(
          _.orderBy([workspaceSort.field as any], [workspaceSort.direction as any]),
          _.map((workspace: any) => {
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
      )
    ]),
    members: h(Fragment, [
      isOwner && h(NewUserCard, {
        onClick: () => setAddingUser(true)
      }, [
        icon('plus-circle', { size: 14 }),
        div({ style: { marginLeft: '0.5rem' } }, ['Add User'])
      ]),
      div({ role: 'table', 'aria-label': `users in billing project ${billingProject.projectName}` }, [
        h(MemberCardHeaders, { sort, onSort: setSort }),
        div(_.map((member: any) => {
          return h(MemberCard, {
            key: member.email,
            adminLabel: billingRoles.owner,
            userLabel: billingRoles.user,
            member,
            adminCanEdit: (projectHasMultipleOwners && isOwner),
            onEdit: () => setEditingUser(member),
            onDelete: () => setDeletingUser(member),
            isOwner
          })
        }, _.orderBy([sort.field], [sort.direction as any], projectUsers))
        )
      ])
    ]),
    [spendReportKey]: div({ style: { display: 'grid', rowGap: '1.25rem' } }, [
      div({ style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(max-content, 1fr))', rowGap: '1.25rem', columnGap: '1.25rem' } },
        _.concat(
          div({ style: { gridRowStart: 1, gridColumnStart: 1 } }, [
            h(IdContainer, [id => h(Fragment as any, [
              h(FormLabel, { htmlFor: id }, ['Date range']),
              h(Select, {
                id,
                value: spendReportLengthInDays,
                options: _.map(days => ({
                  label: `Last ${days} days`,
                  value: days
                }), [7, 30, 90]),
                onChange: ({ value: selectedDays }) => {
                  setSpendReportLengthInDays(selectedDays)
                  setProjectCost(null)
                }
              } as any)
            ])])
          ])
        )(_.map(name => CostCard({ title: `Total ${name}`, amount: (projectCost === null ? '...' : projectCost[name]) }),
          ['spend', 'compute', 'storage', 'other'])
        )
      ),
      costPerWorkspace.numWorkspaces > 0 && div({ style: { gridRowStart: 2, minWidth: 500 } }, [ // Set minWidth so chart will shrink on resize
        h(Suspense, { fallback: '' }, [h(LazyChart, { options: spendChartOptions })])
      ])
    ])
  }

  const tabs: any[] = _.map((key: string) => ({
    key,
    title: span({ style: { padding: '0 0.5rem' } }, [
      _.capitalize(key === 'members' && !isOwner ? 'owners' : key) // Rewrite the 'Members' tab to say 'Owners' if the user has the User role
    ]),
    tableName: _.lowerCase(key)
  }), _.filter(key => (key !== spendReportKey || (isAlphaSpendReportUser && isOwner)), _.keys(tabToTable)))
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
  )((newAccountName: string): Promise<any> => {
    Ajax().Metrics.captureEvent(Events.changeBillingAccount, {
      oldName: billingProject.billingAccount,
      newName: newAccountName,
      billingProjectName: billingProject.projectName
    })
    return Ajax(signal).Billing.changeBillingAccount({
      billingProjectName: billingProject.projectName,
      newBillingAccountName: newAccountName
    })
  }) as (args: string) => Promise<any>

  const removeBillingAccount = _.flow(
    reportErrorAndRethrow('Error removing billing account'),
    Utils.withBusyState(setUpdating)
  )(() => {
    Ajax().Metrics.captureEvent(Events.removeBillingAccount, {
      billingProject: billingProject.projectName
    })
    return Ajax(signal).Billing.removeBillingAccount({
      billingProjectName: billingProject.projectName
    })
  }) as (args: RemoveBillingAcctArgs) => Promise<any>

  const updateSpendConfiguration = _.flow(
    reportErrorAndRethrow('Error updating workflow spend report configuration'),
    Utils.withBusyState(setUpdating)
  )(
    (args: UpdateSpendConfigurationArgs) => Ajax(signal).Billing.updateSpendConfiguration(args)
  ) as (args: UpdateSpendConfigurationArgs) => Promise<any>

  const collectUserRoles: (rawInfo: BillingProjectUser[]) => UserRolesEntry[] = _.flow(
    _.groupBy('email'),
    _.entries as (grouped: Record<string, BillingProjectUser>) => [[string, BillingProjectUser[]]],
    _.map(([email, members]) => ({ email, roles: _.map('role', members) })),
    _.sortBy('email')
  ) as (rawInfo: BillingProjectUser[]) => UserRolesEntry[]

  const reloadBillingProjectUsers = _.flow(
    reportErrorAndRethrow('Error loading billing project users list'),
    Utils.withBusyState(setUpdating)
  )(() => Ajax(signal).Billing.listProjectUsers(billingProject.projectName)
    .then(collectUserRoles)
    .then(setProjectUsers)
  ) as () => Promise<any>

  const removeUserFromBillingProject = _.flow(
    reportErrorAndRethrow('Error removing member from billing project'),
    Utils.withBusyState(setUpdating)
  )(
    _.partial(Ajax().Billing.removeProjectUser, [billingProject.projectName])
  ) as (roles: any, email: any) => Promise<any>

  // Lifecycle
  useOnMount(() => { void reloadBillingProjectUsers() })

  useEffect(() => { StateHistory.update({ projectUsers }) }, [projectUsers])
  // Update cost data only if report date range changes, or if spend report tab was selected.
  useEffect(() => {
    const maybeLoadProjectCost = _.flow(
      reportErrorAndRethrow('Unable to retrieve spend report data'),
      Utils.withBusyState(setUpdating)
    )(async () => {
      if (!updatingProjectCost && projectCost === null && tab === spendReportKey) {
        setUpdatingProjectCost(true)
        const endDate = new Date().toISOString().slice(0, 10)
        const startDate = subDays(spendReportLengthInDays, new Date()).toISOString().slice(0, 10)
        const spend = await Ajax(signal).Billing.getSpendReport({ billingProjectName: billingProject.projectName, startDate, endDate })
        const costFormatter = new Intl.NumberFormat(navigator.language, { style: 'currency', currency: spend.spendSummary.currency }).format
        const categoryDetails = _.find((details: any) => details.aggregationKey === 'Category')(spend.spendDetails)
        console.assert(categoryDetails !== undefined, 'Spend report details do not include aggregation by Category')
        const getCategoryCosts = (categorySpendData, asFloat) => {
          const costDict = {}
          _.forEach(type => {
            const costAsString = (_.find(['category', type])(categorySpendData) as any)?.cost ?? 0
            costDict[type] = asFloat ? parseFloat(costAsString) : costFormatter(costAsString)
          }, ['Compute', 'Storage', 'Other'])
          return costDict
        }
        const costDict: any = getCategoryCosts(categoryDetails.spendData, false)
        const totalCosts = {
          spend: costFormatter(spend.spendSummary.cost),
          compute: costDict.Compute,
          storage: costDict.Storage,
          other: costDict.Other
        }

        setProjectCost(totalCosts)

        const workspaceDetails = _.find((details: any) => details.aggregationKey === 'Workspace')(spend.spendDetails)
        console.assert(workspaceDetails !== undefined, 'Spend report details do not include aggregation by Workspace')
        // Get the most expensive workspaces, sorted from most to least expensive.
        const mostExpensiveWorkspaces = _.flow(
          _.sortBy(({ cost }) => { return parseFloat(cost) }),
          _.reverse,
          _.slice(0, maxWorkspacesInChart)
        )(workspaceDetails?.spendData)
        // Pull out names and costs.
        const costPerWorkspace: any = {
          workspaceNames: [], computeCosts: [], storageCosts: [], otherCosts: [], costFormatter, numWorkspaces: workspaceDetails?.spendData.length
        }
        _.forEach((workspaceCostData: any) => {
          costPerWorkspace.workspaceNames.push(workspaceCostData.workspace.name)
          const categoryDetails = workspaceCostData.subAggregation
          console.assert(categoryDetails.key !== 'Category', 'Workspace spend report details do not include sub-aggregation by Category')
          const costDict: any = getCategoryCosts(categoryDetails.spendData, true)
          costPerWorkspace.computeCosts.push(costDict.Compute)
          costPerWorkspace.storageCosts.push(costDict.Storage)
          costPerWorkspace.otherCosts.push(costDict.Other)
        })(mostExpensiveWorkspaces)
        setCostPerWorkspace(costPerWorkspace)
        setUpdatingProjectCost(false)
      }
    }) as any as () => Promise<any>
    void maybeLoadProjectCost()
  }, [spendReportLengthInDays, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // usePollingEffect calls the "effect" in a while-loop and binds references once on mount.
  // As such, we need a layer of indirection to get current values.
  const getShowBillingModal = useGetter(showBillingModal)
  const getBillingAccountsOutOfDate = useGetter(billingAccountsOutOfDate)
  usePollingEffect(
    () => !getShowBillingModal() && getBillingAccountsOutOfDate() && void (refreshWorkspaces as any as () => Promise<any>)(),
    { ms: 5000 }
  )

  // (CA-1586) For some reason the api sometimes returns string null, and sometimes returns no field, and sometimes returns null. This is just to be complete.
  const billingProjectHasBillingAccount = !(billingProject.billingAccount === 'null' || _.isNil(billingProject.billingAccount))
  const billingAccount = billingProjectHasBillingAccount ? _.find({ accountName: billingProject.billingAccount }, billingAccounts) : undefined

  const billingAccountDisplayText: () => string =
    (!billingProjectHasBillingAccount) ? () => 'No linked billing account' :
      (!billingAccount) ? () => 'No access to linked billing account' :
        () => billingAccount.displayName || billingAccount.accountName

  return h(Fragment, [
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [billingProject.projectName]),
      Auth.hasBillingScope() && div({ style: { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', marginTop: '0.5rem', marginLeft: '1rem' } }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, margin: '0 0.75rem 0 0' } }, ['Billing Account:']),
        span({ style: { flexShrink: 0, marginRight: '0.5rem' } }, [billingAccountDisplayText()]),
        isOwner && h(MenuTrigger, {
          closeOnClick: true,
          side: 'bottom',
          style: { marginLeft: '0.5rem' },
          content: h(Fragment, [
            h(MenuButton, {
              onClick: async () => {
                if (Auth.hasBillingScope()) {
                  setShowBillingModal(true)
                } else {
                  await authorizeAndLoadAccounts()
                  setShowBillingModal(Auth.hasBillingScope())
                }
              }
            }, ['Change Billing Account']),
            h(MenuButton, {
              onClick: async () => {
                if (Auth.hasBillingScope()) {
                  setShowBillingRemovalModal(true)
                } else {
                  await authorizeAndLoadAccounts()
                  setShowBillingRemovalModal(Auth.hasBillingScope())
                }
              },
              disabled: !billingProjectHasBillingAccount
            }, ['Remove Billing Account'])
          ])
        }, [
          h(Link, { 'aria-label': 'Billing account menu', style: { display: 'flex', alignItems: 'center' } }, [
            icon('cardMenuIcon', { size: 16, 'aria-haspopup': 'menu' } as any)
          ])
        ]),
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
            } as any),
            div({ style: { marginTop: '1rem' } },
              ['Note: Changing the billing account for this billing project will clear the workflow spend report configuration.'])
          ])])
        ]),
        showBillingRemovalModal && h(Modal, {
          title: 'Remove Billing Account',
          onDismiss: () => setShowBillingRemovalModal(false),
          okButton: h(ButtonPrimary, {
            onClick: () => {
              setShowBillingRemovalModal(false)
              removeBillingAccount(selectedBilling).then(reloadBillingProject)
            }
          }, ['Ok'])
        }, [
          div({ style: { marginTop: '1rem' } },
            ['Are you sure you want to remove this billing project\'s billing account?'])
        ])
      ]),
      Auth.hasBillingScope() && isOwner && div({ style: { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', margin: '0.5rem 0 0 1rem' } }, [
        span({ style: { flexShrink: 0, fontWeight: 600, fontSize: 14, marginRight: '0.75rem' } }, ['Workflow Spend Report Configuration:']),
        span({ style: { flexShrink: 0 } }, ['Edit']),
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
              if (!!selectedDatasetProjectName && !!selectedDatasetName) {
                setShowSpendReportConfigurationModal(false)
                await updateSpendConfiguration({
                  billingProjectName: billingProject.projectName,
                  datasetGoogleProject: selectedDatasetProjectName,
                  datasetName: selectedDatasetName
                })
              }
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
              'See ',
              h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360037862771', ...Utils.newTabLinkProps }, ['our documentation']),
              ' for details on configuring workflow spend reporting for billing projects.'
            ])
          ])])
        ])
      ]),
      !Auth.hasBillingScope() && div({ style: { color: colors.dark(), fontSize: 14, display: 'flex', alignItems: 'center', marginTop: '0.5rem', marginLeft: '1rem' } }, [
        h(Link, {
          onClick: authorizeAndLoadAccounts
        }, ['View billing account'])
      ]),
      _.size(projectUsers) > 1 && _.size(projectOwners) === 1 && div({
        style: {
          display: 'flex',
          alignItems: 'center',
          margin: '1rem 1rem 0',
          padding: '1rem',
          border: `1px solid ${colors.warning()}`,
          backgroundColor: colors.warning(0.15)
        }
      }, [
        icon('warning-standard', { style: { color: colors.warning(), marginRight: '1ch' } } as any),
        span(isOwner ? [
          'You are the only owner of this shared billing project. Consider adding another owner to ensure someone is able to manage the billing project in case you lose access to your account. ',
          h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360047235151-Best-practices-for-managing-shared-funding#h_01EFCZSY6K1CEEBJDH7BCG8RBK', ...Utils.newTabLinkProps }, [
            'More information about managing shared billing projects.'
          ])
        ] : [
          'This shared billing project has only one owner. Consider requesting ',
          h(Link, { mailto: projectOwners[0].email }, [projectOwners[0].email]),
          ' to add another owner to ensure someone is able to manage the billing project in case they lose access to their account.'
        ])
      ]),
      h(SimpleTabBar, {
        'aria-label': 'project details',
        metricsPrefix: Events.billingProjectSelectTab,
        metricsData: { billingProjectName: billingProject.projectName },
        style: { marginTop: '2rem', textTransform: 'none', padding: '0 1rem', height: '1.5rem' },
        tabStyle: { borderBottomWidth: 4 },
        value: tab,
        key: `tabBarKey${isAlphaSpendReportUser}`, // The Spend report tab is only present for alpha users, so force recreation.
        onChange: newTab => {
          if (newTab === tab) {
            void reloadBillingProjectUsers()
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
        void reloadBillingProjectUsers()
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
    } as any),
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
    billingAccountsOutOfDate && h(BillingAccountSummaryPanel, { counts: _.mapValues(_.size, groups) as any }),
    updating && absoluteSpinnerOverlay
  ])
}

export default ProjectDetail
