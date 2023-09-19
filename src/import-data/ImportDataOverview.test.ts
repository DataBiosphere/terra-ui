import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';

import { ImportDataOverview } from './ImportDataOverview';

describe('ImportDataOverview', () => {
  const header = 'Linking data to a workspace';
  const snapshots = [];
  const isDataset = true;
  const snapshotResponses = [];

  it('should render warning about protected data', () => {
    render(
      h(ImportDataOverview, {
        header,
        snapshots,
        isDataset,
        snapshotResponses,
        url: 'https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/export_2023-07-07.avro',
        isProtectedData: true,
      })
    );

    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', {
      exact: false,
    });
    expect(protectedWarning).not.toBeNull();
    const noWarning = screen.queryByText(
      'The dataset(s) you just chose to import to Terra will be made available to you',
      { exact: false }
    );
    expect(noWarning).toBeNull();
  });

  it('should not render warning about unprotected data', () => {
    render(
      h(ImportDataOverview, {
        header,
        snapshots,
        isDataset,
        snapshotResponses,
        url: 'https://google.com/file.pfb',
        isProtectedData: false,
      })
    );
    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', {
      exact: false,
    });
    expect(protectedWarning).toBeNull();
    const noWarning = screen.queryByText(
      'The dataset(s) you just chose to import to Terra will be made available to you',
      { exact: false }
    );
    expect(noWarning).not.toBeNull();
  });
});
