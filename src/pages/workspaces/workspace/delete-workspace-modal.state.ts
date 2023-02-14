import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { reportError, withErrorReportingInModal } from 'src/libs/error'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { BaseWorkspace, isAzureWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/libs/workspace-utils'
import { isResourceDeletable } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


interface DeleteWorkspaceModalLeoApp {
  appName: string
  status: string
  cloudContext: any
}

interface DeleteWorkspaceModalLeoRuntime {
  runtimeName: string
  status: string
}


export interface WorkspaceResources {
  nonDeleteableApps: DeleteWorkspaceModalLeoApp[]
  deleteableApps: DeleteWorkspaceModalLeoApp[]
  apps: DeleteWorkspaceModalLeoApp[]
  deleteableRuntimes: DeleteWorkspaceModalLeoRuntime[]
  nonDeleteableRuntimes: DeleteWorkspaceModalLeoRuntime[]
  runtimes: DeleteWorkspaceModalLeoRuntime[]
}

export interface DeleteWorkspaceState {
  workspaceResources: WorkspaceResources | null
  loading: boolean
  deleting: boolean
  isDeleteDisabledFromResources: boolean
  workspaceBucketUsageInBytes: number | null
  collaboratorEmails: string[] | null
  hasApps: () => boolean
  hasRuntimes: () => boolean
  deleteWorkspace: () => void
  deleteWorkspaceAzureResources: () => void
  deletingAzureResources: boolean
  controlledResourcesExist: boolean
}

export interface DeleteWorkspaceHookArgs {
  workspace: BaseWorkspace
  onDismiss: () => void
  onSuccess: () => void
}


export const useDeleteWorkspaceState = (hookArgs: DeleteWorkspaceHookArgs) : DeleteWorkspaceState => {
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[] | null>()
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState<number | null>()
  const [controlledResourcesExist, setControlledResourcesExist] = useState(false)
  const [deletingAzureResources, setDeletingAzureResources] = useState(false)
  const [workspaceResources, setWorkspaceResources] = useState<WorkspaceResources | null>(null)

  const workspaceInfo: WorkspaceInfo = hookArgs.workspace.workspace
  const signal = useCancellation()
  const checkAzureResourcesTimeout = useRef<number>()

  const fetchWorkspaceResources = async (workspace: BaseWorkspace): Promise<WorkspaceResources> => {
    const apps = isGoogleWorkspace(workspace) ?
          await Ajax(signal).Apps.listWithoutProject({ role: 'creator', saturnWorkspaceName: workspaceInfo.name }) as DeleteWorkspaceModalLeoApp[] :
          await Ajax(signal).Apps.listAppsV2(workspaceInfo.workspaceId) as DeleteWorkspaceModalLeoApp[]

    // only v2 runtimes supported right now for azure
    const currentRuntimesList = isAzureWorkspace(workspace) ?
        await Ajax(signal).Runtimes.listV2WithWorkspace(workspaceInfo.workspaceId) as DeleteWorkspaceModalLeoRuntime[] : []

    const [deletableApps, nonDeletableApps] = _.partition(isResourceDeletable('app'), apps) as [DeleteWorkspaceModalLeoApp[], DeleteWorkspaceModalLeoApp[]]
    const [deletableRuntimes, nonDeletableRuntimes] = _.partition(isResourceDeletable('runtime'), currentRuntimesList) as [DeleteWorkspaceModalLeoRuntime[], DeleteWorkspaceModalLeoRuntime[]]
    return {
      nonDeleteableApps: nonDeletableApps,
      deleteableApps: deletableApps,
      apps,
      deleteableRuntimes: deletableRuntimes,
      nonDeleteableRuntimes: nonDeletableRuntimes,
      runtimes: currentRuntimesList
    }
  }

  useOnMount(() => {
    const load = _.flow(
      withErrorReportingInModal('Error checking workspace resources', hookArgs.onDismiss),
      Utils.withBusyState(setLoading)
    )(async () => {
      const appsInfo = await fetchWorkspaceResources(hookArgs.workspace)
      setWorkspaceResources(appsInfo)

      if (isGoogleWorkspace(hookArgs.workspace)) {
        const [{ acl }, { usageInBytes }] = await Promise.all([
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).getAcl(),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).bucketUsage()
        ])
        setCollaboratorEmails(_.without([getUser().email], _.keys(acl)))
        setWorkspaceBucketUsageInBytes(usageInBytes)
      } else {
        // Also temporarily disable delete if there are any controlled resources besides the expected workspace storage container.
        const controlledResources = await Ajax(signal).WorkspaceManagerResources.controlledResources(workspaceInfo.workspaceId)
        setControlledResourcesExist(controlledResources.resources.length > 1)
      }
    })
    load()

    clearTimeout(checkAzureResourcesTimeout.current)
  })

  const hasApps = () => {
    return (workspaceResources !== null && !_.isEmpty(workspaceResources.apps))
  }

  const hasRuntimes = () => {
    return (workspaceResources !== null && !_.isEmpty(workspaceResources.runtimes))
  }

  const isDeleteDisabledFromResources = workspaceResources !== null && (
    (hasApps() && !_.isEmpty(workspaceResources.nonDeleteableApps)) || (hasRuntimes() && !_.isEmpty(workspaceResources.nonDeleteableRuntimes))
  )

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      if (isGoogleWorkspace(hookArgs.workspace) && workspaceResources) {
        await Promise.all(
          _.map(async app => await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete(), workspaceResources.deleteableApps)
        )
      }

      if (workspaceResources && (workspaceResources.nonDeleteableRuntimes.length > 0 || workspaceResources.nonDeleteableApps.length > 0)) {
        reportError('Undeletable workspace', {})
        setDeleting(false)
        return
      }

      await Ajax().Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).delete()
      hookArgs.onDismiss()
      hookArgs.onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  const checkAzureResources = async () => {
    const appsInfo = await fetchWorkspaceResources(hookArgs.workspace)
    setWorkspaceResources(appsInfo)

    if (hasApps() || controlledResourcesExist) {
      checkAzureResourcesTimeout.current = window.setTimeout(() => checkAzureResources(), 5000)
    }
  }

  const deleteWorkspaceAzureResources = async () => {
    setDeletingAzureResources(true)
    try {
      if (workspaceResources && workspaceResources.nonDeleteableApps.length > 0) {
        reportError('Unable to delete apps', {})
        setDeletingAzureResources(false)
        return
      }

      if (workspaceResources && workspaceResources.nonDeleteableRuntimes.length > 0) {
        reportError('Unable to delete runtimes', {})
        setDeletingAzureResources(false)
        return
      }

      await Ajax(signal).Apps.deleteAllAppsV2(workspaceInfo.workspaceId)
      await Ajax(signal).Runtimes.runtimeV2(workspaceInfo.workspaceId).deleteAll()

      checkAzureResourcesTimeout.current = window.setTimeout(() => checkAzureResources(), 5000)
    } catch (error) {
      reportError('Error deleting workspace resources', error)
      setDeletingAzureResources(false)
    }
  }

  return {
    workspaceResources,
    loading,
    deleting,
    isDeleteDisabledFromResources,
    workspaceBucketUsageInBytes: workspaceBucketUsageInBytes !== undefined ? workspaceBucketUsageInBytes : null,
    collaboratorEmails: collaboratorEmails ? collaboratorEmails : null,
    hasApps,
    hasRuntimes,
    deleteWorkspace,
    deleteWorkspaceAzureResources,
    deletingAzureResources,
    controlledResourcesExist
  }
}
