import { Ajax } from 'src/libs/ajax';
import { MethodConfiguration } from 'src/libs/ajax/workspaces/workspace-models';
import { WorkspaceInfo } from 'src/workspaces/utils';

export interface ExportWorkflowToWorkspaceProvider {
  export: (destWorkspace: WorkspaceInfo, destWorkflowName: string) => Promise<void>;
}

/**
 * Create a provider to export a workflow (with its configuration) from one
 * workspace to another.
 *
 * The current and destination workspaces can be the same or different.
 *
 * @param {WorkspaceInfo} currentWorkspace - the workspace the workflow to be
 * exported is currently in.
 * @param {MethodConfiguration} methodConfig - the method configuration to be
 * exported.
 */
export const makeExportWorkflowFromWorkspaceProvider = (
  currentWorkspace: WorkspaceInfo,
  methodConfig: MethodConfiguration
): ExportWorkflowToWorkspaceProvider => {
  return {
    export: (destWorkspace: WorkspaceInfo, destWorkflowName: string) =>
      Ajax()
        .Workspaces.workspace(currentWorkspace.namespace, currentWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: destWorkspace.namespace,
          destConfigName: destWorkflowName,
          workspaceName: {
            namespace: destWorkspace.namespace,
            name: destWorkspace.name,
          },
        }),
  };
};
