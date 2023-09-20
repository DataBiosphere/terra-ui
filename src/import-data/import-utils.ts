import { canWrite, WorkspaceWrapper } from 'src/libs/workspace-utils';

import { isProtectedWorkspace } from './protected-data-utils';

export type ImportOptions = {
  /** Is the source data protected. */
  isProtectedData: boolean;

  /** Authorization domain required for the source data. */
  requiredAuthorizationDomain?: string;
};

/**
 * Can the user can import data into a workspace?
 *
 * @param importOptions
 * @param importOptions.isProtectedData - Is the source data protected.
 * @param importOptions.requiredAuthorizationDomain - Authorization domain required for the source data.
 * @param workspace - Candidate workspace.
 */
export const canImportIntoWorkspace = (importOptions: ImportOptions, workspace: WorkspaceWrapper): boolean => {
  const { isProtectedData, requiredAuthorizationDomain } = importOptions;

  // The user must be able to write to the workspace to import data.
  if (!canWrite(workspace.accessLevel)) {
    return false;
  }

  // If the source data is protected, the destination workspace must also be protected.
  if (isProtectedData && !isProtectedWorkspace(workspace)) {
    return false;
  }

  // If the import requires an authorization domain, the destination workspace must include that authorization domain.
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
