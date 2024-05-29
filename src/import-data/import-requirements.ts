import { Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT } from 'src/libs/feature-previews-config';
import { CloudProvider } from 'src/workspaces/utils';

import { anvilSources, biodatacatalystSources, urlMatchesSource, UrlSource } from './import-sources';
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
