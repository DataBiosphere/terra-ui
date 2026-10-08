import { screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { BackendUtil, UrlSizeResponse } from 'src/libs/ajax/BackendUtil';
import colors from 'src/libs/colors';
import { asMockedFn, MockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { gcpTdrSnapshotImportRequest } from './__fixtures__/import-request-fixtures';
import { PFBImportRequest } from './import-types';
import { ImportDataOverview } from './ImportDataOverview';

type BackendUtilContract = ReturnType<typeof BackendUtil>;

jest.mock('src/libs/ajax/BackendUtil');

const MB = 2 ** 20;

const pfbImportRequest: PFBImportRequest = {
  type: 'pfb',
  url: new URL('https://example.com/path/to/file.pfb?signature=abc123'),
};

const displayUrl = 'example.com/path/to/file.pfb';

let preprocess: MockedFn<BackendUtilContract['preprocess']>;

/** Mock the sizes that cWDS reports for the files an import will read. */
const mockFileSizes = (sizesBytes: number[]) => {
  preprocess.mockResolvedValue(
    partial<UrlSizeResponse>({
      files: sizesBytes.map((sizeBytes, i) => ({ signed_url: `https://example.com/part-${i}.avro`, sizeBytes })),
    })
  );
};

describe('ImportDataOverview', () => {
  beforeEach(() => {
    preprocess = jest.fn(async (_url: string) => partial<UrlSizeResponse>({ files: [] }));
    asMockedFn(BackendUtil).mockReturnValue(partial<BackendUtilContract>({ preprocess }));
  });

  it('renders the source URL without the protocol or query parameters', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(displayUrl)).toBeTruthy();
  });

  it('requests the size of the file to import from cWDS', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    await waitFor(() => expect(preprocess).toHaveBeenCalledWith(pfbImportRequest.url.href));
  });

  it('shows an estimated import time based on the size of the file to import', async () => {
    // Arrange
    mockFileSizes([2 * MB]);

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText('Estimated import time: 20 minutes')).toBeTruthy();
  });

  it('estimates from the largest file when cWDS reports several', async () => {
    // Arrange
    mockFileSizes([1 * MB, 5 * MB, 3 * MB]);

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText('Estimated import time: 50 minutes')).toBeTruthy();
  });

  it('warns about files that exceed the recommended size limit', async () => {
    // Arrange
    mockFileSizes([1000 * MB]);

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(/\(Exceeds recommended size limit\)/)).toBeTruthy();
    expect(screen.getByText(displayUrl).parentElement).toHaveStyle({ color: colors.danger() });
  });

  it('does not warn about files within the recommended size limit', async () => {
    // Arrange
    mockFileSizes([100 * MB]);

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
      mockResponse: () => preprocess.mockRejectedValue(new Response('{"message":"x"}', { status: 400 })),
    },
    { scenario: 'cWDS reports no files', mockResponse: () => mockFileSizes([]) },
    { scenario: 'cWDS reports no usable size', mockResponse: () => mockFileSizes([0]) },
  ])('does not show an estimated import time if $scenario', async ({ mockResponse }) => {
    // Arrange
    mockResponse();

    // Act
    render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(displayUrl)).toBeTruthy();
    await waitFor(() => expect(preprocess).toHaveBeenCalled());
    expect(screen.queryByText(/Estimated import time/)).toBeNull();
  });

  it('never shows the signature from a signed URL', async () => {
    // Act
    const { container } = render(h(ImportDataOverview, { importRequest: pfbImportRequest }));

    // Assert
    expect(await screen.findByText(displayUrl)).toBeTruthy();
    expect(screen.queryByText(/signature=/)).toBeNull();
    expect(container.innerHTML).not.toContain('signature=abc123');
  });

  it('does not request a file size for imports without a source URL', async () => {
    // Act
    render(h(ImportDataOverview, { importRequest: gcpTdrSnapshotImportRequest }));

    // Assert
    expect(screen.queryByText('Dataset source:')).toBeNull();
    expect(screen.queryByText(/Estimated import time/)).toBeNull();
    expect(preprocess).not.toHaveBeenCalled();
  });
});
