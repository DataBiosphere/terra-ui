import { differenceInDays } from 'date-fns'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, span, strong } from 'react-hyperscript-helpers'
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import SupportRequestWrapper from 'src/components/SupportRequest'
import { FlexTable, HeaderCell, SimpleFlexTable, Sortable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow, withErrorHandling, withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, useGetter, useOnMount } from 'src/libs/react-utils'
import { contactUsActive } from 'src/libs/state'
import { topBarHeight } from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import EnvironmentsTable from 'src/pages/EnvironmentsTable'
import { getPersistentDiskCostMonthly, getRegionFromZone, isGcpContext } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


const deleteRuntime =
  withErrorReporting('Error deleting cloud environment')((rt, shouldDeleteDisk) =>
    isGcpContext(rt.cloudContext) ?
      Ajax().Runtimes.runtime(rt.googleProject, rt.runtimeName).delete(shouldDeleteDisk) :
      Ajax().Runtimes.runtimeV2(rt.workspaceId, rt.runtimeName).delete(shouldDeleteDisk))

const deleteDisk =
  withErrorReporting('Error deleting persistent disk')((googleProject, name) =>
    Ajax().Disks.disk(googleProject, name).delete())

const deleteApp =
  withErrorReporting('Error deleting cloud environment')((googleProject, appName, shouldDeleteDisk) =>
    Ajax().Apps.app(googleProject, appName).delete(shouldDeleteDisk))

const copyDiskToWorkspace = disk => ({ googleProject, namespace: saturnWorkspaceNamespace, name: saturnWorkspaceName }) => {
  // show an error for each failed copy operation
  return reportErrorAndRethrow(`Error copying persistent disk to workspace '${saturnWorkspaceName}'`,
    () => Ajax().Disks.disk(googleProject, disk.name).create({
      ..._.pick(['size', 'blockSize', 'zone'], disk),
      diskType: disk.diskType.label,
      labels: { saturnWorkspaceNamespace, saturnWorkspaceName },
      sourceDisk: _.pick(['googleProject', 'name'], disk)
    })
  )()
}

const pauseCompute =
  withErrorReporting('Error pausing compute')((computeType, compute) =>
    computeType === 'runtime' ?
      Ajax().Runtimes.runtimeWrapper(compute).stop() :
      Ajax().Apps.app(compute.googleProject, compute.appName).pause())

const MigratePersistentDisksBanner = ({ count }) => {
  const deadline = new Date('2023-01-01T00:00:00.000Z')
  return div({
    style: {
      position: 'absolute', top: topBarHeight, left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor: colors.warning(0.15),
      border: '2px solid', borderRadius: '12px', borderColor: colors.warning(),
      zIndex: 2 // Draw over top bar but behind contact support dialog
    }
  }, [
    div({ style: { display: 'flex', alignItems: 'center', margin: '0.75rem 1.5rem 0.75rem 1.5rem' } }, [
      icon('warning-standard', { size: 32, style: { color: colors.warning(), marginRight: '0.25rem' } }),
      div([
        strong([
          `You have ${differenceInDays(deadline, Date.now())} days to migrate ${count} shared persistent `,
          `${count > 1 ? 'disks' : 'disk'}. `
        ]),
        `Un-migrated disks will be DELETED after ${Utils.makeCompleteDate(deadline)}.`
      ])
    ])
  ])
}

