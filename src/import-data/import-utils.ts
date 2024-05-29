import { canWrite, getCloudProviderFromWorkspace, isProtectedWorkspace, WorkspaceWrapper } from 'src/workspaces/utils';

import { getRequiredCloudPlatform, requiresSecurityMonitoring } from './import-requirements';
import { ImportRequest } from './import-types';

export type ImportOptions = {
  /** Authorization domain requested for destination workspace. */
  requiredAuthorizationDomain?: string;
};

/**
 * Returns a function to filter workspaces to available destinations for an import.
 *
 * @param importRequest - Import request.
 * @param importOptions
 * @param importOptions.requiredAuthorizationDomain - Require destination workspace has this authorization domain.
 */
export const buildDestinationWorkspaceFilter = (
  importRequest: ImportRequest,
  importOptions: ImportOptions = {}
): ((workspace: WorkspaceWrapper) => boolean) => {
  const { requiredAuthorizationDomain } = importOptions;

  const importRequiresSecurityMonitoring = requiresSecurityMonitoring(importRequest);
  const requiredCloudPlatform = getRequiredCloudPlatform(importRequest);

  return (workspace: WorkspaceWrapper): boolean => {
    // The user must be able to write to the workspace to import data.
    if (!canWrite(workspace.accessLevel)) {
      return false;
    }

    // If a cloud platform is required, the destination workspace must be on that cloud platform.
    if (requiredCloudPlatform && getCloudProviderFromWorkspace(workspace) !== requiredCloudPlatform) {
      return false;
    }

    // If the source data requires security monitoring, the destination workspace must have security monitoring enabled.
    // Additionally, require that the destination workspace is not public.
    if (importRequiresSecurityMonitoring && !(isProtectedWorkspace(workspace) && !workspace.public)) {
      return false;
    }

    // If an authorization domain was requested, the destination workspace must include that authorization domain.
    if (
      requiredAuthorizationDomain &&
      !workspace.workspace.authorizationDomain.some(
        ({ membersGroupName }) => membersGroupName === requiredAuthorizationDomain
      )
    ) {
      return false;
    }

    return true;
  };
};
