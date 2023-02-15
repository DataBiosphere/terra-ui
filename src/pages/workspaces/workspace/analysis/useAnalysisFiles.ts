import { useEffect, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { reportError, withErrorReporting } from 'src/libs/error'
import { useCancellation, useStore } from 'src/libs/react-utils'
import { workspaceStore } from 'src/libs/state'
import LoadedState from 'src/libs/type-utils/LoadedState'
import { withHandlers } from 'src/libs/type-utils/lodash-fp-helpers'
import * as Utils from 'src/libs/utils'
import {CloudProvider, cloudProviderTypes, isGoogleWorkspaceInfo, WorkspaceWrapper} from 'src/libs/workspace-utils'
import {
  AbsolutePath,
  DisplayName,
  FileExtension,
  FileName,
  getDisplayName,
  getExtension,
  getFileName
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { getToolLabelFromFileExtension, ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export interface AnalysisFileMetadata {
  lockExpiresAt: string
  lastLockedBy: string
  hashedOwnerEmail?: string
}

export interface AnalysisFile {
  name: AbsolutePath
  ext: FileExtension
  displayName: DisplayName
  fileName: FileName
  lastModified: number
  tool: ToolLabel
  cloudProvider: CloudProvider
  // We only populate this for google files to handle file syncing
  // If there is a differentiation for Azure, we should add sub-types
  metadata?: AnalysisFileMetadata
}

export type CreateAnalysisFn = (fullAnalysisName: string, toolLabel: ToolLabel, contents: any) => Promise<void>

export interface AnalysisFileStore {
  refreshFileStore: () => Promise<void>
  loadedState: LoadedState<AnalysisFile[], unknown>
  create: CreateAnalysisFn
  deleteFile: (path: AbsolutePath) => Promise<void>
  pendingCreate: LoadedState<true, unknown>
  pendingDelete: LoadedState<true, unknown>
}

export const useAnalysisFiles = (): AnalysisFileStore => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const workspace: WorkspaceWrapper = useStore(workspaceStore)
  const [analyses, setAnalyses] = useState<AnalysisFile[]>([])
  const [pendingCreate, setPendingCreate] = useLoadedData<true>()
  const [pendingDelete, setPendingDelete] = useLoadedData<true>()

  const refresh = withHandlers([
    withErrorReporting('Error loading analysis files'),
    Utils.withBusyState(setLoading)
  ], async (): Promise<void> => {
    const workspaceInfo = workspace.workspace
    const existingAnalyses: AnalysisFile[] = isGoogleWorkspaceInfo(workspaceInfo) ?
      await Ajax(signal).Buckets.listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName) :
      await Ajax(signal).AzureStorage.listNotebooks(workspaceInfo.workspaceId)
    setAnalyses(existingAnalyses)
  })

  const create = async (fullAnalysisName: string, toolLabel: ToolLabel, contents: any): Promise<void> => {
    await setPendingCreate(async () => {
      const workspaceInfo = workspace.workspace
      isGoogleWorkspaceInfo(workspaceInfo) ?
        await Ajax().Buckets.analysis(workspaceInfo.googleProject, workspaceInfo.bucketName, fullAnalysisName, toolLabel).create(contents) :
        await Ajax().AzureStorage.blob(workspaceInfo.workspaceId, fullAnalysisName).create(contents)
      await refresh()
      return true
    })
  }

  const deleteFile = async (path: AbsolutePath): Promise<void> => {
    await setPendingDelete(async () => {
      const workspaceInfo = workspace.workspace
      if (isGoogleWorkspaceInfo(workspaceInfo)) {
        await Ajax().Buckets.analysis(
          workspaceInfo.googleProject,
          workspaceInfo.bucketName,
          getFileName(path),
          getToolLabelFromFileExtension(getExtension(path))
        ).delete()
      } else {
        await Ajax(signal).AzureStorage.blob(workspaceInfo.workspaceId, getFileName(path)).delete()
      }
      await refresh()
      return true
    })
  }

  useEffect(() => {
    refresh()
  }, [workspace]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pendingCreate.status === 'Error') {
      reportError('Error creating Analysis file.', pendingCreate.error)
    }
  }, [pendingCreate])

  useEffect(() => {
    if (pendingDelete.status === 'Error') {
      reportError('Error deleting Analysis file.', pendingDelete.error)
    }
  }, [pendingDelete])
  return {
    refreshFileStore: refresh,
    create,
    deleteFile,
    loadedState: { status: loading ? 'Loading' : 'Ready', state: analyses },
    pendingCreate,
    pendingDelete
  }
}

// This is mainly a test utility in its current form
// AnalysisFile objects should not usually be constructed with this in app code, as the lastModified date is set to the current time
export const getFileFromPath = (abs: AbsolutePath, cloudProvider: CloudProvider = cloudProviderTypes.GCP): AnalysisFile => ({
  name: abs,
  ext: getExtension(abs),
  displayName: getDisplayName(abs),
  fileName: getFileName(abs),
  tool: getToolLabelFromFileExtension(getExtension(abs)) as ToolLabel,
  lastModified: new Date().getTime(),
  cloudProvider
})
