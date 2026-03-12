import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { bucketBrowserUrl, bucketFileBrowserUrl } from 'src/auth/auth';
import { Link } from 'src/components/common';
import { DrsUriResolver } from 'src/libs/ajax/drs/DrsUriResolver';
import { Metrics } from 'src/libs/ajax/Metrics';
import * as Utils from 'src/libs/utils';
import { renderWithAppContexts } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { UriViewer } from './UriViewer';

jest.mock('src/libs/ajax/drs/DrsUriResolver');
jest.mock('src/libs/ajax/Metrics');

describe('UriViewer Links', () => {
  const gsUri = 'gs://my-bucket/my-file.txt';
  const accessUrl = null;

  it('should render link to view file in Google Cloud Storage Browser', () => {
    renderWithAppContexts(
      !accessUrl &&
        !!gsUri &&
        h(
          Link,
          {
            ...Utils.newTabLinkProps,
            href: bucketFileBrowserUrl(gsUri.match(/gs:\/\/(.+?)\/(.+)/)[1], gsUri.match(/gs:\/\/(.+?)\/(.+)/)[2]),
          },
          ['View this file in the Google Cloud Storage Browser']
        )
    );

    const link = screen.getByText('View this file in the Google Cloud Storage Browser');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://console.cloud.google.com/storage/browser/_details/my-bucket/my-file.txt;tab=live_object?authuser=undefined'
    );
  });

  it('should render link to view folder in Google Cloud Storage Browser', () => {
    renderWithAppContexts(
      !accessUrl &&
        !!gsUri &&
        h(
          Link,
          {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1]),
          },
          ['View the folder containing this file in Google Cloud Storage Browser']
        )
    );

    const link = screen.getByText('View the folder containing this file in Google Cloud Storage Browser');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://console.cloud.google.com/storage/browser/my-bucket?authuser=undefined');
  });
});

describe('UriViewer', () => {
  const readOnlyWorkspace = { ...defaultGoogleWorkspace, accessLevel: 'READER' };
  const drsUri = 'drs://dg.4503:2802a94d-f540-499f-950a-db3c2a9f2dc4';

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('when workspace is read-only and uri is DRS, does not call DrsUriResolver and shows read-only error', async () => {
    DrsUriResolver.mockClear();
    asMockedFn(Metrics).mockReturnValue(partial({ captureEvent: jest.fn() }));

    const { container } = renderWithAppContexts(
      h(UriViewer, {
        workspace: readOnlyWorkspace,
        uri: drsUri,
        onDismiss: () => {},
        onRequesterPaysError: () => {},
      })
    );

    await waitFor(() => {
      expect(container.textContent).toContain('DRS resolution is not available for read-only workspace users.');
    });

    expect(DrsUriResolver).not.toHaveBeenCalled();
  });

  it('passes workspace googleProject as userProject when resolving DRS URI', async () => {
    const getDataObjectMetadataMock = jest.fn().mockResolvedValue({
      bucket: 'test-bucket',
      name: 'test-object',
      fileName: 'test-file.vcf.gz',
      size: 1000,
      timeCreated: '2024-01-01T00:00:00Z',
      timeUpdated: '2024-01-01T00:00:00Z',
      accessUrl: { url: 'https://example.com/signed' },
    });

    DrsUriResolver.mockImplementation(() => ({
      getDataObjectMetadata: getDataObjectMetadataMock,
    }));

    renderWithAppContexts(
      h(UriViewer, {
        workspace: defaultGoogleWorkspace,
        uri: drsUri,
        onDismiss: () => {},
        onRequesterPaysError: () => {},
      })
    );

    await waitFor(() => {
      expect(getDataObjectMetadataMock).toHaveBeenCalledWith(
        drsUri,
        expect.any(Array),
        expect.objectContaining({ userProject: defaultGoogleWorkspace.workspace.googleProject })
      );
    });
  });
});
