import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { ImportRequest } from './import-types';
import { isProtectedSource, isProtectedWorkspace } from './protected-data-utils';

const protectedImports: ImportRequest[] = [
  // AnVIL production
  { type: 'pfb', url: 'https://service.prod.anvil.gi.ucsc.edu/file.pfb' },
  { type: 'pfb', url: 'https://s3.amazonaws.com/edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1/file.pfb' },
  // AnVIL development
  { type: 'pfb', url: 'https://service.anvil.gi.ucsc.edu/file.pfb' },
  // BioData Catalyst
  { type: 'pfb', url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/file.pfb' },
  { type: 'pfb', url: 'https://gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com/file.pfb' },
  { type: 'pfb', url: 'https://s3.amazonaws.com/gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export/file.pfb' },
  { type: 'pfb', url: 'https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/file.pfb' },
];

const unprotectedImports: ImportRequest[] = [
  { type: 'pfb', url: 'https://example.com/file.pfb' },
  { type: 'entities', url: 'https://service.prod.anvil.gi.ucsc.edu/file.json' },
];

describe('isProtectedSource', () => {
  it.each(protectedImports)('$url should be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(true);
  });

  it.each(unprotectedImports)('$url should not be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(false);
  });
});

describe('isProtectedWorkspace', () => {
  const unprotectedWorkspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];

  it.each(unprotectedWorkspaces)('%o should not be protected', (workspace) => {
    expect(isProtectedWorkspace(workspace)).toBe(false);
  });

  it('should recognize a protected workspace', () => {
    const protectedWorkspace = { ...defaultGoogleWorkspace };
    protectedWorkspace.workspace.bucketName = `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}`;

    expect(isProtectedWorkspace(protectedWorkspace)).toBe(true);
  });
});
