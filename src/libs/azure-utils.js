import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'


export const defaultAzureMachineType = 'Standard_DS1_v2'
export const defaultAzureDiskSize = 50
export const defaultAzureRegion = 'eastus'
//TODO: this should be fleshed out once azure region isn't limitted to workspace region
export const azureRegions = { eastus: { label: 'East US' } }
export const azureMachineTypes = { Standard_DS1_v2: { cpu: 1, ramInGb: 3.5 }, Standard_DS2_v2: { cpu: 2, ramInGb: 7 }, Standard_DS3_v2: { cpu: 4, ramInGb: 14 }, Standard_DS4_v2: { cpu: 8, ramInGb: 28 }, Standard_DS5_v2: { cpu: 16, ramInGb: 56 } }
export const getMachineTypeLabel = label => _.has(label, azureMachineTypes) ? `${label}, ${azureMachineTypes[label].cpu} CPU(s), ${azureMachineTypes[label].ramInGb} GBs` : 'Unknown machine type'
export const getRegionLabel = label => _.has(label, azureRegions) ? azureRegions[label].label : 'Unknown azure region'
