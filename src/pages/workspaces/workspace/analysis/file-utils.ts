import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { CloudProviderType } from 'src/libs/ajax/ajax-common'
import { NominalType } from 'src/libs/type-utils/type-helpers'
import * as Utils from 'src/libs/utils'
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
  metadata?: AnalysisFileMetadata
}

export const analysisFilesStore = Utils.atom()

export interface AnalysisFileStore {
  analyses: AnalysisFile[]
  refresh: unknown //TODO: How can we better type this
  loading: boolean
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
