export interface DiskConfig {
  name: string
  size: number
  //TODO: add type when we type disks, IA-4095
  diskType: string
  blockSize: number
}

export type AppDataDisk = any
export type PersistentDisk = any