const MigratePersistentDiskModal = ({ disk, workspaces, onSuccess, onDismiss, onContactSupport, onDeleteDisk, copyDiskToWorkspace }) => {
  // show a spinner when we're copying the disk to another workspace
  const [migrating, setMigrating] = useState()
  // workspaceId -> boolean indicating if we should copy the disk to the workspace
  const [isWorkspaceSelected, setIsWorkspaceSelected] = useState({})
  // users can choose to delete their disk instead of coping via a checkbox. Mutually exclusive with `isWorkspaceSelected`
  const [deleteDisk, setDeleteDisk] = useState(false)

  // dismiss the UI at most once on error
  const migrateDisk = _.flow(withErrorHandling(onDismiss), Utils.withBusyState(setMigrating))(async () => {
    const destinations = _.filter(({ workspaceId }) => isWorkspaceSelected[workspaceId], workspaces)
    await Promise.all(_.map(copyDiskToWorkspace(disk), destinations))
    await onSuccess()
  })

  const space = { style: { marginTop: '0.5rem', marginBottom: '0.5rem' } }

  const renderDeleteDiskSelection = () => {
    const onChange = choice => {
      setDeleteDisk(choice)
      if (choice) { setIsWorkspaceSelected({}) }
    }

    return div({ style: { ...space, display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
      h(LabeledCheckbox, { checked: deleteDisk, onChange }, []),
      span({ style: { paddingLeft: '0.5rem' } }, ['Delete this disk.'])
    ])
  }

  const costPerCopy = getPersistentDiskCostMonthly(disk, getRegionFromZone(disk.zone))
  const numberOfCopies = _.flow(_.values, _.compact, _.size)(isWorkspaceSelected)

  return h(Modal, {
    title: `Migrate ${disk.name}`,
    okButton: deleteDisk || _.isEmpty(workspaces) ?
      h(ButtonPrimary, { disabled: !deleteDisk, onClick: _.flow(onDismiss, onDeleteDisk) }, 'Delete') :
      h(ButtonPrimary, { disabled: numberOfCopies === 0, onClick: migrateDisk }, 'Migrate'),
    onDismiss
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, Array.prototype.concat(
      [span(space, 'Due to data security policies, persistent disks can no longer be shared between workspaces.')],
      _.isEmpty(workspaces) ? [
        strong(space, ['You own this disk but do not have access to any workspaces where it can be shared.']),
        renderDeleteDiskSelection(),
        span(space, ['OR']),
        div([
          h(Link, { onClick: _.flow(onDismiss, onContactSupport) }, 'Contact Terra Support'),
          ' to have it transferred to another user.'
        ])
      ] : [
        strong(space, ['Select workspaces where you want to use a copy of this disk.']),
        h(FlexTable, {
          'aria-label': 'workspace-selection',
          width: 400, height: 250, headerHeight: 24, rowHeight: 24, variant: 'light',
          rowCount: _.size(workspaces),
          columns: [
            {
              field: 'selection',
              size: { basis: 24, grow: 0 },
              headerRenderer: () => h(TooltipTrigger, { content: 'Select all' }, [
                h(LabeledCheckbox, {
                  checked: _.every(w => isWorkspaceSelected[w.workspaceId], workspaces),
                  onChange: selected => {
                    setDeleteDisk(false)
                    setIsWorkspaceSelected(_.reduce((state, w) => _.set(w.workspaceId, selected, state), {}, workspaces))
                  }
                }, [])
              ]),
              cellRenderer: ({ rowIndex }) => {
                const workspaceId = workspaces[rowIndex].workspaceId
                return h(LabeledCheckbox, {
                  checked: isWorkspaceSelected[workspaceId],
                  onChange: selected => {
                    setIsWorkspaceSelected(_.set(workspaceId, selected, isWorkspaceSelected))
                    setDeleteDisk(false)
                  }
                })
              }
            },
            {
              field: 'workspace',
              headerRenderer: () => h(HeaderCell, {}, ['Workspace name']),
              cellRenderer: ({ rowIndex }) => {
                const { authorizationDomain, name } = workspaces[rowIndex]
                const authDomains = _.map('membersGroupName', authorizationDomain)?.join(', ')
                const text = Utils.cond(
                  [authorizationDomain.length === 1, () => `${name} (Authorization Domain: ${authDomains})`],
                  [authorizationDomain.length > 1, () => `${name} (Authorization Domains: ${authDomains})`],
                  [Utils.DEFAULT, () => name]
                )
                return h(TextCell, { title: text }, [text])
              }
            }
          ]
        }),
        span(space, ['OR']),
        renderDeleteDiskSelection(),
        div({ style: { display: 'flex', flexDirection: 'column' } }, [
          strong(space, ['Cost']),
          `${Utils.formatUSD(costPerCopy)}/month per copy. (${Utils.formatUSD(costPerCopy * numberOfCopies)}/month total after migration)`
        ])
      ],
      [migrating && spinnerOverlay]
    ))
  ])
}

