export type CloudProvider = 'AZURE' | 'GCP';

export interface AuditInfo {
  creator: string;
  createdDate: string;
  destroyedDate: string | null;
  dateAccessed: string;
}

export interface LeoError {
  errorMessage: string;
  timestamp: string;
}

export type LeoResourceLabels = { [key: string]: string };

export interface CloudContext {
  cloudProvider: CloudProvider;
  cloudResource: string;
}
