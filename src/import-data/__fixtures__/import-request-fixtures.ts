import { Snapshot } from 'src/libs/ajax/DataRepo';

import { PFBImportRequest, TDRSnapshotExportImportRequest, TDRSnapshotReferenceImportRequest } from '../import-types';

/**
 * TDR import requests
 */

interface SnapshotFixtureOptions {
  cloudPlatform: 'azure' | 'gcp';
  secureMonitoringEnabled?: boolean;
}

const getSnapshot = (options: SnapshotFixtureOptions): Snapshot => {
  const { cloudPlatform, secureMonitoringEnabled = false } = options;
  return {
    id: '00001111-2222-3333-aaaa-bbbbccccdddd',
    name: 'test-snapshot',
    source: [
      {
        dataset: {
          id: '00001111-2222-3333-aaaa-bbbbccccdddd',
          name: 'test-dataset',
          secureMonitoringEnabled,
        },
      },
    ],
    cloudPlatform,
  };
};

export const azureTdrSnapshotImportRequest: TDRSnapshotExportImportRequest = {
  type: 'tdr-snapshot-export',
  manifestUrl: new URL('https://example.com/path/to/manifest.json'),
  snapshot: getSnapshot({ cloudPlatform: 'azure' }),
  syncPermissions: false,
};

export const gcpTdrSnapshotImportRequest: TDRSnapshotExportImportRequest = {
  type: 'tdr-snapshot-export',
  manifestUrl: new URL('https://example.com/path/to/manifest.json'),
  snapshot: getSnapshot({ cloudPlatform: 'gcp' }),
  syncPermissions: false,
};

export const gcpTdrSnapshotReferenceImportRequest: TDRSnapshotReferenceImportRequest = {
  type: 'tdr-snapshot-reference',
  snapshot: getSnapshot({ cloudPlatform: 'gcp' }),
};

export const protectedGcpTdrSnapshotImportRequest: TDRSnapshotExportImportRequest = {
  type: 'tdr-snapshot-export',
  manifestUrl: new URL('https://example.com/path/to/manifest.json'),
  snapshot: getSnapshot({ cloudPlatform: 'gcp', secureMonitoringEnabled: true }),
  syncPermissions: false,
};

export const protectedGcpTdrSnapshotReferenceImportRequest: TDRSnapshotReferenceImportRequest = {
  type: 'tdr-snapshot-reference',
  snapshot: getSnapshot({ cloudPlatform: 'gcp', secureMonitoringEnabled: true }),
};

/**
 * PFB import requests
 */

export const anvilPfbImportRequests: PFBImportRequest[] = [
  // AnVIL production
  { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/file.pfb') },
  {
    type: 'pfb',
    url: new URL('https://s3.amazonaws.com/edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1/file.pfb'),
  },
  // AnVIL development
  { type: 'pfb', url: new URL('https://service.anvil.gi.ucsc.edu/file.pfb') },
];

export const biodataCatalystPfbImportRequests: PFBImportRequest[] = [
  { type: 'pfb', url: new URL('https://gen3.biodatacatalyst.nhlbi.nih.gov/file.pfb') },
  { type: 'pfb', url: new URL('https://gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com/file.pfb') },
  { type: 'pfb', url: new URL('https://s3.amazonaws.com/gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export/file.pfb') },
  { type: 'pfb', url: new URL('https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/file.pfb') },
];

export const genericPfbImportRequest: PFBImportRequest = { type: 'pfb', url: new URL('https://example.com/file.pfb') };
