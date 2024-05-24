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

// These must be kept in sync with PROTECTED_URL_PATTERNS in import-service.
// https://github.com/broadinstitute/import-service/blob/develop/app/protected_data.py
const protectedSources: UrlSource[] = [
  // AnVIL production
  { type: 'http', host: 'service.prod.anvil.gi.ucsc.edu' },
  { type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1' },
  // AnVIL development
  { type: 'http', host: 'service.anvil.gi.ucsc.edu' },
  { type: 's3', bucket: 'edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1' },
  //  BioData Catalyst
  { type: 'http', host: 'gen3.biodatacatalyst.nhlbi.nih.gov' },
  { type: 's3', bucket: 'gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export' },
  { type: 's3', bucket: 'gen3-theanvil-io-pfb-export' },
];

/**
 * Determine if a PFB file is considered protected data.
 */
const isProtectedPfbSource = (pfbUrl: URL): boolean => {
  return protectedSources.some((source) => urlMatchesSource(pfbUrl, source));
};

/**
 * Determine if a TDR snapshot is considered protected data.
 */
const isProtectedSnapshotSource = (snapshot: Snapshot): boolean => {
  return snapshot.source.some((source) => source.dataset.secureMonitoringEnabled);
};

/**
 * Determine whether an import source is considered protected.
 */
export const isProtectedSource = (importRequest: ImportRequest): boolean => {
  switch (importRequest.type) {
    case 'pfb':
      return isProtectedPfbSource(importRequest.url);
    case 'tdr-snapshot-export':
    case 'tdr-snapshot-reference':
      return isProtectedSnapshotSource(importRequest.snapshot);
    default:
      return false;
  }
};
