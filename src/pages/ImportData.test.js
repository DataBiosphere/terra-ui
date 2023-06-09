import { isProtected } from './ImportData';

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

  test.each(protectedUrls)('%o should  be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(true);
  });

  test.each(nonProtectedUrls)('%o should not be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(false);
  });
});
