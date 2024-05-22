import { Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT } from 'src/libs/feature-previews-config';
import {
  canWrite,
  CloudProvider,
  getCloudProviderFromWorkspace,
  isProtectedWorkspace,
  WorkspaceWrapper,
} from 'src/workspaces/utils';

import { ImportRequest } from './import-types';
import { isProtectedSource } from './protected-data-utils';

export const getCloudPlatformRequiredForImport = (importRequest: ImportRequest): CloudProvider | undefined => {
  switch (importRequest.type) {
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      const tdrCloudPlatformToCloudProvider: Record<Snapshot['cloudPlatform'], CloudProvider> = {
        azure: 'AZURE',
        gcp: 'GCP',
      };
      return tdrCloudPlatformToCloudProvider[importRequest.snapshot.cloudPlatform];
    case 'pfb':
      // restrict PFB imports to GCP unless the user has the right feature flag enabled
      return isFeaturePreviewEnabled(ENABLE_AZURE_PFB_IMPORT) ? undefined : 'GCP';
    default:
      return undefined;
  }
};

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

  const isProtectedData = isProtectedSource(importRequest);
  const requiredCloudPlatform = getCloudPlatformRequiredForImport(importRequest);

  return (workspace: WorkspaceWrapper): boolean => {
    // The user must be able to write to the workspace to import data.
    if (!canWrite(workspace.accessLevel)) {
      return false;
    }

    // If a cloud platform is required, the destination workspace must be on that cloud platform.
    if (requiredCloudPlatform && getCloudProviderFromWorkspace(workspace) !== requiredCloudPlatform) {
      return false;
    }

    // If the source data is protected, the destination workspace must also be protected and not public.
    if (isProtectedData && !(isProtectedWorkspace(workspace) && !workspace.public)) {
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
