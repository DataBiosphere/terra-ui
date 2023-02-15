import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { reportError, withErrorReportingInModal } from 'src/libs/error'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { BaseWorkspace, isAzureWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/libs/workspace-utils'
import { isResourceDeletable } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


export const WorkspaceResourceDeletionPollRate = 5000

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
  deleteWorkspaceResources: () => void
  deletingResources: boolean
}

export interface DeleteWorkspaceHookArgs {
  workspace: BaseWorkspace
  onDismiss: () => void
  onSuccess: () => void
}


export const useDeleteWorkspaceState = (hookArgs: DeleteWorkspaceHookArgs): DeleteWorkspaceState => {
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[] | null>()
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState<number | null>()
  const [deletingResources, setDeletingResources] = useState(false)
  const [workspaceResources, setWorkspaceResources] = useState<WorkspaceResources | null>(null)

  const workspaceInfo: WorkspaceInfo = hookArgs.workspace.workspace
  const signal = useCancellation()
  const checkAzureResourcesTimeout = useRef<number>()

  const fetchWorkspaceResources = async (workspace: BaseWorkspace): Promise<WorkspaceResources> => {
    const apps = isGoogleWorkspace(workspace) ?
        await Ajax(signal).Apps.listWithoutProject({
          role: 'creator',
          saturnWorkspaceName: workspaceInfo.name
        }) as DeleteWorkspaceModalLeoApp[] :
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
    if (isDeleteDisabledFromResources) {
      throw new Error('Workspace contains non-deletable resources')
    }

    try {
      setDeleting(true)
      if (isGoogleWorkspace(hookArgs.workspace) && workspaceResources) {
        await Promise.all(
          _.map(async app => await Ajax(signal).Apps.app(app.cloudContext.cloudResource, app.appName).delete(), workspaceResources.deleteableApps)
        )
      }

      await Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).delete()
      hookArgs.onDismiss()
      hookArgs.onSuccess()
    } catch (error) {
      setDeleting(false)
      await reportError('Error deleting workspace', error)
    }
  }

  const checkAzureResources = async () => {
    console.log('Checking azure resources...') // eslint-disable-line no-console
    const appsInfo = await fetchWorkspaceResources(hookArgs.workspace)
    setWorkspaceResources(appsInfo)

    if (appsInfo.apps.length > 0 || appsInfo.runtimes.length > 0) {
      console.log('Resources still present, rescheduling check...') // eslint-disable-line no-console
      checkAzureResourcesTimeout.current = window.setTimeout(() => checkAzureResources(), WorkspaceResourceDeletionPollRate)
    } else {
      console.log('Resources gone.') // eslint-disable-line no-console
      setDeletingResources(false)
    }
  }

  const deleteWorkspaceResources = async () => {
    if (isGoogleWorkspace(hookArgs.workspace)) {
      throw new Error('Attempting to delete resources in an unsupported workspace')
    }

    if (workspaceResources && workspaceResources.nonDeleteableApps.length > 0) {
      throw new Error('Workspace contains non-deletable apps')
    }

    if (workspaceResources && workspaceResources.nonDeleteableRuntimes.length > 0) {
      throw new Error('Workspace contains non-deletable runtimes')
    }

    try {
      setDeletingResources(true)
      console.log(`Requesting app and runtime deletion for workspace ${workspaceInfo.workspaceId}`) // eslint-disable-line no-console
      await Ajax(signal).Apps.deleteAllAppsV2(workspaceInfo.workspaceId)
      await Ajax(signal).Runtimes.runtimeV2(workspaceInfo.workspaceId).deleteAll()
      console.log('Resource deletions requested, starting poll.') // eslint-disable-line no-console

      checkAzureResourcesTimeout.current = window.setTimeout(() => checkAzureResources(), WorkspaceResourceDeletionPollRate)
    } catch (error) {
      setDeletingResources(false)
      throw error
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
    deleteWorkspaceResources,
    deletingResources
  }
}
