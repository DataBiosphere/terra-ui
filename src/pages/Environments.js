import { differenceInDays } from 'date-fns'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, strong } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import SupportRequestWrapper from 'src/components/SupportRequest'
import TopBar from 'src/components/TopBar'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow, withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, useGetter, useOnMount, usePollingEffect } from 'src/libs/react-utils'
import { contactUsActive } from 'src/libs/state'
import { topBarHeight } from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import EnvironmentsTable from 'src/pages/EnvironmentsTable'
import { isGcpContext } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


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
  // usePollingEffect(withErrorIgnoring(refreshData), { ms: 30000 })

  const numDisksRequiringMigration = _.countBy('requiresMigration', disks).true

  // return h(FooterWrapper, [
  return h(Fragment, [
    // h(TopBar, { title: 'Cloud Environments' }),
    h(EnvironmentsTable, {
      workspaces, runtimes, apps, disks, loadData, setLoading,
      shouldFilterRuntimesByCreator, setShouldFilterRuntimesByCreator,
      deleteRuntime: Utils.withBusyState(setBusy)(deleteRuntime),
      deleteDisk: Utils.withBusyState(setBusy)(deleteDisk),
      deleteApp: Utils.withBusyState(setBusy)(deleteApp),
      copyDiskToWorkspace,
      pauseComputeAndRefresh:
        Utils.withBusyState(setBusy)((...args) => pauseCompute(...args).then(loadData)),
      getWorkspaceHref: ws => Nav.getLink('workspace-dashboard', ws)
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
