import { AuditInfo, CloudContext, LeoResourceLabels } from 'src/libs/ajax/leonardo/models/core-models';

export type AzureDiskType = 'TBD';

export type GoogleDiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced';

export type DiskType = GoogleDiskType | AzureDiskType;

export interface DiskConfig {
  name: string;
  size: number;
  diskType: DiskType;
  blockSize: number;
}

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

export interface GetDiskItem {
  id: number;
  cloudContext: CloudContext;
  zone: string;
  name: string;
  serviceAccount: string;
  samResource: number;
  status: LeoDiskStatus;
  auditInfo: AuditInfo;
  size: number; // In GB
  diskType: GoogleDiskType;
  blockSize: number;
  labels: LeoResourceLabels;
  formattedBy?: string;
}

export interface ListDiskItem {
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

export type PersistentDisk = ListDiskItem | GetDiskItem;
export type AppDataDisk = PersistentDisk;

export interface PdType {
  label: GoogleDiskType;
  displayName: string;
  regionToPricesName: string;
}

export type PDLabels = 'standard' | 'balanced' | 'ssd';
export const pdTypes: Record<PDLabels, PdType> = {
  standard: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  balanced: {
    label: 'pd-balanced',
    displayName: 'Balanced',
    regionToPricesName: 'monthlyBalancedDiskPrice',
  },
  ssd: {
    label: 'pd-ssd',
    displayName: 'Solid state drive (SSD)',
    regionToPricesName: 'monthlySSDDiskPrice',
  },
};
export type DecoratedPersistentDisk = {
  diskType: PdType;
} & Omit<PersistentDisk, 'diskType'>;

export const isUndecoratedPersistentDisk = (disk: PersistentDisk | DecoratedPersistentDisk): disk is PersistentDisk =>
  typeof disk === 'string' && Object.values(pdTypes).map((pdt) => pdt.label) === disk;
