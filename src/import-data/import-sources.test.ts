import {
  anvilPfbImportRequests,
  azureTdrSnapshotImportRequest,
  biodataCatalystPfbImportRequests,
  gcpTdrSnapshotImportRequest,
  genericPfbImportRequest,
} from './__fixtures__/import-request-fixtures';
import { getImportSource, isAnvilImport, urlMatchesSource, UrlSource } from './import-sources';
import { ImportRequest } from './import-types';

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

describe('isAnvilImport', () => {
  it.each([
    ...anvilPfbImportRequests.map((importRequest) => ({ importRequest, expected: true })),
    ...[
      genericPfbImportRequest,
      ...biodataCatalystPfbImportRequests,
      azureTdrSnapshotImportRequest,
      gcpTdrSnapshotImportRequest,
    ].map((importRequest) => ({
      importRequest,
      expected: false,
    })),
  ] as {
    importRequest: ImportRequest;
    expected: boolean;
  }[])('identifies import source ($importRequest.url)', ({ importRequest, expected }) => {
    // Act
    const isAnvil = isAnvilImport(importRequest);

    // Assert
    expect(isAnvil).toBe(expected);
  });
});

describe('getImportSource', () => {
  it.each([
    ...anvilPfbImportRequests.map((importRequest) => ({ importRequest, expectedSource: 'anvil' })),
    ...[
      genericPfbImportRequest,
      ...biodataCatalystPfbImportRequests,
      azureTdrSnapshotImportRequest,
      gcpTdrSnapshotImportRequest,
    ].map((importRequest) => ({
      importRequest,
      expectedSource: undefined,
    })),
  ] as {
    importRequest: ImportRequest;
    expectedSource: string | undefined;
  }[])('identifies import source ($importRequest.url)', ({ importRequest, expectedSource }) => {
    // Act
    const source = getImportSource(importRequest);

    // Assert
    expect(source).toBe(expectedSource);
  });
});
