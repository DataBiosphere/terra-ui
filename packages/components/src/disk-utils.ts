export type AzureDiskType = 'Standard_LRS'; // TODO: Uncomment when enabling SSDs | 'StandardSSD_LRS';
export type GoogleDiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced';

export interface AzurePdType {
  value: AzureDiskType;
  label: string;
  // TODO: Pricing skuLetter: 'S'; Enable SSD types | 'E';
}

export interface GooglePdType {
  value: GoogleDiskType;
  label: string;
  regionToPricesName: string;
}

export type SharedPdType = GooglePdType | AzurePdType;

export interface PdSelectOption {
  value: SharedPdType;
  label: string;
}

export interface IComputeConfig {
  masterMachineType: string;
  masterDiskSize: number;
  numberOfWorkers: number;
  numberOfPreemptibleWorkers: number;
  workerMachineType: string;
  workerDiskSize: number;
  componentGatewayEnabled: boolean;
  gpuEnabled: boolean;
  hasGpu: boolean;
  gpuType: string;
  numGpus: number;
  autopauseThreshold: number;
  computeRegion: string;
  computeZone: string;

  // Used by GCP disk select
  diskSize: number;
  diskType: GoogleDiskType;

  // Used by Azure disk select
  persistentDiskSize: number;
  persistentDiskType: SharedPdType; // TODO: Switch to DiskType
}
