import {
  anvilPfbImportRequests,
  biodataCatalystPfbImportRequests,
  genericPfbImportRequest,
} from './__fixtures__/import-request-fixtures';
import { getImportSource, ImportSource, urlMatchesSource, UrlSource } from './import-sources';

describe('urlMatchesSource', () => {
  it.each([
    { url: new URL('https://example.com/file.txt'), shouldMatch: true },
    { url: new URL('https://subdomain.example.com/file.txt'), shouldMatch: true },
    { url: new URL('https://subdomainexample.com/file.txt'), shouldMatch: false },
    { url: new URL('https://example-example.com/file.txt'), shouldMatch: false },
  ] as { url: URL; shouldMatch: boolean }[])(
    'matches HTTP sources by hostname ($url, $shouldMatch)',
    ({ url, shouldMatch }) => {
      // Arrange
      const source: UrlSource = { type: 'http', host: 'example.com' };

      // Act
      const matches = urlMatchesSource(url, source);

      // Assert
      expect(matches).toBe(shouldMatch);
    }
  );
});

describe('getImportSource', () => {
  it.each([
    ...anvilPfbImportRequests.map((importRequest) => ({ importUrl: importRequest.url, expectedSource: 'anvil' })),
    ...[genericPfbImportRequest, ...biodataCatalystPfbImportRequests].map((importRequest) => ({
      importUrl: importRequest.url,
      expectedSource: '',
    })),
  ] as {
    importUrl: URL;
    expectedSource: ImportSource;
  }[])('identifies import source ($importUrl)', ({ importUrl, expectedSource }) => {
    // Act
    const source = getImportSource(importUrl);

    // Assert
    expect(source).toBe(expectedSource);
  });
});
