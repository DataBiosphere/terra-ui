import {
  anvilPfbImportRequests,
  biodataCatalystPfbImportRequests,
  genericPfbImportRequest,
} from './__fixtures__/import-request-fixtures';
import { getImportSource, ImportSource } from './import-sources';

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
