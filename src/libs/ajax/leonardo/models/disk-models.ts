import { AuditInfo, CloudContext, LeoResourceLabels } from 'src/libs/ajax/leonardo/models/core-models'


export type DiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced'

export interface DiskConfig {
  name: string
  size: number
  //TODO: add type when we type disks, IA-4095
  diskType: DiskType
  blockSize: number
}

export type LeoDiskStatus = 'Creating' | 'Restoring' | 'Ready' | 'Failed' | 'Deleting' | 'Deleted'

export interface DiskStatus {
  leoLabel: LeoDiskStatus
}


export const diskStatuses: { [label: string]: DiskStatus } = {
  ready: { leoLabel: 'Ready' },
  creating: { leoLabel: 'Creating' },
  restoring: { leoLabel: 'Restoring' },
  failed: { leoLabel: 'Failed' },
  deleting: { leoLabel: 'Deleting' },
  deleted: { leoLabel: 'Deleted' },
}

export interface GetDiskItem {
  id: number
  cloudContext: CloudContext
  zone: string
  name: string
  serviceAccount: string
  samResource: number
  status: LeoDiskStatus
  auditInfo: AuditInfo
  size: number //In GB
  diskType: DiskType
  blockSize: number
  labels: LeoResourceLabels
  formattedBy?: string
}

export interface ListDiskItem {
  id: number
  cloudContext: CloudContext
  zone: string
  name: string
  status: LeoDiskStatus
  auditInfo: AuditInfo
  size: number //In GB
  diskType: DiskType
  blockSize: number
  labels: LeoResourceLabels
}
export type PersistentDisk = ListDiskItem | GetDiskItem
export type AppDataDisk = PersistentDisk

export interface PdType {
  label: DiskType
  displayName: string
  regionToPricesName: string
}

export type PDLabels = 'standard' | 'balanced' | 'ssd'
export const pdTypes: Record<PDLabels, PdType> = {
  standard: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  balanced: {
    label: 'pd-balanced',
    displayName: 'Balanced',
    regionToPricesName: 'monthlyBalancedDiskPrice'
  },
  ssd: {
    label: 'pd-ssd',
    displayName: 'Solid state drive (SSD)',
    regionToPricesName: 'monthlySSDDiskPrice'
  }
}
export type DecoratedPersistentDisk = {
  diskType: PdType
} & Omit<PersistentDisk, 'diskType'>
