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
  snapshotAccessControls: string[];
  syncPermissions: boolean;
}

export type ImportRequest =
  | PFBImportRequest
  | BagItImportRequest
  | EntitiesImportRequest
  | TDRSnapshotExportImportRequest;

export interface TemplateWorkspaceInfo {
  name: string;
  namespace: string;
  description: string;
  hasNotebooks: boolean;
  hasWorkflows: boolean;
}
