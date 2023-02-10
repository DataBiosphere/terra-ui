import _ from 'lodash/fp'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { reportError, withErrorReportingInModal } from 'src/libs/error'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { BaseWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/libs/workspace-utils'
import { isResourceDeletable } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


export interface DeleteWorkspaceState {
  loading: boolean
  deleting: boolean
  isDeleteDisabledFromResources: boolean
  workspaceBucketUsageInBytes: any
  deletableApps: any
  nonDeletableApps: any
  collaboratorEmails: any
  hasApps: () => boolean
  deleteWorkspace: () => void
  controlledResourcesExist: boolean
}


export const useDeleteWorkspaceState = (workspace: BaseWorkspace, onDismiss: () => void, onSuccess: () => void) : DeleteWorkspaceState => {
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apps, setApps] = useState()
  const [collaboratorEmails, setCollaboratorEmails] = useState()
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState()
  const [controlledResourcesExist, setControlledResourcesExist] = useState(false)
  const [deletableApps, nonDeletableApps] = _.partition(isResourceDeletable('app'), apps) as any // TODO fix this

  const workspaceInfo: WorkspaceInfo = workspace.workspace
  const signal = useCancellation()

  useOnMount(() => {
    const load = _.flow(
      withErrorReportingInModal('Error checking workspace resources', onDismiss),
      Utils.withBusyState(setLoading)
    )(async () => {
      if (isGoogleWorkspace(workspace)) {
        const [currentWorkspaceAppList, { acl }, { usageInBytes }] = await Promise.all([
          Ajax(signal).Apps.listWithoutProject({ role: 'creator', saturnWorkspaceName: workspaceInfo.name }),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).getAcl(),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).bucketUsage()
        ])
        setApps(currentWorkspaceAppList)

        // @ts-ignore
        setCollaboratorEmails(_.without([getUser().email], _.keys(acl)))
        setWorkspaceBucketUsageInBytes(usageInBytes)
      } else {
        const currentWorkspaceAppList = await Ajax(signal).Apps.listAppsV2(workspaceInfo.workspaceId)
        // temporary hack to prevent orphaning resources on Azure:
        // change each app to status: 'disallow' which will cause this modal to think they are undeletable
        const hackedAppList = _.map(_.set('status', 'disallow'), currentWorkspaceAppList)
        // TODO fix this
        // @ts-ignore
        setApps(hackedAppList)
        // Also temporarily disable delete if there are any controlled resources besides the expected workspace storage container.
        const controlledResources = await Ajax(signal).WorkspaceManagerResources.controlledResources(workspaceInfo.workspaceId)
        setControlledResourcesExist(controlledResources.resources.length > 1)
      }
    })
    load()
  })

  const hasApps = () => {
    return deletableApps !== undefined && nonDeletableApps !== undefined &&
        (!_.isEmpty(deletableApps) ||
            !_.isEmpty(nonDeletableApps))
  }

  const isDeleteDisabledFromResources = (hasApps() && !_.isEmpty(nonDeletableApps)) || controlledResourcesExist

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      if (isGoogleWorkspace(workspace)) {
        await Promise.all(
          _.map(async app => await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete(), deletableApps)
        )
      }
      await Ajax().Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).delete()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  return {
    loading,
    deleting,
    isDeleteDisabledFromResources,
    workspaceBucketUsageInBytes,
    deletableApps,
    nonDeletableApps,
    collaboratorEmails,
    hasApps,
    deleteWorkspace,
    controlledResourcesExist
  }
}
