import { AnalysisFile } from 'src/analysis/useAnalysisFiles';
import { AbsolutePath, getExtension, getFileName, stripExtension } from 'src/analysis/utils/file-utils';
import { getToolLabelFromFileExtension, ToolLabel } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { GoogleWorkspaceInfo, isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils';

export interface AnalysisProviderContract {
  listAnalyses: (workspaceInfo: WorkspaceInfo, signal?: AbortSignal) => Promise<AnalysisFile[]>;
  copyAnalysis: (
    sourceWorkspace: WorkspaceInfo,
    printName: string,
    toolLabel: ToolLabel,
    targetWorkspace: WorkspaceInfo,
    newName: string,
    signal?: AbortSignal
  ) => Promise<void>;
  createAnalysis: (
    workspaceInfo: WorkspaceInfo,
    fullAnalysisName: string,
    toolLabel: ToolLabel,
    contents: any,
    signal?: AbortSignal
  ) => Promise<void>;
  deleteAnalysis: (workspaceInfo: WorkspaceInfo, path: AbsolutePath, signal?: AbortSignal) => Promise<void>;
}

export const AnalysisProvider: AnalysisProviderContract = {
  listAnalyses: async (workspaceInfo: WorkspaceInfo, signal?: AbortSignal): Promise<AnalysisFile[]> => {
    const selectedAnalyses: AnalysisFile[] = isGoogleWorkspaceInfo(workspaceInfo)
      ? await Ajax(signal).Buckets.listAnalyses(workspaceInfo.googleProject, workspaceInfo.bucketName)
      : // TODO: cleanup once TS is merged in for AzureStorage module
        ((await Ajax(signal).AzureStorage.listNotebooks(workspaceInfo.workspaceId)) as any);
    return selectedAnalyses;
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
      await Ajax(signal)
        .Buckets.analysis(sourceWorkspace.googleProject, sourceWorkspace.bucketName, printName, toolLabel)
        // assumes GCP to GCP copy
        .copy(`${newName}.${getExtension(printName)}`, (targetWorkspace as GoogleWorkspaceInfo).bucketName, false);
    } else {
      await Ajax(signal)
        .AzureStorage.blob(sourceWorkspace.workspaceId, printName)
        .copy(stripExtension(newName), targetWorkspace.workspaceId);
    }
  },
  createAnalysis: async (
    workspaceInfo: WorkspaceInfo,
    fullAnalysisName: string,
    toolLabel: ToolLabel,
    contents: any,
    signal?: AbortSignal
  ): Promise<void> => {
    isGoogleWorkspaceInfo(workspaceInfo)
      ? await Ajax(signal)
          .Buckets.analysis(workspaceInfo.googleProject, workspaceInfo.bucketName, fullAnalysisName, toolLabel)
          .create(contents)
      : await Ajax(signal).AzureStorage.blob(workspaceInfo.workspaceId, fullAnalysisName).create(contents);
  },
  deleteAnalysis: async (workspaceInfo: WorkspaceInfo, path: AbsolutePath, signal?: AbortSignal): Promise<void> => {
    isGoogleWorkspaceInfo(workspaceInfo)
      ? await Ajax(signal)
          .Buckets.analysis(
            workspaceInfo.googleProject,
            workspaceInfo.bucketName,
            getFileName(path),
            getToolLabelFromFileExtension(getExtension(path))
          )
          .delete()
      : await Ajax(signal).AzureStorage.blob(workspaceInfo.workspaceId, getFileName(path)).delete();
  },
};
