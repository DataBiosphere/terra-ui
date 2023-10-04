import { useRoute } from 'src/libs/nav';

import {
  CatalogDatasetImportRequest,
  CatalogSnapshotsImportRequest,
  FileImportRequest,
  ImportRequest,
  TDRSnapshotExportImportRequest,
  TDRSnapshotReferenceImportRequest,
} from './import-types';

type QueryParams = { [key: string]: unknown };

/**
 * Validate that a value is a string. Throw an error if it is not.
 *
 * @param value The value to validate.
 * @param label Label for the value to use in error messages.
 * @returns The validated string value.
 */
const requireString = (value: unknown, label = 'value'): string => {
  if (value === undefined || value === null) {
    throw new Error(`A ${label} is required`);
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
};

/**
 * Get the requested import format from query parameters. Default to 'bagit' if none is specified.
 *
 * @param queryParams Query parameters from import request.
 * @returns Requested import format.
 */
const getFormat = (queryParams: QueryParams): string => {
  const { format } = queryParams;
  if (format === undefined) {
    return 'bagit';
  }
  if (typeof format !== 'string') {
    throw new Error(`Invalid format: ${format}`);
  }
  return format.toLowerCase();
};

const getFileImportRequest = (queryParams: QueryParams, type: FileImportRequest['type']): FileImportRequest => {
  const url = requireString(queryParams.url, 'URL');
  return { type, url };
};

const getTDRSnapshotExportImportRequest = (queryParams: QueryParams): TDRSnapshotExportImportRequest => {
  const manifestUrl = requireString(queryParams.tdrmanifest, 'manifest URL');
  const snapshotId = requireString(queryParams.snapshotId, 'snapshot ID');
  const snapshotName = requireString(queryParams.snapshotName, 'snapshot name');
  const syncPermissions = queryParams.tdrSyncPermissions === 'true';

  return {
    type: 'tdr-snapshot-export',
    manifestUrl,
    snapshotId,
    snapshotName,
    syncPermissions,
  };
};

const getTDRSnapshotReferenceImportRequest = (queryParams: QueryParams): TDRSnapshotReferenceImportRequest => {
  const snapshotId = requireString(queryParams.snapshotId, 'snapshot ID');
  const snapshotName = requireString(queryParams.snapshotName, 'snapshot name');
  return {
    type: 'tdr-snapshot-reference',
    snapshotId,
    snapshotName,
  };
};

const getCatalogDatasetImportRequest = (queryParams: QueryParams): CatalogDatasetImportRequest => {
  const datasetId = requireString(queryParams.catalogDatasetId, 'dataset ID');
  return {
    type: 'catalog-dataset',
    datasetId,
  };
};

const getCatalogSnapshotsImportRequest = (queryParams: QueryParams): CatalogSnapshotsImportRequest => {
  const { snapshotIds } = queryParams;
  if (!(Array.isArray(snapshotIds) && snapshotIds.every((snapshotId) => typeof snapshotId === 'string'))) {
    throw new Error(`Invalid snapshot IDs: ${snapshotIds}`);
  }
  return {
    type: 'catalog-snapshots',
    snapshotIds,
  };
};

export const getImportRequest = (queryParams: QueryParams): ImportRequest => {
  const format = getFormat(queryParams);

  switch (format) {
    case 'pfb':
      return getFileImportRequest(queryParams, 'pfb');
    case 'bagit':
      return getFileImportRequest(queryParams, 'bagit');
    case 'entitiesjson':
      return getFileImportRequest(queryParams, 'entities');
    case 'tdrexport':
      return getTDRSnapshotExportImportRequest(queryParams);
    case 'snapshot':
      if (queryParams.snapshotIds) {
        return getCatalogSnapshotsImportRequest(queryParams);
      }
      return getTDRSnapshotReferenceImportRequest(queryParams);
    case 'catalog':
      return getCatalogDatasetImportRequest(queryParams);
    default:
      throw new Error(`Invalid format: ${format}`);
  }
};

export type UseImportRequestResult = { isValid: true; importRequest: ImportRequest } | { isValid: false; error: Error };

export const useImportRequest = (): UseImportRequestResult => {
  const { query } = useRoute();
  try {
    const importRequest = getImportRequest(query);
    return { isValid: true, importRequest };
  } catch (originalError: unknown) {
    const error = originalError instanceof Error ? originalError : new Error('Unknown error');
    return { isValid: false, error };
  }
};