import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';

import { isProtected, isProtectedWorkspace } from './ImportData';

describe('isProtected', () => {
  const protectedUrls = [
    { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'pfb' },
    { url: 'https://anvilproject.org/file2', format: 'PFB' },
    { url: 'https://dev.anvil.gi.ucsc.edu/manifest/files', format: 'pFb' },
    { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'PFB' },
  ];
  const nonProtectedUrls = [
    { url: 'https://nonanvil.site.org/file', format: 'pfb' },
    { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'entitiesJson' },
    { url: 'https://google.com/file.pfb', format: 'PFB' },
    { url: 'https://nonanvil.site.org/file', format: 'tdrexport' },
    { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'snapshot' },
    { url: 'https://anvilproject.org/', format: 'catalog' },
    { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'snapShot' },
  ];

  it.each(protectedUrls)('%o should  be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(true);
  });

  it.each(nonProtectedUrls)('%o should not be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(false);
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
