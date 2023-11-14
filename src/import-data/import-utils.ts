import { Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT } from 'src/libs/feature-previews-config';
import { canWrite, CloudProvider, getCloudProviderFromWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';

import { ImportRequest } from './import-types';
import { isProtectedWorkspace } from './protected-data-utils';

export const getCloudPlatformRequiredForImport = (importRequest: ImportRequest): CloudProvider | undefined => {
  switch (importRequest.type) {
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      const tdrCloudPlatformToCloudProvider: Record<Snapshot['cloudPlatform'], CloudProvider> = {
        azure: 'AZURE',
        gcp: 'GCP',
      };
      return tdrCloudPlatformToCloudProvider[importRequest.snapshot.cloudPlatform];
    default:
      return undefined;
  }
};

export type ImportOptions = {
  /** Cloud platform required for the import. */
  cloudPlatform?: CloudProvider;

  /** Is the source data protected. */
  isProtectedData: boolean;

  /** Authorization domain required for the source data. */
  requiredAuthorizationDomain?: string;

  /** The import request, used to calculate feature flags */
  importRequest: ImportRequest;
};

/**
 * Can the user can import data into a workspace?
 *
 * @param importOptions
 * @param importOptions.cloudPlatform - Cloud platform required for the import.
 * @param importOptions.isProtectedData - Is the source data protected.
 * @param importOptions.requiredAuthorizationDomain - Authorization domain required for the source data.
 * @param workspace - Candidate workspace.
 */
export const canImportIntoWorkspace = (importOptions: ImportOptions, workspace: WorkspaceWrapper): boolean => {
  const { cloudPlatform, isProtectedData, requiredAuthorizationDomain, importRequest } = importOptions;

  // The user must be able to write to the workspace to import data.
  if (!canWrite(workspace.accessLevel)) {
    return false;
  }

  // If a cloud platform is required, the destination workspace must be on that cloud platform.
  if (cloudPlatform && getCloudProviderFromWorkspace(workspace) !== cloudPlatform) {
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

  // Check feature flags to see if this particular import use case is supported
  if (
    importRequest.type === 'pfb' &&
    getCloudProviderFromWorkspace(workspace) === 'AZURE' &&
    !isFeaturePreviewEnabled(ENABLE_AZURE_PFB_IMPORT)
  ) {
    return false;
  }

  return true;
};
