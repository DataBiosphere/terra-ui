import { DataClientDependencies, dataClientDependencies } from 'src/dependencies/data-client-resolver'
import { Composable } from 'src/dependencies/dependency-core'
import { GoogleWorkspaceInfo, isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils'
import { AnalysisFile, getExtension, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export type AnalysisProviderDeps = {
  dataClients: Pick<DataClientDependencies, 'AzureStorage' | 'GoogleStorage'>
}

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

export type ComposableAnalysisProvider = Composable<AnalysisProviderDeps, AnalysisProviderContract>

export const AnalysisProvider: ComposableAnalysisProvider = {
  compose: (deps: AnalysisProviderDeps) => {
    const { AzureStorage, GoogleStorage } = deps.dataClients

    const provider: AnalysisProviderContract = {
      listAnalyses: async (workspaceInfo: WorkspaceInfo, signal?: AbortSignal): Promise<AnalysisFile[]> => {
        const selectedAnalyses: AnalysisFile[] =
          isGoogleWorkspaceInfo(workspaceInfo) ?
            await GoogleStorage(signal).listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName) :
            // TODO: cleanup once TS is merged in for AzureStorage module
            (await AzureStorage(signal).listNotebooks(workspaceInfo.workspaceId) as any)
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
          await GoogleStorage()
            .analysis(sourceWorkspace.googleProject, sourceWorkspace.bucketName, printName, toolLabel)
            // assumes GCP to GCP copy
            .copy(`${newName}.${getExtension(printName)}`, (targetWorkspace as GoogleWorkspaceInfo).bucketName, false)
        } else {
          await AzureStorage(signal)
            .blob(sourceWorkspace.workspaceId, printName)
            .copy(stripExtension(newName), targetWorkspace.workspaceId)
        }
      }
    }
    return provider
  },
  resolve: () => AnalysisProvider.compose({ dataClients: dataClientDependencies.get() })
}
