import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, p, span, strong } from 'react-hyperscript-helpers'
import { Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { getToolFromRuntime, isPauseSupported, tools } from 'src/components/notebook-utils'
import PopupTrigger, { makeMenuIcon } from 'src/components/PopupTrigger'
import { SaveFilesHelp, SaveFilesHelpGalaxy } from 'src/components/runtime-common'
import { AppErrorModal, RuntimeErrorModal } from 'src/components/RuntimeManager'
import { SimpleFlexTable, Sortable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { useCancellation, useGetter, useOnMount, usePollingEffect } from 'src/libs/react-utils'
import {
  cloudProviders,
  defaultComputeZone, getAppCost, getComputeStatusForDisplay, getCurrentRuntime, getDiskAppType, getGalaxyComputeCost,
  getPersistentDiskCostMonthly, getRegionFromZone, isApp, isComputePausable, isResourceDeletable, mapToPdTypes, runtimeCost,
  workspaceHasMultipleApps,
  workspaceHasMultipleDisks
} from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const DeleteRuntimeModal = ({ runtime: { cloudContext: { cloudProvider }, googleProject, runtimeName, runtimeConfig: { persistentDiskId }, workspaceId }, onDismiss, onSuccess }) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const deleteRuntime = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    cloudProvider === cloudProviders.gcp.label ?
      await Ajax().Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk) :
      await Ajax().Runtimes.runtimeV2(workspaceId, runtimeName).delete(deleteDisk)
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
      h(SaveFilesHelp),
      p([
        'Deleting your cloud environment will stop all running notebooks and associated costs. You can recreate your cloud environment later, ',
        'which will take several minutes.'
      ])
    ]),
    deleting && spinnerOverlay
  ])
}

const DeleteDiskModal = ({ disk: { googleProject, name }, isGalaxyDisk, onDismiss, onSuccess }) => {
  const [busy, setBusy] = useState(false)
  const deleteDisk = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error deleting persistent disk')
  )(async () => {
    await Ajax().Disks.disk(googleProject, name).delete()
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

const DeleteAppModal = ({ app: { googleProject, appName, diskName, appType }, onDismiss, onSuccess }) => {
  const [deleteDisk, setDeleteDisk] = useState(false)
  const [deleting, setDeleting] = useState()
  const deleteApp = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    await Ajax().Apps.app(googleProject, appName).delete(deleteDisk)
    onSuccess()
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
      appType === tools.Galaxy.appType && h(SaveFilesHelpGalaxy)
    ]),
    deleting && spinnerOverlay
  ])
}

