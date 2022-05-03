import _ from 'lodash/fp'


export const defaultAzureMachineType = 'Standard_DS1_v2'
export const defaultAzureDiskSize = 50
export const defaultAzureRegion = 'eastus'

export const defaultAzureComputeConfig = {
  machineType: defaultAzureMachineType,
  diskSize: defaultAzureDiskSize,
  region: defaultAzureRegion
}

//TODO: this should be fleshed out once azure region isn't limited to workspace region
export const azureRegions = { eastus: { label: 'East US' } }
export const getRegionLabel = key => _.has(key, azureRegions) ? azureRegions[key].label : 'Unknown azure region'

export const azureMachineTypes = { Standard_DS1_v2: { cpu: 1, ramInGb: 3.5 }, Standard_DS2_v2: { cpu: 2, ramInGb: 7 }, Standard_DS3_v2: { cpu: 4, ramInGb: 14 }, Standard_DS4_v2: { cpu: 8, ramInGb: 28 }, Standard_DS5_v2: { cpu: 16, ramInGb: 56 } }
export const getMachineTypeLabel = key => _.has(key, azureMachineTypes) ? `${key}, ${azureMachineTypes[key].cpu} CPU(s), ${azureMachineTypes[key].ramInGb} GBs` : 'Unknown machine type'

