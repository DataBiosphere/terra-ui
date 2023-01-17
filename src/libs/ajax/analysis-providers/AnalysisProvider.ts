import { Ajax } from 'src/libs/ajax'
import { GoogleWorkspaceInfo, isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils'
import { AnalysisFile, getExtension, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export interface AnalysisProviderContract {
  listAnalyses: (workspaceInfo: WorkspaceInfo, signal?: AbortSignal) => Promise<AnalysisFile[]>
  copyAnalysis: (
      sourceWorkspace: WorkspaceInfo,
      printName: string,
      toolLabel: ToolLabel,
      targetWorkspace: WorkspaceInfo,
      newName: string,
      signal?: AbortSignal
  ) => Promise<void>
}

export const AnalysisProvider: AnalysisProviderContract = {
  listAnalyses: async (workspaceInfo: WorkspaceInfo, signal?: AbortSignal): Promise<AnalysisFile[]> => {
    const selectedAnalyses: AnalysisFile[] = isGoogleWorkspaceInfo(workspaceInfo) ?
      await Ajax(signal).Buckets.listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName) :
    // TODO: cleanup once TS is merged in for AzureStorage module
      (await Ajax(signal).AzureStorage.listNotebooks(workspaceInfo.workspaceId) as any)
    return selectedAnalyses
  },
  copyAnalysis: async (
    sourceWorkspace: WorkspaceInfo,
    printName: string,
    toolLabel: ToolLabel,
    targetWorkspace: WorkspaceInfo,
    newName: string,
    signal?: AbortSignal
  ): Promise<void> => {
    if (isGoogleWorkspaceInfo(sourceWorkspace)) {
      await Ajax()
        .Buckets
        .analysis(sourceWorkspace.googleProject, sourceWorkspace.bucketName, printName, toolLabel)
      // assumes GCP to GCP copy
        .copy(`${newName}.${getExtension(printName)}`, (targetWorkspace as GoogleWorkspaceInfo).bucketName, false)
    } else {
      await Ajax(signal).AzureStorage
        .blob(sourceWorkspace.workspaceId, printName)
        .copy(stripExtension(newName), targetWorkspace.workspaceId)
    }
  }
}
