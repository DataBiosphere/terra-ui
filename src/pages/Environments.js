import { differenceInDays } from 'date-fns'
import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, h2, p, span, strong } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import PopupTrigger, { makeMenuIcon } from 'src/components/PopupTrigger'
import SupportRequestWrapper from 'src/components/SupportRequest'
import { FlexTable, HeaderCell, SimpleFlexTable, Sortable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { useWorkspaces } from 'src/components/workspace-utils'
import { useReplaceableAjaxExperimental } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow, withErrorHandling, withErrorIgnoring, withErrorReporting, withErrorReportingInModal } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, useGetter } from 'src/libs/react-utils'
import { contactUsActive } from 'src/libs/state'
import * as Style from 'src/libs/style'
import { topBarHeight } from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { SaveFilesHelp, SaveFilesHelpAzure, SaveFilesHelpGalaxy } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import {
  defaultComputeZone, getAppCost, getComputeStatusForDisplay, getCreatorForRuntime, getDiskAppType, getGalaxyComputeCost,
  getPersistentDiskCostMonthly,
  getRegionFromZone, getRuntimeCost, isApp, isComputePausable, isGcpContext, isResourceDeletable, mapToPdTypes,
  workspaceHasMultipleDisks
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { AppErrorModal, RuntimeErrorModal } from 'src/pages/workspaces/workspace/analysis/RuntimeManager'
import { appTools, getToolLabelFromRuntime, isPauseSupported } from 'src/pages/workspaces/workspace/analysis/tool-utils'


const DeleteRuntimeModal = ({
  runtime: { cloudContext, googleProject, runtimeName, runtimeConfig: { persistentDiskId }, workspaceId }, onDismiss, onSuccess
}) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const ajax = useReplaceableAjaxExperimental()
  const deleteRuntime = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    isGcpContext(cloudContext) ?
      await ajax().Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk) :
      await ajax().Runtimes.runtimeV2(workspaceId, runtimeName).delete(deleteDisk)
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete cloud environment?',
    onDismiss,
    okButton: deleteRuntime
  }, [
    div({ style: { lineHeight: 1.5 } }, [
      persistentDiskId ?
        h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
          span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it'])
        ]) :
        p([
          'Deleting this cloud environment will also ', span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.'])
        ]),
      p([
        'Deleting your cloud environment will stop all running notebooks and associated costs. You can recreate your cloud environment later, ',
        'which will take several minutes.'
      ]),
      !isGcpContext(cloudContext) ? h(SaveFilesHelpAzure) : h(SaveFilesHelp),

    ]),
    deleting && spinnerOverlay
  ])
}

const DeleteDiskModal = ({ disk: { googleProject, name }, isGalaxyDisk, onDismiss, onSuccess }) => {
  const [busy, setBusy] = useState(false)
  const ajax = useReplaceableAjaxExperimental()
  const deleteDisk = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error deleting persistent disk')
  )(async () => {
    await ajax().Disks.disk(googleProject, name).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete persistent disk?',
    onDismiss,
    okButton: deleteDisk
  }, [
    p([
      'Deleting the persistent disk will ', span({ style: { fontWeight: 600 } }, ['delete all files on it.'])
    ]),
    isGalaxyDisk && h(SaveFilesHelp, [false]),
    busy && spinnerOverlay
  ])
}

const DeleteAppModal = ({ app: { appName, diskName, appType, cloudContext: { cloudProvider, cloudResource } }, onDismiss, onSuccess }) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const ajax = useReplaceableAjaxExperimental()
  const deleteApp = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReportingInModal('Error deleting cloud environment', onDismiss)
  )(async () => {
    //TODO: this should use types in IA-3824
    if (cloudProvider === 'GCP') {
      await ajax().Apps.app(cloudResource, appName).delete(deleteDisk)
      onSuccess()
    } else {
      throw new Error('Deleting apps is currently only supported on GCP')
    }
  })
  return h(Modal, {
    title: 'Delete cloud environment?',
    onDismiss,
    okButton: deleteApp
  }, [
    div({ style: { lineHeight: 1.5 } }, [
      diskName ?
        h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
          span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it'])
        ]) :
        p([
          'Deleting this cloud environment will also ', span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.'])
        ]),
      appType === appTools.Galaxy.appType && h(SaveFilesHelpGalaxy)
    ]),
    deleting && spinnerOverlay
  ])
}

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

