import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { locationTypes } from 'src/components/region-common'
import { updateRecentlyViewedWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { responseContainsRequesterPaysError } from 'src/libs/ajax/ajax-common'
import { saToken } from 'src/libs/ajax/GoogleStorage'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { clearNotification, notify } from 'src/libs/notifications'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { getUser, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { differenceFromNowInSeconds } from 'src/libs/utils'
import { isAzureWorkspace, isGoogleWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils'
import { defaultLocation } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


interface StorageDetails {
  googleBucketLocation: string // historically returns defaultLocation if cannot be retrieved or Azure
  googleBucketType: string // historically returns locationTypes.default if cannot be retrieved or Azure
  azureContainerRegion: string|undefined
  azureContainerUrl: string|undefined
  azureContainerSasUrl: string|undefined
}

export type InitializedWorkspaceWrapper = WorkspaceWrapper & { workspaceInitialized: boolean }

interface WorkspaceDetails {
  workspace: InitializedWorkspaceWrapper
  accessError: boolean
  loadingWorkspace: boolean
  storageDetails: StorageDetails
  refreshWorkspace: () => {}
}

export const GOOGLE_PERMISSIONS_RECHECK_RATE = 15000
export const AZURE_BUCKET_RECHECK_RATE = 5000

export const useWorkspace = (namespace, name) : WorkspaceDetails => {
  const [accessError, setAccessError] = useState(false)
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)
  const accessNotificationId = useRef()
  const cachedWorkspace = useStore(workspaceStore)
  const workspace = cachedWorkspace && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedWorkspace.workspace)) ? cachedWorkspace : undefined
  const [{ location, locationType }, setGoogleStorage] = useState({
    location: defaultLocation, locationType: locationTypes.default // These default types are historical
  })
  const [azureStorage, setAzureStorage] = useState<{ location: string; storageContainerUrl: string | undefined; sasUrl: string }>()
  const workspaceInitialized = workspace?.workspaceInitialized // will be stored in cached workspace

  const signal = useCancellation()
  const checkInitializationTimeout = useRef<any>()

  const updateWorkspaceInStore = (workspace, initialized) => {
    workspace.workspaceInitialized = initialized
    // clone the workspace to force React to re-render components that depend on workspace
    workspaceStore.set(_.clone(workspace))
  }

  const checkWorkspaceInitialization = async workspace => {
    if (!!workspace && !workspaceInitialized) {
      if (isGoogleWorkspace(workspace)) {
        await checkGooglePermissions(workspace)
      } else {
        await checkAzureStorageExists(workspace)
      }
    } else if (!!workspace && isGoogleWorkspace(workspace)) {
      // console.log('Google, skipping permissions initialization check')
      await loadGoogleBucketLocation(workspace)
    } else if (!!workspace && isAzureWorkspace(workspace)) {
      // console.log('Azure, skipping storage initialization check')
      await loadAzureStorageDetails(workspace)
    }
  }

  const checkGooglePermissions = async workspace => {
    try {
      await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketReadAccess()
      // console.log('got success status!!!!!!')
      updateWorkspaceInStore(workspace, true)
      loadGoogleBucketLocation(workspace)
    } catch (error) {
      // @ts-ignore
      const errorText = await error.text()
      if (responseContainsRequesterPaysError(errorText)) {
        updateWorkspaceInStore(workspace, true)
      } else {
        updateWorkspaceInStore(workspace, false)
        console.log('Google permissions are still syncing') // eslint-disable-line no-console
        checkInitializationTimeout.current = setTimeout(() => checkWorkspaceInitialization(workspace), GOOGLE_PERMISSIONS_RECHECK_RATE)
      }
    }
  }

  // Note that withErrorIgnoring is used because checkBucketLocation will error for requester pays workspaces.
  const loadGoogleBucketLocation = withErrorIgnoring(async workspace => {
    const storageDetails = await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketLocation(workspace.workspace.googleProject, workspace.workspace.bucketName)
    // console.log(`setting bucketLocation ${storageDetails.location}`)
    setGoogleStorage(storageDetails)
  })

  const storeAzureStorageDetails = azureStorageDetails => {
    const { location, sas } = azureStorageDetails
    const sasUrl = sas.url
    setAzureStorage({ storageContainerUrl: _.head(_.split('?', sasUrl)), location, sasUrl })
  }

  const checkAzureStorageExists = async workspace => {
    try {
      storeAzureStorageDetails(await Ajax(signal).AzureStorage.details(workspace.workspace.workspaceId))
      // console.log('got success status!!!!!!')
      updateWorkspaceInStore(workspace, true)
    } catch (error) {
      updateWorkspaceInStore(workspace, false)
      // We expect to get a transient error while the workspace is cloning. We will improve
      // the handling of this with WOR-534 so that we correctly differentiate between the
      // expected transient error and a workspace that is truly missing a storage container.
      console.log(`Error thrown by AzureStorage.details: ${error}`) // eslint-disable-line no-console
      checkInitializationTimeout.current = setTimeout(() => checkWorkspaceInitialization(workspace), AZURE_BUCKET_RECHECK_RATE)
    }
  }

  const loadAzureStorageDetails = withErrorReporting('Error loading storage information', async workspace => {
    storeAzureStorageDetails(await Ajax(signal).AzureStorage.details(workspace.workspace.workspaceId))
  })

  const refreshWorkspace = _.flow(withErrorReporting('Error loading workspace'), Utils.withBusyState(setLoadingWorkspace))(async () => {
    try {
      const workspace = await Ajax(signal).Workspaces.workspace(namespace, name).details([
        'accessLevel', 'azureContext', 'canCompute', 'canShare', 'owners',
        'workspace', 'workspace.attributes', 'workspace.authorizationDomain', 'workspace.cloudPlatform',
        'workspace.isLocked', 'workspace.workspaceId', 'workspaceSubmissionStats'
      ])
      updateWorkspaceInStore(workspace, workspaceInitialized)
      updateRecentlyViewedWorkspaces(workspace.workspace.workspaceId)

      const { accessLevel, workspace: { createdBy, createdDate, googleProject } } = workspace

      checkWorkspaceInitialization(workspace)

      // Request a service account token. If this is the first time, it could take some time before everything is in sync.
      // Doing this now, even though we don't explicitly need it now, increases the likelihood that it will be ready when it is needed.
      if (Utils.canWrite(accessLevel) && isGoogleWorkspace(workspace)) {
        saToken(googleProject)
      }

      // This is old code-- it is unclear if this case can actually happen anymore.
      if (!Utils.isOwner(accessLevel) && (createdBy === getUser().email) && (differenceFromNowInSeconds(createdDate) < 60)) {
        accessNotificationId.current = notify('info', 'Workspace access synchronizing', {
          message: h(Fragment, [
            'It looks like you just created this workspace. It may take up to a minute before you have access to modify it. Refresh at any time to re-check.',
            div({ style: { marginTop: '1rem' } }, [h(Link, {
              onClick: () => {
                refreshWorkspace()
                clearNotification(accessNotificationId.current)
              }
            }, ['Click to refresh now'])])
          ])
        })
      }
    } catch (error) {
      // @ts-ignore
      if (error.status === 404) {
        setAccessError(true)
      } else {
        throw error
      }
    }
  })

  useOnMount(() => {
    if (!workspace) {
      refreshWorkspace()
    } else {
      checkWorkspaceInitialization(workspace)
    }
    return () => clearTimeout(checkInitializationTimeout.current)
  })

  const storageDetails = {
    googleBucketLocation: location,
    googleBucketType: locationType,
    azureContainerRegion: azureStorage?.location,
    azureContainerUrl: azureStorage?.storageContainerUrl,
    azureContainerSasUrl: azureStorage?.sasUrl
  }

  return { workspace, accessError, loadingWorkspace, storageDetails, refreshWorkspace }
}
