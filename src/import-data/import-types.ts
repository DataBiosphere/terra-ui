import { Snapshot } from 'src/libs/ajax/DataRepo';

export interface PFBImportRequest {
  type: 'pfb';
  url: URL;
}

export interface BagItImportRequest {
  type: 'bagit';
  url: URL;
}

export interface EntitiesImportRequest {
  type: 'entities';
  url: URL;
}

export type FileImportRequest = PFBImportRequest | BagItImportRequest | EntitiesImportRequest;

export interface TDRSnapshotExportImportRequest {
  type: 'tdr-snapshot-export';
  manifestUrl: URL;
  snapshot: Snapshot;
  syncPermissions: boolean;
}

export interface TDRSnapshotReferenceImportRequest {
  type: 'tdr-snapshot-reference';
  snapshot: Snapshot;
}

export interface CatalogDatasetImportRequest {
  type: 'catalog-dataset';
  datasetId: string;
}

export type ImportRequest =
  | PFBImportRequest
  | BagItImportRequest
  | EntitiesImportRequest
  | TDRSnapshotExportImportRequest
  | TDRSnapshotReferenceImportRequest
  | CatalogDatasetImportRequest;

export interface TemplateWorkspaceInfo {
  name: string;
  namespace: string;
  description: string;
  hasNotebooks: boolean;
  hasWorkflows: boolean;
}
