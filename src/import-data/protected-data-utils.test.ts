import {
  anvilPfbImportRequests,
  biodataCatalystPfbImportRequests,
  gcpTdrSnapshotImportRequest,
  gcpTdrSnapshotReferenceImportRequest,
  genericPfbImportRequest,
  protectedGcpTdrSnapshotImportRequest,
  protectedGcpTdrSnapshotReferenceImportRequest,
} from './__fixtures__/import-request-fixtures';
import { ImportRequest } from './import-types';
import { getImportSource, isProtectedSource } from './protected-data-utils';

const protectedImports: ImportRequest[] = [
  // AnVIL
  ...anvilPfbImportRequests,
  // BioData Catalyst
  ...biodataCatalystPfbImportRequests,
  // Protected TDR snapshots
  protectedGcpTdrSnapshotImportRequest,
  protectedGcpTdrSnapshotReferenceImportRequest,
];

const unprotectedImports: ImportRequest[] = [
  genericPfbImportRequest,
  { type: 'entities', url: new URL('https://example.com/file.json') },
  gcpTdrSnapshotImportRequest,
  gcpTdrSnapshotReferenceImportRequest,
];

describe('isProtectedSource', () => {
  it.each(protectedImports)('$url should be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(true);
  });

  it.each(unprotectedImports)('$url should not be protected', (importRequest) => {
    expect(isProtectedSource(importRequest)).toBe(false);
  });
});

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
