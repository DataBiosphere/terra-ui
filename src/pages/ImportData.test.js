import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';

import { ImportDataOverview, isProtected } from './ImportData';

const protectedUrls = [
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'pfb' },
  { url: 'https://anvilproject.org/file2', format: 'PFB' },
  { url: 'https://dev.anvil.gi.ucsc.edu/manifest/files', format: 'pFb' },
  { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'PFB' },
  { url: 'https://gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com/dataset', format: 'pfB' },
  { url: 'https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/export_2023-07-07.avro', format: 'PFB' },
];
const nonProtectedUrls = [
  { url: 'https://nonanvil.site.org/file', format: 'pfb' },
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'entitiesJson' },
  { url: 'https://google.com/file.pfb', format: 'PFB' },
  { url: 'https://nonanvil.site.org/file', format: 'tdrexport' },
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'snapshot' },
  { url: 'https://anvilproject.org/', format: 'catalog' },
  { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'snapShot' },
  { url: 'http://localhost:3000', format: '' },
];

describe('isProtected', () => {
  it.each(protectedUrls)('%o should  be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(true);
  });

  it.each(nonProtectedUrls)('%o should not be protected', ({ url, format }) => {
    expect(isProtected(url, format)).toBe(false);
  });
});

describe('ImportDataOverview', () => {
  const header = 'Linking data to a workspace';
  const snapshots = [];
  const isDataset = true;
  const snapshotResponses = [];

  it.each(protectedUrls)('should render warning about protected data from %o', ({ url, format }) => {
    render(h(ImportDataOverview, { header, snapshots, isDataset, snapshotResponses, url, format }));
    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', { exact: false });
    expect(protectedWarning).not.toBeNull();
    const noWarning = screen.queryByText('The dataset(s) you just chose to import to Terra will be made available to you', { exact: false });
    expect(noWarning).toBeNull();
  });

  it.each(nonProtectedUrls)('should not render warning about protected data from %o', ({ url, format }) => {
    render(h(ImportDataOverview, { header, snapshots, isDataset, snapshotResponses, url, format }));
    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', { exact: false });
    expect(protectedWarning).toBeNull();
    const noWarning = screen.queryByText('The dataset(s) you just chose to import to Terra will be made available to you', { exact: false });
    expect(noWarning).not.toBeNull();
  });
});
