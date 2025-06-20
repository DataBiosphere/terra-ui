import { AuditInfo, CloudContext, LeoResourceLabels } from './core-models';

export type AzureDiskType = 'Standard_LRS'; // TODO: Uncomment when enabling SSDs | 'StandardSSD_LRS';

export type GoogleDiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced';

export type DiskType = GoogleDiskType | AzureDiskType;

export type LeoDiskStatus = 'Creating' | 'Restoring' | 'Ready' | 'Failed' | 'Deleting' | 'Deleted' | 'Error';

export interface DiskStatus {
  leoLabel: LeoDiskStatus;
}

export const diskStatuses: { [label: string]: DiskStatus } = {
  ready: { leoLabel: 'Ready' },
  creating: { leoLabel: 'Creating' },
  restoring: { leoLabel: 'Restoring' },
  failed: { leoLabel: 'Failed' },
  deleting: { leoLabel: 'Deleting' },
  deleted: { leoLabel: 'Deleted' },
  error: { leoLabel: 'Error' },
};

export interface RawListDiskItem {
  id: number;
  cloudContext: CloudContext;
  zone: string;
  name: string;
  status: LeoDiskStatus;
  auditInfo: AuditInfo;
  size: number; // In GB
  diskType: GoogleDiskType;
  blockSize: number;
  labels: LeoResourceLabels;
}

export interface RawGetDiskItem extends RawListDiskItem {
  serviceAccount: string;
  samResource: number;
  formattedBy: string | null;
}