const MigratePersistentDiskCell = ({ disk, workspaces, disks, copyDiskToWorkspace, loadData, onDeleteDisk }) => {
  const [showModal, setShowModal] = useState(false)
  const disksByProject = _.groupBy('googleProject', disks)
  const renderModal = () => h(MigratePersistentDiskModal, {
    disk,
    workspaces: _.flow(
      _.get(disk.googleProject),
      _.values,
      _.filter(({ accessLevel, workspace: { googleProject } }) => {
        return Utils.canWrite(accessLevel) && _.isEmpty(disksByProject[googleProject])
      }),
      _.map('workspace'),
      _.sortBy(({ name }) => _.lowerCase(name))
    )(workspaces),
    onDismiss: () => setShowModal(false),
    copyDiskToWorkspace,
    onSuccess: () => {
      setShowModal(false)
      loadData()
    },
    onContactSupport: () => contactUsActive.set(true),
    onDeleteDisk
  })
  return div({
    style: {
      display: 'flex', flex: 1, flexDirection: 'column', textAlign: 'center',
      height: '100%', margin: '-1rem', padding: '0.5rem 0 0 0',
      backgroundColor: colors.danger(0.15), color: colors.danger()
    }
  }, [
    h(TooltipTrigger, { content: 'This disk is shared between workspaces, which is no longer supported. Click "Migrate" to make copies for relevant workspaces.' }, [
      div(['Offline', icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
    ]),
    h(Link, { onClick: () => setShowModal(true), style: { wordBreak: 'break-word' } }, ['Migrate']),
    showModal && renderModal()
  ])
}

const Environments = () => {
  const signal = useCancellation()
  const { workspaces, refresh: refreshWorkspaces } = _.flow(
    // The following line looks to eslint like a callback though it is not.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    () => useWorkspaces('accessLevel', 'public', 'workspace', 'workspace.attributes.tag:tags'),
    _.update('workspaces',
      _.flow(
        _.groupBy('workspace.namespace'),
        _.mapValues(_.keyBy('workspace.name'))
      )
    )
  )()

  const getWorkspaces = useGetter(workspaces)
  const [runtimes, setRuntimes] = useState()
  const [apps, setApps] = useState()
  const [disks, setDisks] = useState()
  const getDisks = useGetter(disks)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [shouldFilterRuntimesByCreator, setShouldFilterRuntimesByCreator] = useState(true)

  const refreshData = Utils.withBusyState(setLoading, async () => {
    await refreshWorkspaces()
    const creator = getUser().email

    const workspaces = getWorkspaces()
    const getWorkspace = (namespace, name) => _.get(`${namespace}.${name}`, workspaces)

    const startTimeForLeoCallsEpochMs = Date.now()
    const [newRuntimes, newDisks, newApps] = await Promise.all([
      Ajax(signal).Runtimes.listV2(shouldFilterRuntimesByCreator ?
        { creator, includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' } :
        { includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' }),
      Ajax(signal).Disks.list({ creator, includeLabels: 'saturnApplication,saturnWorkspaceNamespace,saturnWorkspaceName' }),
      Ajax(signal).Apps.listWithoutProject({ creator, includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' })
    ])
    const endTimeForLeoCallsEpochMs = Date.now()

    const leoCallTimeTotalMs = endTimeForLeoCallsEpochMs - startTimeForLeoCallsEpochMs
    Ajax().Metrics.captureEvent(Events.cloudEnvironmentDetailsLoad, { leoCallTimeMs: leoCallTimeTotalMs, totalCallTimeMs: leoCallTimeTotalMs })

    const cloudObjectNeedsMigration = (cloudContext, status, workspace) => status === 'Ready' &&
      isGcpContext(cloudContext) && cloudContext.cloudResource !== workspace?.googleProject

    const decorateLabeledCloudObjWithWorkspace = cloudObject => {
      const { labels: { saturnWorkspaceNamespace, saturnWorkspaceName } } = cloudObject
      const { workspace } = getWorkspace(saturnWorkspaceNamespace, saturnWorkspaceName) || {}
      const requiresMigration = cloudObjectNeedsMigration(cloudObject.cloudContext, cloudObject.status, workspace)
      return { ...cloudObject, workspace, requiresMigration }
    }

    const [decoratedRuntimes, decoratedDisks, decoratedApps] =
      _.map(_.map(decorateLabeledCloudObjWithWorkspace), [newRuntimes, newDisks, newApps])

    setRuntimes(decoratedRuntimes)
    setDisks(decoratedDisks)
    setApps(decoratedApps)

    return { newRuntimes, newDisks, newApps }
  })

  const loadData = withErrorReporting('Error loading cloud environments', refreshData)

  useOnMount(() => { loadData() })
  // Polling does not add enough value to justify the distraction of the UI jitter while the page
  // is open.
  // usePollingEffect(withErrorIgnoring(refreshData), { ms: 30000 })

  const numDisksRequiringMigration = _.countBy('requiresMigration', disks).true

  // return h(FooterWrapper, [
  return h(Fragment, [
    // h(TopBar, { title: 'Cloud Environments' }),
    h(EnvironmentsTable, {
      runtimes, apps, disks, loadData, setLoading,
      shouldFilterRuntimesByCreator, setShouldFilterRuntimesByCreator,
      deleteRuntime: Utils.withBusyState(setBusy)(deleteRuntime),
      deleteDisk: Utils.withBusyState(setBusy)(deleteDisk),
      deleteApp: Utils.withBusyState(setBusy)(deleteApp),
      pauseComputeAndRefresh:
        Utils.withBusyState(setBusy)((...args) => pauseCompute(...args).then(loadData)),
      getWorkspaceHref: ws => Nav.getLink('workspace-dashboard', ws),
      renderers: {
        migratePersistentDiskCell: ({disk, onDeleteDisk}) => h(MigratePersistentDiskCell, {
          disk, workspaces: getWorkspaces(), disks: getDisks(), copyDiskToWorkspace, loadData, onDeleteDisk
        })
      }
    }),
    numDisksRequiringMigration > 0 && h(MigratePersistentDisksBanner, { count: numDisksRequiringMigration }, []),
    contactUsActive.get() && h(SupportRequestWrapper),
    (loading || busy) && spinnerOverlay
  ])
}

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: Environments,
    title: 'Cloud environments'
  }
]
