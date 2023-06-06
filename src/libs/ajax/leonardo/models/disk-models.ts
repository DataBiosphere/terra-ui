import { AuditInfo, CloudContext, LeoResourceLabels } from 'src/libs/ajax/leonardo/models/core-models';

export type AzureDiskType = 'Standard_LRS'; // TODO: Uncomment when enabling SSDs | 'StandardSSD_LRS';

export type GoogleDiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced';

// TODO: Use this in the select dropdown instead of the object.
// TODO: Will require refactoring in GcpComputeModal
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

export interface GooglePdType {
  value: GoogleDiskType;
  label: string;
  regionToPricesName: string;
}

export interface AzurePdType {
  value: AzureDiskType;
  label: string;
  // TODO: Pricing skuLetter: 'S'; Enable SSD types | 'E';
}

export type SharedPdType = GooglePdType | AzurePdType;
export const AzurePersistentDiskOptions: AzurePdType[] = [
  {
    value: 'Standard_LRS',
    label: 'Standard HDD',
  },
  // TODO: Disabled the SSD option and the test in
  // AzurePersistentDiskInputTest test until SSD is properly implemented and tested.
  // Main blocker: Cost calculation.
  // {
  //   value: 'StandardSSD_LRS',
  //   label: 'Standard SSD',
  // },
];

export type PDLabels = 'standard' | 'balanced' | 'ssd';
export const googlePdTypes: Record<PDLabels, GooglePdType> = {
  standard: {
    value: 'pd-standard',
    label: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  balanced: {
    value: 'pd-balanced',
    label: 'Balanced',
    regionToPricesName: 'monthlyBalancedDiskPrice',
  },
  ssd: {
    value: 'pd-ssd',
    label: 'Solid state drive (SSD)',
    regionToPricesName: 'monthlySSDDiskPrice',
  },
};
export type DecoratedPersistentDisk = {
  diskType: GooglePdType;
} & Omit<PersistentDisk, 'diskType'>;

export const GcpPersistentDiskOptions = [googlePdTypes.standard, googlePdTypes.balanced, googlePdTypes.ssd];

export interface PdSelectOption {
  value: SharedPdType;
  label: string;
}

export interface AzurePdSelectOption {
  value: AzureDiskType;
  label: string;
}

export const azureDiskSizes: number[] = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

export const isUndecoratedPersistentDisk = (disk: PersistentDisk | DecoratedPersistentDisk): disk is PersistentDisk =>
  typeof disk === 'string' && Object.values(googlePdTypes).map((pdt) => pdt.value) === disk;
