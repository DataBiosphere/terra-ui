import _ from 'lodash/fp'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import {
  runtimeTools,
  ToolLabel,
  toolToExtensionMap
} from 'src/pages/workspaces/workspace/analysis/tool-utils'
import {
  CloudProviderType,
  isGoogleWorkspaceInfo,
  WorkspaceWrapper
} from 'src/pages/workspaces/workspace/workspace-utils'

// This syntax gives us nominal typing
// Nominal types are not interchangable even if the underlying type is the same
// A func that takes (a: A, b: B) where A and B are both strings cannot be called like (b,a) with this restriction
export type NominalType<BaseType, Name extends string> = BaseType & { __typeToken: Name }

export type FileName = NominalType<string, 'FileName'> // represents a file with an extension and no path, eg `dir/file.ipynb` =>  `file.ipynb`
export type AbsolutePath = NominalType<string, 'AbsolutePath'> // represents an absolute path in the context of a cloud storage directory structure, i.e. `dir/file.ipynb`
export type Extension = NominalType<string, 'Extension'> // represents the substring found after the last dot in a file, eg `dir/file.txt.ipynb` => `ipynb`
export type DisplayName = NominalType<string, 'DisplayName'> // represents the name of a file without an extension or pathing eg `dir/file.txt.ipynb`=> `dir/file.txt`

// removes all paths up to and including the last slash
export const getFileName = (path: string): FileName => _.flow(_.split('/'), _.last)(path) as FileName

export const getExtension = (path: string): Extension => _.flow(_.split('.'), _.last)(path) as Extension

// ex abs/file.ipynb -> abs/file
export const stripExtension = (path: string): string => _.replace(/\.[^/.]+$/, '', path)

// removes leading dirs and a file ext suffix on paths
export const getDisplayName = (path: string): DisplayName => _.flow(getFileName, stripExtension)(path) as DisplayName

export interface FileMetadata {
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
  metadata?: FileMetadata
}

export const analysisFilesStore = Utils.atom()

export interface AnalysisFileStore {
  analyses: AnalysisFile[],
  refresh: unknown //TODO: How can we better type this
  loading: boolean
}

export const useAnalysisFiles = (): AnalysisFileStore => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const workspace: WorkspaceWrapper = useStore(workspaceStore)
  const analyses: AnalysisFile[] = useStore(analysisFilesStore)
  const refresh = _.flow(
    // @ts-ignore
    withErrorReporting('Error loading analysis files'),
    Utils.withBusyState(setLoading)
  )(async (): Promise<void> => {
    const workspaceInfo = workspace.workspace
    const existingAnalyses: AnalysisFile[] = isGoogleWorkspaceInfo(workspaceInfo) ?
      await Ajax(signal).Buckets.listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName) :
      await Ajax(signal).AzureStorage.listNotebooks(workspaceInfo.workspaceId)
    const existingNames: DisplayName[] = _.map(({ fileName }) => getDisplayName(fileName), existingAnalyses)
    analysisFilesStore.set(existingNames)
  })
  useOnMount(() => {
    // @ts-ignore
    refresh()
  })
  return { analyses, refresh, loading }
}

export const notebookLockHash = (bucketName: string, email: string): Promise<string> => Utils.sha256(`${bucketName}:${email}`)

//TODO: this should take the workspace wrapper not destructure, redo when we convert analysis.js
export const findPotentialNotebookLockers = async ({ canShare, namespace, workspaceName, bucketName }) => {
  if (canShare) {
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
  } else {
    return {}
  }
}

export const addExtensionToNotebook = (name: string): string => `${name}.${runtimeTools.Jupyter.defaultExt}`

export const getAnalysisFileExtension = (toolLabel: ToolLabel): Extension => toolToExtensionMap[toolLabel]