const MigratePersistentDiskCell = ({ onClick }) => div({
  style: {
    display: 'flex', flex: 1, flexDirection: 'column', textAlign: 'center',
    height: '100%', margin: '-1rem', padding: '0.5rem 0 0 0',
    backgroundColor: colors.danger(0.15), color: colors.danger()
  }
}, [
  h(TooltipTrigger, { content: 'This disk is shared between workspaces, which is no longer supported. Click "Migrate" to make copies for relevant workspaces.' }, [
    div(['Offline', icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
  ]),
  h(Link, { onClick, style: { wordBreak: 'break-word' } }, ['Migrate'])
])

const MigratePersistentDiskModal = ({ disk, workspaces, onSuccess, onDismiss, onContactSupport, onDeleteDisk }) => {
  // show a spinner when we're copying the disk to another workspace
  const [migrating, setMigrating] = useState()
  // workspaceId -> boolean indicating if we should copy the disk to the workspace
  const [isWorkspaceSelected, setIsWorkspaceSelected] = useState({})
  // users can choose to delete their disk instead of coping via a checkbox. Mutually exclusive with `isWorkspaceSelected`
  const [deleteDisk, setDeleteDisk] = useState(false)
  const ajax = useReplaceableAjaxExperimental()

  const copyDiskToWorkspace = ({ googleProject, namespace: saturnWorkspaceNamespace, name: saturnWorkspaceName }) => {
    // show an error for each failed copy operation
    return reportErrorAndRethrow(`Error copying persistent disk to workspace '${saturnWorkspaceName}'`,
      () => ajax().Disks.disk(googleProject, disk.name).create({
        ..._.pick(['size', 'blockSize', 'zone'], disk),
        diskType: disk.diskType.label,
        labels: { saturnWorkspaceNamespace, saturnWorkspaceName },
        sourceDisk: _.pick(['googleProject', 'name'], disk)
      })
    )()
  }

  // dismiss the UI at most once on error
  const migrateDisk = _.flow(withErrorHandling(onDismiss), Utils.withBusyState(setMigrating))(async () => {
    const destinations = _.filter(({ workspaceId }) => isWorkspaceSelected[workspaceId], workspaces)
    await Promise.all(_.map(copyDiskToWorkspace, destinations))
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
        span(space, 'OR'),
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

export const Environments = ({ nav = undefined }) => {
  const signal = useCancellation()
  const { workspaces, refresh: refreshWorkspaces } = _.flow(
    useWorkspaces,
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
  const [errorRuntimeId, setErrorRuntimeId] = useState()
  const getErrorRuntimeId = useGetter(errorRuntimeId)
  const [deleteRuntimeId, setDeleteRuntimeId] = useState()
  const getDeleteRuntimeId = useGetter(deleteRuntimeId)
  const [deleteDiskId, setDeleteDiskId] = useState()
  const getDeleteDiskId = useGetter(deleteDiskId)
  const [errorAppId, setErrorAppId] = useState()
  const [deleteAppId, setDeleteAppId] = useState()
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' })
  const [diskSort, setDiskSort] = useState({ field: 'project', direction: 'asc' })
  const [migrateDisk, setMigrateDisk] = useState()
  const [shouldFilterByCreator, setShouldFilterByCreator] = useState(true)
  const ajax = useReplaceableAjaxExperimental()

  const currentUser = getUser().email

  const refreshData = Utils.withBusyState(setLoading, async () => {
    await refreshWorkspaces()

    const workspaces = getWorkspaces()
    const getWorkspace = (namespace, name) => _.get(`${namespace}.${name}`, workspaces)

    const startTimeForLeoCallsEpochMs = Date.now()

    const listArgs = shouldFilterByCreator ? { role: 'creator', includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' } : { includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' }
    const [newRuntimes, newDisks, newApps] = await Promise.all([
      ajax(signal).Runtimes.listV2(listArgs),
      ajax(signal).Disks.list({ ...listArgs, includeLabels: 'saturnApplication,saturnWorkspaceNamespace,saturnWorkspaceName' }),
      ajax(signal).Apps.listWithoutProject(listArgs)
    ])
    const endTimeForLeoCallsEpochMs = Date.now()

    const leoCallTimeTotalMs = endTimeForLeoCallsEpochMs - startTimeForLeoCallsEpochMs
    ajax().Metrics.captureEvent(Events.cloudEnvironmentDetailsLoad, { leoCallTimeMs: leoCallTimeTotalMs, totalCallTimeMs: leoCallTimeTotalMs, runtimes: newRuntimes.length, disks: newDisks.length, apps: newApps.length })

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

    if (!_.some({ id: getErrorRuntimeId() }, newRuntimes)) {
      setErrorRuntimeId(undefined)
    }
    if (!_.some({ id: getDeleteRuntimeId() }, newRuntimes)) {
      setDeleteRuntimeId(undefined)
    }
    if (!_.some({ id: getDeleteDiskId() }, newDisks)) {
      setDeleteDiskId(undefined)
    }
    if (!_.some({ appName: errorAppId }, newApps)) {
      setErrorAppId(undefined)
    }
    if (!_.some({ appName: deleteAppId }, newApps)) {
      setDeleteAppId(undefined)
    }
  })
  const loadData = withErrorIgnoring(refreshData)

  const pauseComputeAndRefresh = Utils.withBusyState(setLoading, async (computeType, compute) => {
    const wrappedPauseCompute = withErrorReporting('Error pausing compute', () => computeType === 'runtime' ?
      ajax().Runtimes.runtimeWrapper(compute).stop() :
      //TODO: AKS vs GKE apps
      ajax().Apps.app(compute.workspace.googleProject, compute.appName).pause())
    await wrappedPauseCompute()
    await loadData()
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(refreshData, 30000)
    return () => {
      clearInterval(interval)
    }
  }, [shouldFilterByCreator]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCloudProvider = cloudEnvironment => Utils.cond(
    //TODO: AKS vs GKE apps
    [isApp(cloudEnvironment), () => 'Kubernetes'],
    [cloudEnvironment?.runtimeConfig?.cloudService === 'DATAPROC', () => 'Dataproc'],
    [Utils.DEFAULT, () => cloudEnvironment?.runtimeConfig?.cloudService])

  const getCloudEnvTool = cloudEnvironment => isApp(cloudEnvironment) ?
    _.capitalize(cloudEnvironment.appType) :
    _.capitalize(cloudEnvironment.labels.tool)

  const filteredRuntimes = _.orderBy([{
    project: 'labels.saturnWorkspaceNamespace',
    workspace: 'labels.saturnWorkspaceName',
    type: getCloudProvider,
    tool: getCloudEnvTool,
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: getRuntimeCost
  }[sort.field]], [sort.direction], runtimes)

  const filteredDisks = mapToPdTypes(_.orderBy([{
    project: 'googleProject',
    workspace: 'labels.saturnWorkspaceName',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: getPersistentDiskCostMonthly,
    size: 'size'
  }[diskSort.field]], [diskSort.direction], disks))

  const filteredApps = _.orderBy([{
    project: 'googleProject',
    workspace: 'labels.saturnWorkspaceName',
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: getAppCost
  }[sort.field]], [sort.direction], apps)

  const filteredCloudEnvironments = _.concat(filteredRuntimes, filteredApps)

  const totalRuntimeCost = _.sum(_.map(getRuntimeCost, runtimes))
  const totalAppCost = _.sum(_.map(getGalaxyComputeCost, apps))
  const totalCost = totalRuntimeCost + totalAppCost
  const totalDiskCost = _.sum(_.map(disk => getPersistentDiskCostMonthly(disk, getRegionFromZone(disk.zone)), mapToPdTypes(disks)))

  const runtimesByProject = _.groupBy('googleProject', runtimes)
  const disksByProject = _.groupBy('googleProject', disks)

  const numDisksRequiringMigration = _.countBy('requiresMigration', disks).true

  // We start the first output string with an empty space because empty space would
  // not apply to the case where appType is not defined (e.g. Jupyter, RStudio).
  const forAppText = appType => !!appType ? ` for ${_.capitalize(appType)}` : ''

  const getWorkspaceCell = (namespace, name, appType, shouldWarn) => {
    return !!name ?
      h(Fragment, [
        h(Link, { href: nav.getLink('workspace-dashboard', { namespace, name }), style: { wordBreak: 'break-word' } }, [name]),
        shouldWarn && h(TooltipTrigger, {
          content: `This workspace has multiple active cloud environments${forAppText(appType)}. Only the latest one will be used.`
        }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
      ]) :
      'information unavailable'
  }

  // Old apps, runtimes and disks may not have 'saturnWorkspaceNamespace' label defined. When they were
  // created, workspace namespace (a.k.a billing project) value used to equal the google project.
  // Therefore we use google project if the namespace label is not defined.
  const renderWorkspaceForApps = app => {
    const { appType, cloudContext: { cloudResource }, labels: { saturnWorkspaceNamespace, saturnWorkspaceName } } = app
    // Here, we use the saturnWorkspaceNamespace label if its defined, otherwise use cloudResource for older runtimes
    const resolvedSaturnWorkspaceNamespace = saturnWorkspaceNamespace ? saturnWorkspaceNamespace : cloudResource
    return getWorkspaceCell(resolvedSaturnWorkspaceNamespace, saturnWorkspaceName, appType, false)
  }

  const renderWorkspaceForRuntimes = runtime => {
    const { status, googleProject, labels: { saturnWorkspaceNamespace = googleProject, saturnWorkspaceName } = {} } = runtime
    //TODO: Azure runtimes are not covered in this logic
    const shouldWarn =
      doesUserHaveDuplicateRuntimes(getCreatorForRuntime(runtime), runtimesByProject[googleProject]) &&
      !_.includes(status, ['Deleting', 'Error'])
    return getWorkspaceCell(saturnWorkspaceNamespace, saturnWorkspaceName, null, shouldWarn)
  }

  const doesUserHaveDuplicateRuntimes = (user, runtimes) => {
    const runtimesForUser = _.flow(
      _.map(getCreatorForRuntime),
      _.filter(!_.eq(user))
    )(runtimes)
    return runtimesForUser.length > 1
  }

  const getDetailsPopup = (cloudEnvName, billingId, disk, creator, workspaceId) => {
    return h(PopupTrigger, {
      content: div({ style: { padding: '0.5rem' } }, [
        div([strong(['Name: ']), cloudEnvName]),
        div([strong(['Billing ID: ']), billingId]),
        workspaceId && div([strong(['Workspace ID: ']), workspaceId]),
        !shouldFilterByCreator && div([strong(['Creator: ']), creator]),
        !!disk && div([strong(['Persistent Disk: ']), disk.name])
      ])
    }, [h(Link, ['view'])])
  }

  const renderDetailsApp = (app, disks) => {
    const { appName, diskName, auditInfo: { creator }, workspace: { workspaceId, googleProject } = {} } = app
    const disk = _.find({ name: diskName }, disks)
    return getDetailsPopup(appName, googleProject, disk, creator, workspaceId)
  }

  const renderDetailsRuntime = (runtime, disks) => {
    const { runtimeName, cloudContext, runtimeConfig: { persistentDiskId } = {}, auditInfo: { creator }, workspace } = runtime
    const disk = _.find({ id: persistentDiskId }, disks)
    return getDetailsPopup(runtimeName, cloudContext?.cloudResource, disk, creator, workspace?.workspaceId)
  }

  const renderDeleteButton = (resourceType, resource) => {
    const isDeletable = isResourceDeletable(resourceType, resource)
    const resourceId = resourceType === 'app' ? resource.appName : resource.id
    const action = Utils.switchCase(resourceType,
      ['runtime', () => setDeleteRuntimeId],
      ['app', () => setDeleteAppId],
      ['disk', () => setDeleteDiskId]
    )

    return h(Link, {
      disabled: !isDeletable,
      tooltip: isDeletable ?
        'Delete cloud environment' :
        `Cannot delete a cloud environment while in status ${_.upperCase(getComputeStatusForDisplay(resource.status))}.`,
      onClick: () => action(resourceId)
    }, [makeMenuIcon('trash'), 'Delete'])
  }

  const renderPauseButton = (computeType, compute) => {
    const { status } = compute

    const shouldShowPauseButton =
      Utils.cond(
        [isApp(compute) && !_.find(tool => tool.appType && tool.appType === compute.appType)(appTools)?.isPauseUnsupported, () => true],
        [isPauseSupported(getToolLabelFromRuntime(compute)) && currentUser === getCreatorForRuntime(compute), () => true],
        () => false)

    return shouldShowPauseButton && h(Link, {
      style: { marginRight: '1rem' },
      disabled: !isComputePausable(computeType, compute),
      tooltip: isComputePausable(computeType, compute) ?
        'Pause cloud environment' :
        `Cannot pause a cloud environment while in status ${_.upperCase(getComputeStatusForDisplay(status))}.`,
      onClick: () => pauseComputeAndRefresh(computeType, compute)
    }, [makeMenuIcon('pause'), 'Pause'])
  }

  const renderErrorApps = app => {
    const convertedAppStatus = getComputeStatusForDisplay(app.status)
    return h(Fragment, [
      convertedAppStatus,
      convertedAppStatus === 'Error' && h(Clickable, {
        tooltip: 'View error',
        onClick: () => setErrorAppId(app.appName)
      }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
    ])
  }

  const renderErrorRuntimes = runtime => {
    const convertedRuntimeStatus = getComputeStatusForDisplay(runtime.status)
    return h(Fragment, [
      convertedRuntimeStatus,
      convertedRuntimeStatus === 'Error' && h(Clickable, {
        tooltip: 'View error',
        onClick: () => setErrorRuntimeId(runtime.id)
      }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })])
    ])
  }

  const renderDeleteDiskModal = disk => {
    return h(DeleteDiskModal, {
      disk,
      isGalaxyDisk: getDiskAppType(disk) === appTools.Galaxy.appType,
      onDismiss: () => setDeleteDiskId(undefined),
      onSuccess: () => {
        setDeleteDiskId(undefined)
        loadData()
      }
    })
  }

  const multipleDisksError = (disks, appType) => {
    // appType is undefined for runtimes (ie Jupyter, RStudio) so the first part of the ternary is for processing app
    // disks. the second part is for processing runtime disks so it filters out app disks
    return !!appType ? workspaceHasMultipleDisks(disks, appType) : _.remove(disk => getDiskAppType(disk) !== appType || disk.status === 'Deleting',
      disks).length > 1
  }

  return h(Fragment, [
    div({ role: 'main', style: { padding: '1rem', flexGrow: 1 } }, [
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '0 0 1rem 0', padding: 0 } }, ['Your cloud environments']),
      div({ style: { marginBottom: '.5rem' } }, [
        h(LabeledCheckbox, { checked: shouldFilterByCreator, onChange: setShouldFilterByCreator }, [
          span({ style: { fontWeight: 600 } }, [' Hide resources you did not create'])
        ])
      ]),
      runtimes && h(SimpleFlexTable, {
        'aria-label': 'cloud environments',
        sort,
        rowCount: filteredCloudEnvironments.length,
        columns: [
          {
            size: { basis: 250 },
            field: 'project',
            headerRenderer: () => h(Sortable, { sort, field: 'project', onSort: setSort }, ['Billing project']),
            cellRenderer: ({ rowIndex }) => {
              const { googleProject, labels: { saturnWorkspaceNamespace = googleProject } } = filteredCloudEnvironments[rowIndex]
              return saturnWorkspaceNamespace
            }
          },
          {
            size: { basis: 250 },
            field: 'workspace',
            headerRenderer: () => h(Sortable, { sort, field: 'workspace', onSort: setSort }, ['Workspace']),
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              return !!cloudEnvironment.appName ? renderWorkspaceForApps(cloudEnvironment) : renderWorkspaceForRuntimes(cloudEnvironment)
            }
          },
          {
            size: { basis: 125, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'type', onSort: setSort }, ['Type']),
            cellRenderer: ({ rowIndex }) => getCloudProvider(filteredCloudEnvironments[rowIndex])
          },
          {
            size: { basis: 125, grow: 0 },
            headerRenderer: () => h(Sortable, { sort, field: 'tool', onSort: setSort }, ['Tool']),
            cellRenderer: ({ rowIndex }) => getCloudEnvTool(filteredCloudEnvironments[rowIndex])
          },
          {
            size: { basis: 90, grow: 0 },
            headerRenderer: () => 'Details',
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              return cloudEnvironment.appName ? renderDetailsApp(cloudEnvironment, disks) : renderDetailsRuntime(cloudEnvironment, disks)
            }
          },
          {
            size: { basis: 150, grow: 0 },
            field: 'status',
            headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              return cloudEnvironment.appName ? renderErrorApps(cloudEnvironment) : renderErrorRuntimes(cloudEnvironment)
            }
          },
          {
            size: { basis: 120, grow: 0.2 },
            headerRenderer: () => 'Location',
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              const zone = cloudEnvironment?.runtimeConfig?.zone
              const region = cloudEnvironment?.runtimeConfig?.region
              // We assume that all apps get created in zone 'us-central1-a'.
              // If zone or region is not present then cloudEnvironment is an app so we return 'us-central1-a'.
              return zone || region || defaultComputeZone.toLowerCase()
            }
          },
          {
            size: { basis: 220, grow: 0 },
            field: 'created',
            headerRenderer: () => h(Sortable, { sort, field: 'created', onSort: setSort }, ['Created']),
            cellRenderer: ({ rowIndex }) => {
              return Utils.makeCompleteDate(filteredCloudEnvironments[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 220, grow: 0 },
            field: 'accessed',
            headerRenderer: () => h(Sortable, { sort, field: 'accessed', onSort: setSort }, ['Last accessed']),
            cellRenderer: ({ rowIndex }) => {
              return Utils.makeCompleteDate(filteredCloudEnvironments[rowIndex].auditInfo.dateAccessed)
            }
          },
          {
            size: { basis: 240, grow: 0 },
            field: 'cost',
            headerRenderer: () => h(Sortable, { sort, field: 'cost', onSort: setSort }, [`Cost / hr (${Utils.formatUSD(totalCost)} total)`]),
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              return cloudEnvironment.appName ?
                Utils.formatUSD(getGalaxyComputeCost(cloudEnvironment)) :
                Utils.formatUSD(getRuntimeCost(cloudEnvironment))
            }
          },
          {
            size: { basis: 200, grow: 0 },
            headerRenderer: () => 'Actions',
            cellRenderer: ({ rowIndex }) => {
              const cloudEnvironment = filteredCloudEnvironments[rowIndex]
              const computeType = isApp(cloudEnvironment) ? 'app' : 'runtime'
              return h(Fragment, [
                renderPauseButton(computeType, cloudEnvironment),
                renderDeleteButton(computeType, cloudEnvironment)
              ])
            }
          }
        ]
      }),
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '1rem 0', padding: 0 } }, ['Your persistent disks']),
      disks && h(SimpleFlexTable, {
        'aria-label': 'persistent disks',
        sort: diskSort,
        rowCount: filteredDisks.length,
        columns: [
          {
            size: { basis: 250 },
            field: 'project',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'project', onSort: setDiskSort }, ['Billing project']),
            cellRenderer: ({ rowIndex }) => {
              const { googleProject, labels: { saturnWorkspaceNamespace = googleProject } } = filteredDisks[rowIndex]
              return saturnWorkspaceNamespace
            }
          },
          {
            size: { basis: 250 },
            field: 'workspace',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'workspace', onSort: setDiskSort }, ['Workspace']),
            cellRenderer: ({ rowIndex }) => {
              const { status: diskStatus, googleProject, workspace, creator } = filteredDisks[rowIndex]
              const appType = getDiskAppType(filteredDisks[rowIndex])
              const multipleDisks = multipleDisksError(disksByProject[googleProject], appType)
              return !!workspace ?
                h(Fragment, [
                  h(Link, { href: nav.getLink('workspace-dashboard', workspace), style: { wordBreak: 'break-word' } },
                    [workspace.name]),
                  currentUser === creator && diskStatus !== 'Deleting' && multipleDisks &&
                  h(TooltipTrigger, {
                    content: `This workspace has multiple active persistent disks${forAppText(appType)}. Only the latest one will be used.`
                  }, [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })])
                ]) :
                'information unavailable'
            }
          },
          {
            size: { basis: 90, grow: 0 },
            headerRenderer: () => 'Details',
            cellRenderer: ({ rowIndex }) => {
              const { name, id, cloudContext, workspace, auditInfo: { creator } } = filteredDisks[rowIndex]
              const runtime = _.find({ runtimeConfig: { persistentDiskId: id } }, runtimes)
              const app = _.find({ diskName: name }, apps)
              return h(PopupTrigger, {
                content: div({ style: { padding: '0.5rem' } }, [
                  div([strong(['Name: ']), name]),
                  div([strong(['Billing ID: ']), cloudContext.cloudResource]),
                  workspace && div([strong(['Workspace ID: ']), workspace.workspaceId]),
                  !shouldFilterByCreator && div([strong(['Creator: ']), creator]),
                  runtime && div([strong(['Runtime: ']), runtime.runtimeName]),
                  app && div([strong([`${_.capitalize(app.appType)}: `]), app.appName])
                ])
              }, [h(Link, ['view'])])
            }
          },
          {
            size: { basis: 120, grow: 0 },
            field: 'size',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'size', onSort: setDiskSort }, ['Size (GB)']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.size
            }
          },
          {
            size: { basis: 130, grow: 0 },
            field: 'status',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'status', onSort: setDiskSort }, ['Status']),
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.requiresMigration ? h(MigratePersistentDiskCell, { onClick: () => setMigrateDisk(disk) }, []) : disk.status
            }
          },
          {
            size: { basis: 120, grow: 0.2 },
            headerRenderer: () => 'Location',
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              return disk.zone
            }
          },
          {
            size: { basis: 220, grow: 0 },
            field: 'created',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'created', onSort: setDiskSort }, ['Created']),
            cellRenderer: ({ rowIndex }) => {
              return Utils.makeCompleteDate(filteredDisks[rowIndex].auditInfo.createdDate)
            }
          },
          {
            size: { basis: 220, grow: 0 },
            field: 'accessed',
            headerRenderer: () => h(Sortable, { sort: diskSort, field: 'accessed', onSort: setDiskSort }, ['Last accessed']),
            cellRenderer: ({ rowIndex }) => {
              return Utils.makeCompleteDate(filteredDisks[rowIndex].auditInfo.dateAccessed)
            }
          },
          {
            size: { basis: 250, grow: 0 },
            field: 'cost',
            headerRenderer: () => {
              return h(Sortable, { sort: diskSort, field: 'cost', onSort: setDiskSort }, [`Cost / month (${Utils.formatUSD(totalDiskCost)} total)`])
            },
            cellRenderer: ({ rowIndex }) => {
              const disk = filteredDisks[rowIndex]
              const diskRegion = getRegionFromZone(disk.zone)
              return Utils.formatUSD(getPersistentDiskCostMonthly(disk, diskRegion))
            }
          },
          {
            size: { basis: 200, grow: 0 },
            headerRenderer: () => 'Action',
            cellRenderer: ({ rowIndex }) => {
              const { id, status, name } = filteredDisks[rowIndex]
              const error = Utils.cond(
                [status === 'Creating', () => 'Cannot delete this disk because it is still being created.'],
                [status === 'Deleting', () => 'The disk is being deleted.'],
                [_.some({ runtimeConfig: { persistentDiskId: id } }, runtimes) || _.some({ diskName: name }, apps),
                  () => 'Cannot delete this disk because it is attached. You must delete the cloud environment first.']
              )
              return h(Link, {
                disabled: !!error,
                tooltip: error || 'Delete persistent disk',
                onClick: () => setDeleteDiskId(id)
              }, [makeMenuIcon('trash'), 'Delete'])
            }
          }
        ]
      }),
      errorRuntimeId && h(RuntimeErrorModal, {
        runtime: _.find({ id: errorRuntimeId }, runtimes),
        onDismiss: () => setErrorRuntimeId(undefined)
      }),
      deleteRuntimeId && h(DeleteRuntimeModal, {
        runtime: _.find({ id: deleteRuntimeId }, runtimes),
        onDismiss: () => setDeleteRuntimeId(undefined),
        onSuccess: () => {
          setDeleteRuntimeId(undefined)
          loadData()
        }
      }),
      deleteDiskId && renderDeleteDiskModal(_.find({ id: deleteDiskId }, disks)),
      deleteAppId && h(DeleteAppModal, {
        app: _.find({ appName: deleteAppId }, apps),
        onDismiss: () => setDeleteAppId(undefined),
        onSuccess: () => {
          setDeleteAppId(undefined)
          loadData()
        }
      }),
      errorAppId && h(AppErrorModal, {
        app: _.find({ appName: errorAppId }, apps),
        onDismiss: () => setErrorAppId(undefined),
        onSuccess: () => {
          setErrorAppId(undefined)
          loadData()
        }
      }),
      migrateDisk && h(MigratePersistentDiskModal, {
        disk: migrateDisk,
        workspaces: _.flow(
          _.get(migrateDisk.googleProject),
          _.values,
          _.filter(({ accessLevel, workspace: { googleProject } }) => {
            return Utils.canWrite(accessLevel) && _.isEmpty(disksByProject[googleProject])
          }),
          _.map('workspace'),
          _.sortBy(({ name }) => _.lowerCase(name))
        )(workspaces),
        onDismiss: () => setMigrateDisk(undefined),
        onSuccess: () => {
          setMigrateDisk(undefined)
          loadData()
        },
        onContactSupport: () => contactUsActive.set(true),
        onDeleteDisk: () => setDeleteDiskId(migrateDisk.id)
      })
    ]),
    numDisksRequiringMigration > 0 && h(MigratePersistentDisksBanner, { count: numDisksRequiringMigration }, []),
    contactUsActive.get() && h(SupportRequestWrapper),
    loading && spinnerOverlay
  ])
}

// Temporary export here for ease of access to it when using the above component from outside of
// this repository.
export { ajaxContext } from 'src/libs/ajax'

const EnvironmentsPage = () => h(FooterWrapper, [
  h(TopBar, { title: 'Cloud Environments' }),
  // Passing Nav here allows overriding when this component is used outside of Terra UI.
  h(Environments, { nav: Nav })
])

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: EnvironmentsPage,
    title: 'Cloud environments'
  }
]
