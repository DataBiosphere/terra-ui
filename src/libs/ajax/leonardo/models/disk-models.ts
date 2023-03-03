import { AuditInfo } from 'src/libs/ajax/leonardo/models/core-models'


export type DiskType = 'pd-standard'|'pd-balanced'|'pd-ssd';

export interface DiskConfig {
  name: string
  size: number
  //TODO: add type when we type disks, IA-4095
  diskType: string
  blockSize: number
}

export type DataDiskStatusType = 'Ready'|'';//TODO: add more

export interface AppDataDisk {
  blockSize: number
  diskType: DiskType
  id: number
  auditInfo: AuditInfo
  googleProject: string
  labels: {
    saturnApplication: string
    saturnWorkspaceName: string
  }
  name: string
  size: number
  status: DataDiskStatusType
  zone: string
}
export type PersistentDisk = any
