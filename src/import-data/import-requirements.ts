import _ from 'lodash';
import { Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT } from 'src/libs/feature-previews-config';
import { CloudProvider, WorkspaceWrapper } from 'src/workspaces/utils';

import { anvilSources, biodatacatalystSources, isAnvilImport, urlMatchesSource, UrlSource } from './import-sources';
import { ImportRequest } from './import-types';

export const getRequiredCloudPlatform = (importRequest: ImportRequest): CloudProvider | undefined => {
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

const sourcesRequiringSecurityMonitoring: UrlSource[] = [
  // AnVIL PFBs refer to TDR snapshots, so security monitoring requirements will be enforced
  // by policy on the TDR snapshots. In Terra UI, we assume that all AnVIL PFBs reference
  // a snapshot that requires security monitoring. This reduces that chance that a user
  // selects a destination workspace that is not permitted to receive the data and encounters
  // a failure later in the import process.
  ...anvilSources,

  // For some other sources, secure monitoring requirements are enforced by Terra Workspace Data Service.
  // This must be kept in sync with the twds.data-import.sources configuration in terra-workspace-data-service.
  // https://github.com/DataBiosphere/terra-workspace-data-service/blob/main/service/src/main/resources/application.yml
  ...biodatacatalystSources,
];

/**
 * Determine if a PFB file requires security monitoring.
 */
const pfbRequiresSecurityMonitoring = (pfbUrl: URL): boolean => {
  return sourcesRequiringSecurityMonitoring.some((source) => urlMatchesSource(pfbUrl, source));
};

/**
 * Determine if a TDR snapshot requires security monitoring.
 */
const snapshotRequiresSecurityMonitoring = (snapshot: Snapshot): boolean => {
  return snapshot.source.some((source) => source.dataset.secureMonitoringEnabled);
};

/**
 * Determine whether an import requires security monitoring.
 */
export const requiresSecurityMonitoring = (importRequest: ImportRequest): boolean => {
  switch (importRequest.type) {
    case 'pfb':
      return pfbRequiresSecurityMonitoring(importRequest.url);
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      return snapshotRequiresSecurityMonitoring(importRequest.snapshot);
    default:
      return false;
  }
};

/**
 * Does an import source have access controls?
 *
 * @param importRequest An import request.
 *
 * @returns
 * - `true` if the source has access controls.
 * - `false` if the source does not have access controls.
 * - `undefined` if it is unknown whether the source has access controls.
 */
export const sourceHasAccessControl = (importRequest: ImportRequest): boolean | undefined => {
  switch (importRequest.type) {
    case 'pfb':
      // PFBs may reference TDR snapshots with data access controls.
      // We can't know up front which snapshots (if any) a PFB references.
      // Currently, only PFBs from AnVIL are expected to reference snapshots.
      return isAnvilImport(importRequest) ? undefined : false;
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      // The snapshot has access controls if it has an auth domain.
      return importRequest.snapshotAccessControls.length !== 0;
      return undefined;
    default:
      return false;
  }
};

/**
 * Will importing data into a workspace update the workspace's access controls?
 *
 * @param importRequest An import request.
 * @param workspace A destination workspace.
 *
 * @returns
 * - `true` if the import will update the workspace's access controls.
 * - `false` if the import will not update the workspace's access controls.
 * - `undefined` if it is unknown whether the import will update the workspace's access controls.
 */
export const importWillUpdateAccessControl = (
  importRequest: ImportRequest,
  workspace: WorkspaceWrapper
): boolean | undefined => {
  switch (importRequest.type) {
    case 'pfb':
      // PFBs may reference TDR snapshots with data access controls.
      // We can't know up front which snapshots (if any) a PFB references.
      // Currently, only PFBs from AnVIL are expected to reference snapshots.
      return isAnvilImport(importRequest) ? undefined : false;
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      // TDR snapshot imports require an access control update if the snapshot requires an auth domain
      // that the workspace does not already have.
      const workspaceAuthDomainGroups = workspace.workspace.authorizationDomain.map((ad) => ad.membersGroupName);
      return _.difference(importRequest.snapshotAccessControls, workspaceAuthDomainGroups).length !== 0;
    default:
      return false;
  }
};
