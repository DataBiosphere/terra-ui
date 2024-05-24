import {
  anvilPfbImportRequests,
  biodataCatalystPfbImportRequests,
  genericPfbImportRequest,
} from './__fixtures__/import-request-fixtures';
import { getImportSource } from './protected-data-utils';

describe('getImportSource', () => {
  it.each(anvilPfbImportRequests)('$url source should be categorized as anvil', (importRequest) => {
    expect(getImportSource(importRequest.url)).toBe('anvil');
  });

  it.each([genericPfbImportRequest, ...biodataCatalystPfbImportRequests])(
    '$url source should be empty',
    (importRequest) => {
      expect(getImportSource(importRequest.url)).toBe('');
    }
  );
});
