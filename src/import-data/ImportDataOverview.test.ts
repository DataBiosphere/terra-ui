import { screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { gcpTdrSnapshotImportRequest } from './__fixtures__/import-request-fixtures';
import { PFBImportRequest } from './import-types';
import { ImportDataOverview } from './ImportDataOverview';

global.fetch = jest.fn();

const MB = 2 ** 20;

const pfbImportRequest: PFBImportRequest = {
  type: 'pfb',
  url: new URL('https://example.com/path/to/file.pfb?signature=abc123'),
};

const displayUrl = 'example.com/path/to/file.pfb';

/** Mock the response to the HEAD request used to get the size of the file to import. */
const mockFileSizeResponse = (options: { ok?: boolean; contentLength?: string | null } = {}) => {
  const { ok = true, contentLength = null } = options;
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-length' ? contentLength : null),
    },
  });
};

describe('ImportDataOverview', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    mockFileSizeResponse();
  });

  it('renders the source URL without the protocol or query parameters', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(displayUrl)).toBeTruthy();
  });

  it('requests the size of the file to import', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(pfbImportRequest.url.href, expect.objectContaining({ method: 'HEAD' }))
    );
  });

  it('shows an estimated import time based on the size of the file to import', async () => {
    // Arrange
    mockFileSizeResponse({ contentLength: `${2 * MB}` });

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText('Estimated import time: 20 minutes')).toBeTruthy();
  });

  it('warns about files that exceed the recommended size limit', async () => {
    // Arrange
    mockFileSizeResponse({ contentLength: `${1000 * MB}` });

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(/\(Exceeds recommended size limit\)/)).toBeTruthy();
    expect(screen.getByText(displayUrl).parentElement).toHaveStyle({ color: colors.danger() });
  });

  it('does not warn about files within the recommended size limit', async () => {
    // Arrange
    mockFileSizeResponse({ contentLength: `${100 * MB}` });

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText('Estimated import time: 1000 minutes')).toBeTruthy();
    expect(screen.queryByText(/\(Exceeds recommended size limit\)/)).toBeNull();
    expect(screen.getByText(displayUrl).parentElement).not.toHaveStyle({ color: colors.danger() });
  });

  it.each([
    {
      scenario: 'the request fails',
      mockResponse: () => (global.fetch as jest.Mock).mockRejectedValue(new Error('CORS')),
    },
    { scenario: 'the response is an error', mockResponse: () => mockFileSizeResponse({ ok: false }) },
    {
      scenario: 'the response has no content length',
      mockResponse: () => mockFileSizeResponse({ contentLength: null }),
    },
  ])('does not show an estimated import time if $scenario', async ({ mockResponse }) => {
    // Arrange
    mockResponse();

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(displayUrl)).toBeTruthy();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText(/Estimated import time/)).toBeNull();
  });

  it('does not request a file size for imports without a source URL', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: gcpTdrSnapshotImportRequest }));

    // Assert
    expect(screen.queryByText('Dataset source:')).toBeNull();
    expect(screen.queryByText(/Estimated import time/)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
