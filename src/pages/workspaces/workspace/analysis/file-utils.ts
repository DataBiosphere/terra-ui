import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { useCancellation, useStore } from 'src/libs/react-utils'
import { workspaceStore } from 'src/libs/state'
import { LoadingState, ReadyState } from 'src/libs/type-utils/LoadedState'
import { NominalType } from 'src/libs/type-utils/type-helpers'
import * as Utils from 'src/libs/utils'
import {
  CloudProviderType,
  isGoogleWorkspaceInfo,
  WorkspaceWrapper
} from 'src/libs/workspace-utils'
import { runtimeTools, ToolLabel, toolToExtensionMap } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export type FileName = NominalType<string, 'FileName'> // represents a file with an extension and no path, eg `dir/file.ipynb` =>  `file.ipynb`
export type AbsolutePath = NominalType<string, 'AbsolutePath'> // represents an absolute path in the context of a cloud storage directory structure, i.e. `dir/file.ipynb`
export type Extension = NominalType<string, 'Extension'> // represents the substring found after the last dot in a file, eg `dir/file.txt.ipynb` => `ipynb`
export type DisplayName = NominalType<string, 'DisplayName'> // represents the name of a file without an extension or pathing eg `dir/file.ipynb`=> `file`

// removes all paths up to and including the last slash, eg dir/file.ipynb` => `file.ipynb`
export const getFileName = (path: string): FileName => _.flow(_.split('/'), _.last)(path) as FileName

export const getExtension = (path: string): Extension => _.flow(_.split('.'), _.last)(path) as Extension

// ex abs/file.ipynb -> abs/file
export const stripExtension = (path: string): string => _.replace(/\.[^/.]+$/, '', path)

// removes leading dirs and a file ext suffix on paths eg `dir/file.ipynb`=> `file`
export const getDisplayName = (path: string): DisplayName => _.flow(getFileName, stripExtension)(path) as DisplayName

export interface AnalysisFileMetadata {
  lockExpiresAt: string
  lastLockedBy: string
  hashedOwnerEmail?: string
}

export interface AnalysisFile {
  name: AbsolutePath
  ext: Extension
  displayName: DisplayName
  fileName: FileName
  lastModified: number
  tool: ToolLabel
  cloudProvider: CloudProviderType
  // We only populate this for google files to handle file syncing
  // If there is a differentiation for Azure, we should add sub-types
  metadata?: AnalysisFileMetadata
}

export interface AnalysisFileStore {
  refresh: () => Promise<void>
  create: (fullAnalysisName: String, toolLabel: ToolLabel, contents: String) => Promise<void>
  // status: String
  loadedState: LoadingState<AnalysisFile[]> | ReadyState<AnalysisFile[]>
}

export const useAnalysisFiles = (): AnalysisFileStore => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const workspace: WorkspaceWrapper = useStore(workspaceStore)
  const [analyses, setAnalyses] = useState<AnalysisFile[]>([])
  const refresh: () => Promise<void> = _.flow(
    // @ts-expect-error
    withErrorReporting('Error loading analysis files'),
    Utils.withBusyState(setLoading)
  )(async (): Promise<void> => {
    const workspaceInfo = workspace.workspace
    const existingAnalyses: AnalysisFile[] = isGoogleWorkspaceInfo(workspaceInfo) ?
      await Ajax(signal).Buckets.listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName) :
      await Ajax(signal).AzureStorage.listNotebooks(workspaceInfo.workspaceId)
    setAnalyses(existingAnalyses)
  }) as () => Promise<void>

  const create: (fullAnalysisName: any, toolLabel: ToolLabel, contents: any) => Promise<void> = _.flow(
    // @ts-expect-error
    withErrorReporting('Error creating analysis files'),
    Utils.withBusyState(setLoading)
  )(async (fullAnalysisName: any, toolLabel: ToolLabel, contents: any): Promise<void> => {
    const workspaceInfo = workspace.workspace
    isGoogleWorkspaceInfo(workspaceInfo) ?
      await Ajax().Buckets.analysis(workspaceInfo.googleProject, workspaceInfo.bucketName, fullAnalysisName, toolLabel).create(contents) :
      await Ajax().AzureStorage.blob(workspaceInfo.workspaceId, fullAnalysisName).create(contents)
  }) as () => Promise<void>

  useEffect(() => {
    refresh()
  }, [workspace]) // eslint-disable-line react-hooks/exhaustive-deps
  return { refresh, create, loadedState: { status: loading ? 'Loading' : 'Ready', state: analyses } }
}

export const notebookLockHash = (bucketName: string, email: string): Promise<string> => Utils.sha256(`${bucketName}:${email}`)

//TODO: this should take the workspace wrapper not destructure, redo when we convert analysis.js
export const findPotentialNotebookLockers = async ({ canShare, namespace, workspaceName, bucketName }) => {
  if (!canShare) {
    return {}
  }
  const { acl } = await Ajax().Workspaces.workspace(namespace, workspaceName).getAcl()
  const potentialLockers = _.flow(
    _.toPairs,
    _.map(([email, data]) => ({ email, ...data })),
    // @ts-expect-error
    _.filter(({ accessLevel }) => Utils.hasAccessLevel('WRITER', accessLevel))
  )(acl)
  const lockHolderPromises = _.map(async ({ email }) => {
    const lockHash = await notebookLockHash(bucketName, email)
    return { [lockHash]: email }
  }, potentialLockers)
  return _.mergeAll(await Promise.all(lockHolderPromises))
}

export const addExtensionToNotebook = (name: string): string => `${name}.${runtimeTools.Jupyter.defaultExt}`

export const getAnalysisFileExtension = (toolLabel: ToolLabel): Extension => toolToExtensionMap[toolLabel]
