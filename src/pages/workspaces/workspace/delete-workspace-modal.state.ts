import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { reportError, withErrorReportingInModal } from 'src/libs/error'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { BaseWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/libs/workspace-utils'
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

export interface DeleteWorkspaceState {
  loading: boolean
  deleting: boolean
  isDeleteDisabledFromResources: boolean
  isDeleteDisabledFromLeoResources: boolean
  workspaceBucketUsageInBytes: number | null
  deletableApps: DeleteWorkspaceModalLeoApp[]
  nonDeletableApps: DeleteWorkspaceModalLeoApp[]
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
  const [apps, setApps] = useState<DeleteWorkspaceModalLeoApp[]>()
  const [runtimes, setRuntimes] = useState<DeleteWorkspaceModalLeoRuntime[]>()
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[] | null>()
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState<number | null>()
  const [controlledResourcesExist, setControlledResourcesExist] = useState(false)
  const [deletableApps, nonDeletableApps] = _.partition(isResourceDeletable('app'), apps) as [DeleteWorkspaceModalLeoApp[], DeleteWorkspaceModalLeoApp[]]
  const [deletingAzureResources, setDeletingAzureResources] = useState(false)
  const [deletableRuntimes, nonDeletableRuntimes] = _.partition(isResourceDeletable('runtime'), runtimes) as [DeleteWorkspaceModalLeoRuntime[], DeleteWorkspaceModalLeoRuntime[]]

  const workspaceInfo: WorkspaceInfo = hookArgs.workspace.workspace
  const signal = useCancellation()
  const checkAzureResourcesTimeout = useRef<number>()

  useOnMount(() => {
    const load = _.flow(
      withErrorReportingInModal('Error checking workspace resources', hookArgs.onDismiss),
      Utils.withBusyState(setLoading)
    )(async () => {
      if (isGoogleWorkspace(hookArgs.workspace)) {
        const [currentWorkspaceAppList, { acl }, { usageInBytes }] = await Promise.all([
          Ajax(signal).Apps.listWithoutProject({ role: 'creator', saturnWorkspaceName: workspaceInfo.name }),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).getAcl(),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).bucketUsage()
        ])
        setApps(currentWorkspaceAppList)
        setCollaboratorEmails(_.without([getUser().email], _.keys(acl)))
        setWorkspaceBucketUsageInBytes(usageInBytes)
      } else {
        const currentWorkspaceAppList = await Ajax(signal).Apps.listAppsV2(workspaceInfo.workspaceId)
        const currentRuntimesList = await Ajax(signal).Runtimes.listV2WithWorkspace(workspaceInfo.workspaceId)

        setApps(currentWorkspaceAppList)
        setRuntimes(currentRuntimesList)
        // Also temporarily disable delete if there are any controlled resources besides the expected workspace storage container.
        const controlledResources = await Ajax(signal).WorkspaceManagerResources.controlledResources(workspaceInfo.workspaceId)
        setControlledResourcesExist(controlledResources.resources.length > 1)
      }
    })
    load()
    clearTimeout(checkAzureResourcesTimeout.current)
  })

  const hasApps = () => {
    return deletableApps !== undefined && nonDeletableApps !== undefined &&
        (!_.isEmpty(deletableApps) ||
            !_.isEmpty(nonDeletableApps))
  }

  const hasRuntimes = () => {
    return deletableRuntimes !== undefined && nonDeletableRuntimes !== undefined &&
        (!_.isEmpty(deletableRuntimes) ||
            !_.isEmpty(nonDeletableRuntimes))
  }

  const isDeleteDisabledFromResources = (hasApps() && !_.isEmpty(nonDeletableApps))
  const isDeleteDisabledFromLeoResources = (hasRuntimes() && !_.isEmpty(nonDeletableRuntimes)) || (isDeleteDisabledFromResources)

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      if (isGoogleWorkspace(hookArgs.workspace)) {
        await Promise.all(
          _.map(async app => await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete(), deletableApps)
        )
      }

      if (nonDeletableRuntimes.length > 0 || nonDeletableApps.length > 0) {
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

  const checkAzureResources = () => {
    if (hasApps() || controlledResourcesExist) {
      checkAzureResourcesTimeout.current = window.setTimeout(() => checkAzureResources(), 5000)
    }
  }

  const deleteWorkspaceAzureResources = async () => {
    setDeletingAzureResources(true)
    try {
      if (nonDeletableApps.length > 0) {
        reportError('Unable to delete apps', {})
        setDeletingAzureResources(false)
        return
      }

      if (nonDeletableRuntimes.length > 0) {
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
    loading,
    deleting,
    isDeleteDisabledFromResources,
    isDeleteDisabledFromLeoResources,
    workspaceBucketUsageInBytes: workspaceBucketUsageInBytes !== undefined ? workspaceBucketUsageInBytes : null,
    deletableApps,
    nonDeletableApps,
    collaboratorEmails: collaboratorEmails ? collaboratorEmails : null,
    hasApps,
    hasRuntimes,
    deleteWorkspace,
    deleteWorkspaceAzureResources,
    deletingAzureResources,
    controlledResourcesExist
  }
}
