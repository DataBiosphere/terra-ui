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
  snapshotId: string;
  snapshotName: string;
  syncPermissions: boolean;
}

export interface TDRSnapshotReferenceImportRequest {
  type: 'tdr-snapshot-reference';
  snapshotId: string;
  snapshotName: string;
}

export interface CatalogDatasetImportRequest {
  type: 'catalog-dataset';
  datasetId: string;
}

export interface CatalogSnapshotsImportRequest {
  type: 'catalog-snapshots';
  snapshotIds: string[];
}

export type ImportRequest =
  | PFBImportRequest
  | BagItImportRequest
  | EntitiesImportRequest
  | TDRSnapshotExportImportRequest
  | TDRSnapshotReferenceImportRequest
  | CatalogDatasetImportRequest
  | CatalogSnapshotsImportRequest;

export interface TemplateWorkspaceInfo {
  name: string;
  namespace: string;
  description: string;
  hasNotebooks: boolean;
  hasWorkflows: boolean;
}
