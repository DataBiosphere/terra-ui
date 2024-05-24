import { Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT } from 'src/libs/feature-previews-config';
import { CloudProvider } from 'src/workspaces/utils';

import { urlMatchesSource, UrlSource } from './import-sources';
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

// These must be kept in sync with CWDS' twds.data-import.sources setting.
// https://github.com/DataBiosphere/terra-workspace-data-service/blob/main/service/src/main/resources/application.yml
const sourcesRequiringSecurityMonitoring: UrlSource[] = [
  // AnVIL production
  { type: 'http', host: 'service.prod.anvil.gi.ucsc.edu' },
  { type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1' },
  // AnVIL development
  { type: 'http', host: 'service.anvil.gi.ucsc.edu' },
  { type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1' },
  // BioData Catalyst
  { type: 'http', host: 'gen3.biodatacatalyst.nhlbi.nih.gov' },
  { type: 's3', bucket: 'gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export' },
  { type: 's3', bucket: 'gen3-theanvil-io-pfb-export' },
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