const Environments = () => {
  const signal = useCancellation()
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
  const [shouldFilterRuntimesByCreator, setShouldFilterRuntimesByCreator] = useState(true)

  const refreshData = Utils.withBusyState(setLoading, async () => {
    const creator = getUser().email
    const [newRuntimes, newDisks, newApps] = await Promise.all([
      Ajax(signal).Runtimes.listV2(shouldFilterRuntimesByCreator ? { creator } : {}),
      Ajax(signal).Disks.list({ creator, includeLabels: 'saturnApplication,saturnWorkspaceNamespace,saturnWorkspaceName' }),
      Ajax(signal).Apps.listWithoutProject({ creator, includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' })
    ])
    setRuntimes(newRuntimes)
    setDisks(newDisks)
    setApps(newApps)
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

  const loadData = withErrorReporting('Error loading cloud environments', refreshData)

  const pauseComputeAndRefresh = Utils.withBusyState(setLoading, async (computeType, compute) => {
    const wrappedPauseCompute = withErrorReporting('Error pausing compute', () => computeType === 'runtime' ?
      Ajax().Runtimes.runtime(compute.googleProject, compute.runtimeName).stop() :
      Ajax().Apps.app(compute.googleProject, compute.appName).pause())
    await wrappedPauseCompute()
    await loadData()
  })

  useOnMount(() => { loadData() })
  usePollingEffect(withErrorIgnoring(refreshData), { ms: 30000 })

  const getCloudProvider = cloudEnvironment => isApp(cloudEnvironment) ? 'Kubernetes' : cloudEnvironment.runtimeConfig.cloudService === 'DATAPROC' ? 'Dataproc' : cloudEnvironment.runtimeConfig.cloudService
  const getCloudEnvTool = cloudEnvironment => isApp(cloudEnvironment) ? _.capitalize(cloudEnvironment.appType) : _.capitalize(cloudEnvironment.labels.tool)

  const filteredRuntimes = _.orderBy([{
    project: 'labels.saturnWorkspaceNamespace',
    workspace: 'labels.saturnWorkspaceName',
    type: getCloudProvider,
    tool: getCloudEnvTool,
    status: 'status',
    created: 'auditInfo.createdDate',
    accessed: 'auditInfo.dateAccessed',
    cost: runtimeCost
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

  const totalRuntimeCost = _.sum(_.map(runtimeCost, runtimes))
  const totalAppCost = _.sum(_.map(getGalaxyComputeCost, apps))
  const totalCost = totalRuntimeCost + totalAppCost
  const totalDiskCost = _.sum(_.map(disk => getPersistentDiskCostMonthly(disk, getRegionFromZone(disk.zone)), mapToPdTypes(disks)))

  const runtimesByProject = _.groupBy('googleProject', runtimes)
  const disksByProject = _.groupBy('googleProject', disks)
  const appsByProject = _.groupBy('googleProject', apps)

  // We start the first output string with an empty space because empty space would
  // not apply to the case where appType is not defined (e.g. Jupyter, RStudio).
  const forAppText = appType => !!appType ? ` for ${_.capitalize(appType)}` : ''

  const getWorkspaceCell = (namespace, name, appType, shouldWarn) => {
    return !!name ?
      h(Fragment, [
        h(Link, { href: Nav.getLink('workspace-dashboard', { namespace, name }), style: { wordBreak: 'break-word' } }, [name]),
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
    const { appType, googleProject, labels: { saturnWorkspaceNamespace = googleProject, saturnWorkspaceName } } = app
    const multipleApps = workspaceHasMultipleApps(appsByProject[googleProject], appType)
    return getWorkspaceCell(saturnWorkspaceNamespace, saturnWorkspaceName, appType, multipleApps)
  }

  const renderWorkspaceForRuntimes = runtime => {
    const { status, googleProject, labels: { saturnWorkspaceNamespace = googleProject, saturnWorkspaceName } } = runtime
    const shouldWarn = !_.includes(status, ['Deleting', 'Error']) &&
      getCurrentRuntime(runtimesByProject[googleProject]) !== runtime
    return getWorkspaceCell(saturnWorkspaceNamespace, saturnWorkspaceName, null, shouldWarn)
  }

  const getDetailsPopup = (cloudEnvName, billingId, disk, creator) => {
    return h(PopupTrigger, {
      content: div({ style: { padding: '0.5rem' } }, [
        div([strong(['Name: ']), cloudEnvName]),
        div([strong(['Billing Id: ']), billingId]),
        !shouldFilterRuntimesByCreator && div([strong(['Creator: ']), creator]),
        !!disk && div([strong(['Persistent Disk: ']), disk.name])
      ])
    }, [h(Link, ['view'])])
  }

  const renderDetailsApp = (app, disks) => {
    const { appName, diskName, googleProject } = app
    const disk = _.find({ name: diskName }, disks)
    return getDetailsPopup(appName, googleProject, disk)
  }

  const renderDetailsRuntime = (runtime, disks) => {
    const { runtimeName, cloudContext, runtimeConfig: { persistentDiskId }, auditInfo: { creator } } = runtime
    const disk = _.find({ id: persistentDiskId }, disks)
    return getDetailsPopup(runtimeName, cloudContext.cloudResource, disk, creator)
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

    const shouldShowPauseButton = isApp(compute) ?
      !_.find(tool => tool.appType && tool.appType === compute.appType)(tools)?.isPauseUnsupported :
      isPauseSupported(getToolFromRuntime(compute))

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
      isGalaxyDisk: getDiskAppType(disk) === tools.Galaxy.appType,
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

  return h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments' }),
    div({ role: 'main', style: { padding: '1rem', flexGrow: 1 } }, [
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '0 0 1rem 0', padding: 0 } }, ['Your cloud environments']),
      h(LabeledCheckbox, { checked: shouldFilterRuntimesByCreator, onChange: setShouldFilterRuntimesByCreator }, [
        span({ style: { fontWeight: 600 } }, [' Hide cloud environments you have access to but didn\'t create'])
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
                Utils.formatUSD(runtimeCost(cloudEnvironment))
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
              const { status: diskStatus, googleProject, labels: { saturnWorkspaceNamespace = googleProject, saturnWorkspaceName } } = filteredDisks[rowIndex]
              const appType = getDiskAppType(filteredDisks[rowIndex])
              const multipleDisks = multipleDisksError(disksByProject[googleProject], appType)
              return !!saturnWorkspaceName ?
                h(Fragment, [
                  h(Link, { href: Nav.getLink('workspace-dashboard', { namespace: saturnWorkspaceNamespace, name: saturnWorkspaceName }), style: { wordBreak: 'break-word' } },
                    [saturnWorkspaceName]),
                  diskStatus !== 'Deleting' && multipleDisks &&
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
              const { name, id, cloudContext } = filteredDisks[rowIndex]
              const runtime = _.find({ runtimeConfig: { persistentDiskId: id } }, runtimes)
              const app = _.find({ diskName: name }, apps)
              return h(PopupTrigger, {
                content: div({ style: { padding: '0.5rem' } }, [
                  div([strong(['Name: ']), name]),
                  div([strong(['Billing Id: ']), cloudContext.cloudResource]),
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
              return disk.status
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
      loading && spinnerOverlay
    ])
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
