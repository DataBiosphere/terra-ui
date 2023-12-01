import { Snapshot } from 'src/libs/ajax/DataRepo';

import { ImportRequest, PFBImportRequest } from './import-types';
import { getImportSource, isProtectedSource } from './protected-data-utils';

const getSnapshot = (secureMonitoringEnabled: boolean): Snapshot => {
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
    cloudPlatform: 'gcp',
  };
};

const protectedAnvilImports: PFBImportRequest[] = [
  // AnVIL production
  { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/file.pfb') },
  {
    type: 'pfb',
    url: new URL('https://s3.amazonaws.com/edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1/file.pfb'),
  },
];

const nonAnvilExplorerUrls: PFBImportRequest[] = [
  { type: 'pfb', url: new URL('https://example.com/file.pfb') },
  { type: 'pfb', url: new URL('https://s3.amazonaws.com/gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export/file.pfb') },
  { type: 'pfb', url: new URL('https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/file.pfb') },
];

const protectedImports: ImportRequest[] = [
  // AnVIL production
  ...protectedAnvilImports,
  // AnVIL development
  { type: 'pfb', url: new URL('https://service.anvil.gi.ucsc.edu/file.pfb') },
  // BioData Catalyst
  { type: 'pfb', url: new URL('https://gen3.biodatacatalyst.nhlbi.nih.gov/file.pfb') },
  { type: 'pfb', url: new URL('https://gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com/file.pfb') },
  { type: 'pfb', url: new URL('https://s3.amazonaws.com/gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export/file.pfb') },
  { type: 'pfb', url: new URL('https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/file.pfb') },
  // Protected TDR snapshots
  {
    type: 'tdr-snapshot-export',
    manifestUrl: new URL('https://example.com/path/to/manifest.json'),
    snapshot: getSnapshot(true),
    syncPermissions: false,
  },
  {
    type: 'tdr-snapshot-reference',
    snapshot: getSnapshot(true),
  },
];

const unprotectedImports: ImportRequest[] = [
  { type: 'pfb', url: new URL('https://example.com/file.pfb') },
  { type: 'entities', url: new URL('https://service.prod.anvil.gi.ucsc.edu/file.json') },
  {
    type: 'tdr-snapshot-export',
    manifestUrl: new URL('https://example.com/path/to/manifest.json'),
    snapshot: getSnapshot(false),
    syncPermissions: false,
  },
  {
    type: 'tdr-snapshot-reference',
    snapshot: getSnapshot(false),
  },
];

describe('isProtectedSource', () => {
  it.each(protectedImports)('$url should be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(true);
  });

  it.each(unprotectedImports)('$url should not be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(false);
  });
});

describe('getImportSource', () => {
  it.each(protectedAnvilImports)('$url source should be categorized as anvil', (importRequest) => {
    expect(getImportSource(importRequest.url)).toBe('anvil');
  });

  it.each(nonAnvilExplorerUrls)('$url source should be empty', (importRequest) => {
    expect(getImportSource(importRequest.url)).toBe('');
  });
});
