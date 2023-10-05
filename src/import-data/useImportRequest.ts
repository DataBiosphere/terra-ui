import { useEffect, useState } from 'react';
import { useRoute } from 'src/libs/nav';
import { fetchDataCatalog } from 'src/pages/library/dataBrowser-utils';

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
 * Validate that a value can be parsed as a URL. Throw an error if it cannot.
 *
 * @param value The value to validate.
 * @param label Label for the value to use in error messages.
 * @returns The parsed URL.
 */
const requireUrl = (value: unknown, label = 'value'): URL => {
  const stringValue = requireString(value, label);
  try {
    return new URL(stringValue);
  } catch {
    throw new Error(`Invalid ${label}: ${value}`);
  }
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
  const url = requireUrl(queryParams.url, 'URL');
  return { type, url };
};

const getTDRSnapshotExportImportRequest = (queryParams: QueryParams): TDRSnapshotExportImportRequest => {
  const manifestUrl = requireUrl(queryParams.tdrmanifest, 'manifest URL');
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

/**
 * Validate that an unknown value is an array of strings.
 */
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const getCatalogSnapshotsImportRequest = async (queryParams: QueryParams): Promise<CatalogSnapshotsImportRequest> => {
  const { snapshotIds } = queryParams;
  if (!isStringArray(snapshotIds)) {
    throw new Error(`Invalid snapshot IDs: ${snapshotIds}`);
  }

  const catalogDatasets = await fetchDataCatalog();
  const snapshots = catalogDatasets
    .filter((dataset) => dataset['dct:identifier'] && snapshotIds.includes(dataset['dct:identifier']))
    .map((dataset) => {
      return {
        // The previous step filters the list to only datasets with 'dct:identifier' defined
        id: dataset['dct:identifier']!,
        title: dataset['dct:title'],
        description: dataset['dct:description'],
      };
    });

  return {
    type: 'catalog-snapshots',
    snapshots,
  };
};

export const getImportRequest = (queryParams: QueryParams): Promise<ImportRequest> => {
  const format = getFormat(queryParams);

  switch (format) {
    case 'pfb':
      return Promise.resolve(getFileImportRequest(queryParams, 'pfb'));
    case 'bagit':
      return Promise.resolve(getFileImportRequest(queryParams, 'bagit'));
    case 'entitiesjson':
      return Promise.resolve(getFileImportRequest(queryParams, 'entities'));
    case 'tdrexport':
      return Promise.resolve(getTDRSnapshotExportImportRequest(queryParams));
    case 'snapshot':
      if (queryParams.snapshotIds) {
        return getCatalogSnapshotsImportRequest(queryParams);
      }
      return Promise.resolve(getTDRSnapshotReferenceImportRequest(queryParams));
    case 'catalog':
      return Promise.resolve(getCatalogDatasetImportRequest(queryParams));
    default:
      throw new Error(`Invalid format: ${format}`);
  }
};

export type UseImportRequestResult =
  | { status: 'Loading' }
  | { status: 'Ready'; importRequest: ImportRequest }
  | { status: 'Error'; error: Error };

export const useImportRequest = (): UseImportRequestResult => {
  const { query } = useRoute();

  const [result, setResult] = useState<UseImportRequestResult>({ status: 'Loading' });
  useEffect(() => {
    (async () => {
      try {
        setResult({ status: 'Loading' });
        const importRequest = await getImportRequest(query);
        setResult({ status: 'Ready', importRequest });
      } catch (originalError: unknown) {
        const error = originalError instanceof Error ? originalError : new Error('Unknown error');
        setResult({ status: 'Error', error });
      }
    })();
  }, [JSON.stringify(query)]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
};
