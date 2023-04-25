import _ from 'lodash/fp'


export const azureWarningText = 'Do not store Unclassified Confidential Information in this platform, it violates US Federal Policy (ie FISMA, FIPS-199, etc) unless explicitly authorized by the dataset manager or governed by your own agreements.'

// AZURE REGIONS, COMPUTE TYPES, STORAGE TYPES AND PRICING

export const defaultAzureMachineType = 'Standard_DS2_v2'
export const defaultAzureDiskSize = 50
export const defaultAzureRegion = 'eastus'

export const defaultAzureComputeConfig = {
  machineType: defaultAzureMachineType,
  diskSize: defaultAzureDiskSize,
  region: defaultAzureRegion,
}

// TODO [] other countries' flags
const azureRegions = {
  eastus: { flag: '🇺🇸', label: 'East US' },
  eastus2: { flag: '🇺🇸', label: 'East US 2' },
  southcentralus: { flag: '🇺🇸', label: 'South Central US' },
  westus2: { flag: '🇺🇸', label: 'West US 2' },
  westus3: { flag: '🇺🇸', label: 'West US 3' },
  australiaeast: { flag: '', label: 'Australia East' },
  southeastasia: { flag: '', label: 'Southeast Asia' },
  northeurope: { flag: '', label: 'North Europe' },
  swedencentral: { flag: '', label: 'Sweden Central' },
  uksouth: { flag: '', label: 'UK South' },
  westeurope: { flag: '', label: 'West Europe' },
  centralus: { flag: '🇺🇸', label: 'Central US' },
  southafricanorth: { flag: '', label: 'South Africa North' },
  centralindia: { flag: '', label: 'Central India' },
  eastasia: { flag: '', label: 'East Asia' },
  japaneast: { flag: '', label: 'Japan East' },
  koreacentral: { flag: '', label: 'Korea Central' },
  canadacentral: { flag: '', label: 'Canada Central' },
  francecentral: { flag: '', label: 'France Central' },
  germanywestcentral: { flag: '', label: 'Germany West Central' },
  norwayeast: { flag: '', label: 'Norway East' },
  switzerlandnorth: { flag: '', label: 'Switzerland North' },
  uaenorth: { flag: '', label: 'UAE North' },
  brazilsouth: { flag: '', label: 'Brazil South' },
  eastus2euap: { flag: '🇺🇸', label: 'East US 2 EUAP' },
  qatarcentral: { flag: '', label: 'Qatar Central' },
  centralusstage: { flag: '🇺🇸', label: 'Central US (Stage)' },
  eastusstage: { flag: '🇺🇸', label: 'East US (Stage)' },
  eastus2stage: { flag: '🇺🇸', label: 'East US 2 (Stage)' },
  northcentralusstage: { flag: '🇺🇸', label: 'North Central US (Stage)' },
  southcentralusstage: { flag: '🇺🇸', label: 'South Central US (Stage)' },
  westusstage: { flag: '🇺🇸', label: 'West US (Stage)' },
  westus2stage: { flag: '🇺🇸', label: 'West US 2 (Stage)' },
  asia: { flag: '', label: 'Asia' },
  asiapacific: { flag: '', label: 'Asia Pacific' },
  australia: { flag: '', label: 'Australia' },
  brazil: { flag: '', label: 'Brazil' },
  canada: { flag: '', label: 'Canada' },
  europe: { flag: '', label: 'Europe' },
  france: { flag: '', label: 'France' },
  germany: { flag: '', label: 'Germany' },
  global: { flag: '', label: 'Global' },
  india: { flag: '', label: 'India' },
  japan: { flag: '', label: 'Japan' },
  korea: { flag: '', label: 'Korea' },
  norway: { flag: '', label: 'Norway' },
  singapore: { flag: '', label: 'Singapore' },
  southafrica: { flag: '', label: 'South Africa' },
  switzerland: { flag: '', label: 'Switzerland' },
  uae: { flag: '', label: 'United Arab Emirates' },
  uk: { flag: '', label: 'United Kingdom' },
  unitedstates: { flag: '', label: 'United States' },
  unitedstateseuap: { flag: '', label: 'United States EUAP' },
  eastasiastage: { flag: '', label: 'East Asia (Stage)' },
  southeastasiastage: { flag: '', label: 'Southeast Asia (Stage)' },
  eastusstg: { flag: '🇺🇸', label: 'East US STG' },
  northcentralus: { flag: '🇺🇸', label: 'North Central US' },
  westus: { flag: '🇺🇸', label: 'West US' },
  jioindiawest: { flag: '', label: 'Jio India West' },
  centraluseuap: { flag: '🇺🇸', label: 'Central US EUAP' },
  westcentralus: { flag: '🇺🇸', label: 'West Central US' },
  southafricawest: { flag: '', label: 'South Africa West' },
  australiacentral: { flag: '', label: 'Australia Central' },
  australiacentral2: { flag: '', label: 'Australia Central 2' },
  australiasoutheast: { flag: '', label: 'Australia Southeast' },
  japanwest: { flag: '', label: 'Japan West' },
  jioindiacentral: { flag: '', label: 'Jio India Central' },
  koreasouth: { flag: '', label: 'Korea South' },
  southindia: { flag: '', label: 'South India' },
  westindia: { flag: '', label: 'West India' },
  canadaeast: { flag: '', label: 'Canada East' },
  francesouth: { flag: '', label: 'France South' },
  germanynorth: { flag: '', label: 'Germany North' },
  norwaywest: { flag: '', label: 'Norway West' },
  switzerlandwest: { flag: '', label: 'Switzerland West' },
  ukwest: { flag: '', label: 'UK West' },
  uaecentral: { flag: '', label: 'UAE Central' },
  brazilsoutheast: { flag: '', label: 'Brazil Southeast' },
}
export const getRegionLabel = key => _.has(key, azureRegions) ? azureRegions[key].label : 'Unknown azure region'
export const getRegionFlag = key => _.has(key, azureRegions) ? azureRegions[key].flag : '❓'

export const azureMachineTypes = { Standard_DS2_v2: { cpu: 2, ramInGb: 7 }, Standard_DS3_v2: { cpu: 4, ramInGb: 14 }, Standard_DS4_v2: { cpu: 8, ramInGb: 28 }, Standard_DS5_v2: { cpu: 16, ramInGb: 56 } }
export const getMachineTypeLabel = key => _.has(key, azureMachineTypes) ? `${key}, ${azureMachineTypes[key].cpu} CPU(s), ${azureMachineTypes[key].ramInGb} GBs` : 'Unknown machine type'


export const azureDiskTypes = {
  standard: {
    value: 'STANDARD_LRS',
    displayName: 'Standard HDD'
  }
}

// max GB of each azure standard storage disk; per https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types#standard-hdds
export const azureStandardDiskTypes = {
  'S4 LRS': {
    label: 'S4 LRS',
    size: 32,
  },
  'S6 LRS': {
    label: 'S6 LRS',
    size: 64,
  },
  'S10 LRS': {
    label: 'S10 LRS',
    size: 128,
  },
  'S15 LRS': {
    label: 'S15 LRS',
    size: 256
  },
  'S20 LRS': {
    label: 'S20 LRS',
    size: 512
  },
  'S30 LRS': {
    label: 'S30 LRS',
    size: 1024
  },
  'S40 LRS': {
    label: 'S40 LRS',
    size: 2048
  },
  'S50 LRS': {
    label: 'S50 LRS',
    size: 4096
  },
  'S60 LRS': {
    label: 'S60 LRS',
    size: 8192
  },
  'S70 LRS': {
    label: 'S70 LRS',
    size: 16384
  },
  'S80 LRS': {
    label: 'S80 LRS',
    size: 32767
  }
}


export const azureDiskTypeToOffering = {
  STANDARD_LRS: azureStandardDiskTypes
}

/** Get Azure disk type (S4, S6 etc) whose storage is large enough to hold the requested size (in Gb).
 * Note that the largest (S80 LRS) will not hold more than 32767 Gb, according to the Azure docs.
 * TODO [IA-3390] calculate differently
 */
export const getDiskType = diskSize => _.findKey(diskType => diskSize <= diskType.size, azureStandardDiskTypes)

// TODO [IA-4007] Explore replacing the hardcoded, manually synced script output below with a dynamic solution for price quotes.

// Storage prices below are monthly; see https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types#standard-hdds
// Compute prices below are hourly, per https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/#pricing.
// The data below comes from Azure's pricing API: https://prices.azure.com/api/retail/prices
// There is a script available at https://github.com/broadinstitute/dsp-scripts/blob/master/terra-ui/regionality/parse_pricing_api_azure.py.
// It parses the API and outputs the response data.
const azureRegionToPrices = [
  {
    name: 'Global', Standard_DS15_v2: 1.023
  },
  {
    name: 'attatlanta1', Standard_DS5_v2: 1.237, Standard_DS4_v2: 0.618, Standard_DS3_v2: 0.309, Standard_DS2_v2: 0.155, Standard_DS1_v2: 0.0773, Standard_DS15i_v2: 1.963, Standard_DS15_v2: 1.963, Standard_DS14_v2: 1.57, 'Standard_DS14-8_v2': 1.57, 'Standard_DS14-4_v2': 1.57, Standard_DS13_v2: 0.785, 'Standard_DS13-4_v2': 0.785, 'Standard_DS13-2_v2': 0.785, Standard_DS12_v2: 0.393, 'Standard_DS12-2_v2': 0.393, 'Standard_DS12-1_v2': 0.393, Standard_DS11_v2: 0.195, 'Standard_DS11-1_v2': 0.195, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'attdallas1', Standard_DS5_v2: 1.372, Standard_DS4_v2: 0.686, Standard_DS3_v2: 0.343, Standard_DS2_v2: 0.171, Standard_DS1_v2: 0.0857, Standard_DS15i_v2: 2.177, Standard_DS15_v2: 2.177, Standard_DS14_v2: 1.742, 'Standard_DS14-8_v2': 1.742, 'Standard_DS14-4_v2': 1.742, Standard_DS13_v2: 0.871, 'Standard_DS13-4_v2': 0.871, 'Standard_DS13-2_v2': 0.871, Standard_DS12_v2: 0.435, 'Standard_DS12-2_v2': 0.435, 'Standard_DS12-1_v2': 0.435, Standard_DS11_v2: 0.216, 'Standard_DS11-1_v2': 0.216, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'attdetroit1', Standard_DS5_v2: 0.916, Standard_DS4_v2: 0.458, Standard_DS3_v2: 0.229, Standard_DS2_v2: 0.114, Standard_DS1_v2: 0.0572, Standard_DS15i_v2: 1.495, Standard_DS15_v2: 1.495, Standard_DS14_v2: 1.196, 'Standard_DS14-8_v2': 1.196, 'Standard_DS14-4_v2': 1.196, Standard_DS13_v2: 0.598, 'Standard_DS13-4_v2': 0.598, 'Standard_DS13-2_v2': 0.598, Standard_DS12_v2: 0.299, 'Standard_DS12-2_v2': 0.299, 'Standard_DS12-1_v2': 0.299, Standard_DS11_v2: 0.149, 'Standard_DS11-1_v2': 0.149
  },
  {
    name: 'attnewyork1', Standard_DS5_v2: 0.916, Standard_DS4_v2: 0.458, Standard_DS3_v2: 0.229, Standard_DS2_v2: 0.114, Standard_DS1_v2: 0.0572, Standard_DS15i_v2: 1.495, Standard_DS15_v2: 1.495, Standard_DS14_v2: 1.196, 'Standard_DS14-8_v2': 1.196, 'Standard_DS14-4_v2': 1.196, Standard_DS13_v2: 0.598, 'Standard_DS13-4_v2': 0.598, 'Standard_DS13-2_v2': 0.598, Standard_DS12_v2: 0.299, 'Standard_DS12-2_v2': 0.299, 'Standard_DS12-1_v2': 0.299, Standard_DS11_v2: 0.149, 'Standard_DS11-1_v2': 0.149
  },
  {
    name: 'australiacentral', Standard_DS5_v2: 1.345, Standard_DS4_v2: 0.673, Standard_DS3_v2: 0.336, Standard_DS2_v2: 0.168, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 2097.15, 'S70 LRS': 1048.58, 'S60 LRS': 524.29, 'S6 LRS': 4.8128, 'S50 LRS': 262.14, 'S40 LRS': 131.07, 'S4 LRS': 2.4576, 'S30 LRS': 65.536, 'S20 LRS': 34.816, 'S15 LRS': 18.1248, 'S10 LRS': 9.4208
  },
  {
    name: 'australiacentral2', Standard_DS5_v2: 1.345, Standard_DS4_v2: 0.673, Standard_DS3_v2: 0.336, Standard_DS2_v2: 0.168, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 2097.15, 'S70 LRS': 1048.58, 'S60 LRS': 524.29, 'S6 LRS': 4.8128, 'S50 LRS': 262.14, 'S40 LRS': 131.07, 'S4 LRS': 2.4576, 'S30 LRS': 65.536, 'S20 LRS': 34.816, 'S15 LRS': 18.1248, 'S10 LRS': 9.4208
  },
  {
    name: 'australiaeast', Standard_DS5_v2: 1.345, Standard_DS4_v2: 0.673, Standard_DS3_v2: 0.336, Standard_DS2_v2: 0.168, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 2097.15, 'S70 LRS': 1048.58, 'S60 LRS': 524.29, 'S6 LRS': 4.8128, 'S50 LRS': 262.144, 'S40 LRS': 131.072, 'S4 LRS': 2.4576, 'S30 LRS': 65.536, 'S20 LRS': 34.816, 'S15 LRS': 18.1248, 'S10 LRS': 9.4208
  },
  {
    name: 'australiasoutheast', Standard_DS5_v2: 1.246, Standard_DS4_v2: 0.623, Standard_DS3_v2: 0.311, Standard_DS2_v2: 0.15576, Standard_DS1_v2: 0.0778, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 2097.15, 'S70 LRS': 1048.58, 'S60 LRS': 524.29, 'S6 LRS': 4.8128, 'S50 LRS': 262.144, 'S40 LRS': 131.072, 'S4 LRS': 2.4576, 'S30 LRS': 65.536, 'S20 LRS': 34.816, 'S15 LRS': 18.1248, 'S10 LRS': 9.4208
  },
  {
    name: 'brazilsouth', Standard_DS5_v2: 1.37, Standard_DS4_v2: 0.685, Standard_DS3_v2: 0.343, Standard_DS2_v2: 0.171, Standard_DS1_v2: 0.0856, Standard_DS15i_v2: 2.349, Standard_DS15_v2: 2.349, Standard_DS14_v2: 1.879, 'Standard_DS14-8_v2': 1.879, 'Standard_DS14-4_v2': 1.879, Standard_DS13_v2: 0.94, 'Standard_DS13-4_v2': 0.94, 'Standard_DS13-2_v2': 0.94, Standard_DS12_v2: 0.47, 'Standard_DS12-2_v2': 0.47, 'Standard_DS12-1_v2': 0.47, Standard_DS11_v2: 0.235, 'Standard_DS11-1_v2': 0.235, 'S80 LRS': 3145.73, 'S70 LRS': 1572.86, 'S60 LRS': 786.43, 'S6 LRS': 7.2192, 'S50 LRS': 393.216, 'S40 LRS': 196.608, 'S4 LRS': 3.6864, 'S30 LRS': 98.304, 'S20 LRS': 52.224, 'S15 LRS': 27.1872, 'S10 LRS': 14.1312
  },
  {
    name: 'brazilsoutheast', Standard_DS5_v2: 1.78, Standard_DS4_v2: 0.89, Standard_DS3_v2: 0.445, Standard_DS2_v2: 0.223, Standard_DS1_v2: 0.111, Standard_DS15i_v2: 3.054, Standard_DS15_v2: 3.054, Standard_DS14_v2: 2.443, 'Standard_DS14-8_v2': 2.443, 'Standard_DS14-4_v2': 2.443, Standard_DS13_v2: 1.222, 'Standard_DS13-4_v2': 1.222, 'Standard_DS13-2_v2': 1.222, Standard_DS12_v2: 0.611, 'Standard_DS12-2_v2': 0.611, 'Standard_DS12-1_v2': 0.611, Standard_DS11_v2: 0.306, 'Standard_DS11-1_v2': 0.306, 'S90 LRS': 8178.898, 'S80 LRS': 4089.449, 'S70 LRS': 2044.718, 'S60 LRS': 1022.359, 'S6 LRS': 9.385, 'S50 LRS': 511.186, 'S40 LRS': 255.593, 'S4 LRS': 4.79232, 'S30 LRS': 127.7952, 'S20 LRS': 67.8912, 'S15 LRS': 35.343, 'S10 LRS': 18.371
  },
  {
    name: 'canadacentral', Standard_DS5_v2: 1.12, Standard_DS4_v2: 0.56, Standard_DS3_v2: 0.28, Standard_DS2_v2: 0.14, Standard_DS1_v2: 0.07, Standard_DS15i_v2: 1.829, Standard_DS15_v2: 1.829, Standard_DS14_v2: 1.463, 'Standard_DS14-8_v2': 1.463, 'Standard_DS14-4_v2': 1.463, Standard_DS13_v2: 0.732, 'Standard_DS13-4_v2': 0.732, 'Standard_DS13-2_v2': 0.732, Standard_DS12_v2: 0.366, 'Standard_DS12-2_v2': 0.366, 'Standard_DS12-1_v2': 0.366, Standard_DS11_v2: 0.183, 'Standard_DS11-1_v2': 0.183, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.309, 'S50 LRS': 180.22, 'S40 LRS': 90.112, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.461, 'S10 LRS': 6.477
  },
  {
    name: 'canadaeast', Standard_DS5_v2: 1.12, Standard_DS4_v2: 0.56, Standard_DS3_v2: 0.28, Standard_DS2_v2: 0.14, Standard_DS1_v2: 0.07, Standard_DS15i_v2: 1.829, Standard_DS15_v2: 1.829, Standard_DS14_v2: 1.463, 'Standard_DS14-8_v2': 1.463, 'Standard_DS14-4_v2': 1.463, Standard_DS13_v2: 0.732, 'Standard_DS13-4_v2': 0.732, 'Standard_DS13-2_v2': 0.732, Standard_DS12_v2: 0.366, 'Standard_DS12-2_v2': 0.366, 'Standard_DS12-1_v2': 0.366, Standard_DS11_v2: 0.183, 'Standard_DS11-1_v2': 0.183, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.309, 'S50 LRS': 180.224, 'S40 LRS': 90.112, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.4608, 'S10 LRS': 6.477
  },
  {
    name: 'centralindia', Standard_DS5_v2: 1.35, Standard_DS4_v2: 0.675, Standard_DS3_v2: 0.337, Standard_DS2_v2: 0.169, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.895, Standard_DS15_v2: 1.895, Standard_DS14_v2: 1.516, 'Standard_DS14-8_v2': 1.516, 'Standard_DS14-4_v2': 1.516, Standard_DS13_v2: 0.758, 'Standard_DS13-4_v2': 0.758, 'Standard_DS13-2_v2': 0.758, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.189, 'Standard_DS11-1_v2': 0.189, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.3088, 'S50 LRS': 180.224, 'S40 LRS': 90.112, 'S4 LRS': 1.6896, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.4608, 'S10 LRS': 6.4768
  },
  {
    name: 'centralus', Standard_DS5_v2: 1.17, Standard_DS4_v2: 0.585, Standard_DS3_v2: 0.293, Standard_DS2_v2: 0.146, Standard_DS1_v2: 0.073, Standard_DS15i_v2: 1.853, Standard_DS15_v2: 1.853, Standard_DS14_v2: 1.482, 'Standard_DS14-8_v2': 1.482, 'Standard_DS14-4_v2': 1.482, Standard_DS13_v2: 0.741, 'Standard_DS13-4_v2': 0.741, 'Standard_DS13-2_v2': 0.741, Standard_DS12_v2: 0.371, 'Standard_DS12-2_v2': 0.371, 'Standard_DS12-1_v2': 0.371, Standard_DS11_v2: 0.185, 'Standard_DS11-1_v2': 0.185, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'eastasia', Standard_DS5_v2: 1.714, Standard_DS4_v2: 0.857, Standard_DS3_v2: 0.428, Standard_DS2_v2: 0.214, Standard_DS1_v2: 0.107, Standard_DS15i_v2: 2.294, Standard_DS15_v2: 2.294, Standard_DS14_v2: 1.835, 'Standard_DS14-8_v2': 1.835, 'Standard_DS14-4_v2': 1.835, Standard_DS13_v2: 0.918, 'Standard_DS13-4_v2': 0.918, 'Standard_DS13-2_v2': 0.918, Standard_DS12_v2: 0.459, 'Standard_DS12-2_v2': 0.459, 'Standard_DS12-1_v2': 0.459, Standard_DS11_v2: 0.229, 'Standard_DS11-1_v2': 0.229, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'eastus', Standard_DS5_v2: 1.17, Standard_DS4_v2: 0.585, Standard_DS3_v2: 0.293, Standard_DS2_v2: 0.146, Standard_DS1_v2: 0.073, Standard_DS15i_v2: 1.853, Standard_DS15_v2: 1.853, Standard_DS14_v2: 1.482, 'Standard_DS14-8_v2': 1.482, 'Standard_DS14-4_v2': 1.482, Standard_DS13_v2: 0.741, 'Standard_DS13-4_v2': 0.741, 'Standard_DS13-2_v2': 0.741, Standard_DS12_v2: 0.371, 'Standard_DS12-2_v2': 0.371, 'Standard_DS12-1_v2': 0.371, Standard_DS11_v2: 0.185, 'Standard_DS11-1_v2': 0.185, 'S80 LRS': 953.55, 'S70 LRS': 491.52, 'S60 LRS': 262.14, 'S6 LRS': 3.008, 'S50 LRS': 143.36, 'S40 LRS': 77.824, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'eastus2', Standard_DS5_v2: 0.916, Standard_DS4_v2: 0.458, Standard_DS3_v2: 0.229, Standard_DS2_v2: 0.114, Standard_DS1_v2: 0.057, Standard_DS15i_v2: 1.495, Standard_DS15_v2: 1.495, Standard_DS14_v2: 1.196, 'Standard_DS14-8_v2': 1.196, 'Standard_DS14-4_v2': 1.196, Standard_DS13_v2: 0.598, 'Standard_DS13-4_v2': 0.598, 'Standard_DS13-2_v2': 0.598, Standard_DS12_v2: 0.299, 'Standard_DS12-2_v2': 0.299, 'Standard_DS12-1_v2': 0.299, Standard_DS11_v2: 0.149, 'Standard_DS11-1_v2': 0.149, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'francecentral', Standard_DS5_v2: 1.404, Standard_DS4_v2: 0.702, Standard_DS3_v2: 0.351, Standard_DS2_v2: 0.175, Standard_DS1_v2: 0.0877, Standard_DS15i_v2: 2.343, Standard_DS15_v2: 2.343, Standard_DS14_v2: 1.874, 'Standard_DS14-8_v2': 1.874, 'Standard_DS14-4_v2': 1.874, Standard_DS13_v2: 0.937, 'Standard_DS13-4_v2': 0.937, 'Standard_DS13-2_v2': 0.937, Standard_DS12_v2: 0.469, 'Standard_DS12-2_v2': 0.469, 'Standard_DS12-1_v2': 0.469, Standard_DS11_v2: 0.234, 'Standard_DS11-1_v2': 0.234, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.308, 'S50 LRS': 157.67652, 'S40 LRS': 85.595826, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.476
  },
  {
    name: 'francesouth', Standard_DS5_v2: 1.824, Standard_DS4_v2: 0.912, Standard_DS3_v2: 0.456, Standard_DS2_v2: 0.228, Standard_DS1_v2: 0.114, Standard_DS15i_v2: 3.042, Standard_DS15_v2: 3.042, Standard_DS14_v2: 2.434, 'Standard_DS14-8_v2': 2.434, 'Standard_DS14-4_v2': 2.434, Standard_DS13_v2: 1.217, 'Standard_DS13-4_v2': 1.217, 'Standard_DS13-2_v2': 1.217, Standard_DS12_v2: 0.608, 'Standard_DS12-2_v2': 0.608, 'Standard_DS12-1_v2': 0.608, Standard_DS11_v2: 0.304, 'Standard_DS11-1_v2': 0.304, 'S80 LRS': 1499.28, 'S70 LRS': 749.64, 'S60 LRS': 327.68, 'S6 LRS': 4.3004, 'S50 LRS': 204.979476, 'S40 LRS': 111.274573, 'S4 LRS': 2.197, 'S30 LRS': 58.5728, 'S20 LRS': 31.1168, 'S15 LRS': 16.197038, 'S10 LRS': 8.4188
  },
  {
    name: 'germanynorth', Standard_DS5_v2: 1.394, Standard_DS4_v2: 0.697, Standard_DS3_v2: 0.348, Standard_DS2_v2: 0.174, Standard_DS1_v2: 0.0871, Standard_DS15i_v2: 2.158, Standard_DS15_v2: 2.158, Standard_DS14_v2: 1.726, 'Standard_DS14-8_v2': 1.726, 'Standard_DS14-4_v2': 1.726, Standard_DS13_v2: 0.863, 'Standard_DS13-4_v2': 0.863, 'Standard_DS13-2_v2': 0.863, Standard_DS12_v2: 0.432, 'Standard_DS12-2_v2': 0.432, 'Standard_DS12-1_v2': 0.432, Standard_DS11_v2: 0.216, 'Standard_DS11-1_v2': 0.216, 'S80 LRS': 1487.538, 'S70 LRS': 766.7712, 'S60 LRS': 408.9384, 'S6 LRS': 3.91, 'S50 LRS': 212.99, 'S40 LRS': 106.5, 'S4 LRS': 1.997, 'S30 LRS': 53.248, 'S20 LRS': 28.288, 'S15 LRS': 14.726, 'S10 LRS': 7.654
  },
  {
    name: 'germanywestcentral', Standard_DS5_v2: 1.064, Standard_DS4_v2: 0.532, Standard_DS3_v2: 0.266, Standard_DS2_v2: 0.133, Standard_DS1_v2: 0.067, Standard_DS15i_v2: 1.66, Standard_DS15_v2: 1.66, Standard_DS14_v2: 1.328, 'Standard_DS14-8_v2': 1.328, 'Standard_DS14-4_v2': 1.328, Standard_DS13_v2: 0.664, 'Standard_DS13-4_v2': 0.664, 'Standard_DS13-2_v2': 0.664, Standard_DS12_v2: 0.332, 'Standard_DS12-2_v2': 0.332, 'Standard_DS12-1_v2': 0.332, Standard_DS11_v2: 0.166, 'Standard_DS11-1_v2': 0.166, 'S80 LRS': 1144.26, 'S70 LRS': 589.824, 'S60 LRS': 314.568, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'japaneast', Standard_DS5_v2: 1.636, Standard_DS4_v2: 0.818, Standard_DS3_v2: 0.409, Standard_DS2_v2: 0.205, Standard_DS1_v2: 0.102, Standard_DS15i_v2: 2.294, Standard_DS15_v2: 2.294, Standard_DS14_v2: 1.835, 'Standard_DS14-8_v2': 1.835, 'Standard_DS14-4_v2': 1.835, Standard_DS13_v2: 0.918, 'Standard_DS13-4_v2': 0.918, 'Standard_DS13-2_v2': 0.918, Standard_DS12_v2: 0.459, 'Standard_DS12-2_v2': 0.459, 'Standard_DS12-1_v2': 0.459, Standard_DS11_v2: 0.229, 'Standard_DS11-1_v2': 0.229, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'japanwest', Standard_DS5_v2: 1.459, Standard_DS4_v2: 0.729, Standard_DS3_v2: 0.365, Standard_DS2_v2: 0.182, Standard_DS1_v2: 0.091, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'jioindiacentral', Standard_DS5_v2: 1.35, Standard_DS4_v2: 0.675, Standard_DS3_v2: 0.337, Standard_DS2_v2: 0.169, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.895, Standard_DS15_v2: 1.895, Standard_DS14_v2: 1.516, 'Standard_DS14-8_v2': 1.516, 'Standard_DS14-4_v2': 1.516, Standard_DS13_v2: 0.758, 'Standard_DS13-4_v2': 0.758, 'Standard_DS13-2_v2': 0.758, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.189, 'Standard_DS11-1_v2': 0.189, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.3088, 'S50 LRS': 180.224, 'S40 LRS': 90.112, 'S4 LRS': 1.6896, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.4608, 'S10 LRS': 6.4768
  },
  {
    name: 'jioindiawest', Standard_DS5_v2: 1.35, Standard_DS4_v2: 0.675, Standard_DS3_v2: 0.337, Standard_DS2_v2: 0.169, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.895, Standard_DS15_v2: 1.895, Standard_DS14_v2: 1.516, 'Standard_DS14-8_v2': 1.516, 'Standard_DS14-4_v2': 1.516, Standard_DS13_v2: 0.758, 'Standard_DS13-4_v2': 0.758, 'Standard_DS13-2_v2': 0.758, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.189, 'Standard_DS11-1_v2': 0.189, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.3088, 'S50 LRS': 180.224, 'S40 LRS': 90.112, 'S4 LRS': 1.6896, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.4608, 'S10 LRS': 6.4768
  },
  {
    name: 'koreacentral', Standard_DS5_v2: 1.321, Standard_DS4_v2: 0.66, Standard_DS3_v2: 0.33, Standard_DS2_v2: 0.165, Standard_DS1_v2: 0.0825, Standard_DS15i_v2: 1.995, Standard_DS15_v2: 1.995, Standard_DS14_v2: 1.596, 'Standard_DS14-8_v2': 1.596, 'Standard_DS14-4_v2': 1.596, Standard_DS13_v2: 0.798, 'Standard_DS13-4_v2': 0.798, 'Standard_DS13-2_v2': 0.798, Standard_DS12_v2: 0.399, 'Standard_DS12-2_v2': 0.399, 'Standard_DS12-1_v2': 0.399, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'koreasouth', Standard_DS5_v2: 1.189, Standard_DS4_v2: 0.594, Standard_DS3_v2: 0.297, Standard_DS2_v2: 0.149, Standard_DS1_v2: 0.074, Standard_DS15i_v2: 1.794, Standard_DS15_v2: 1.794, Standard_DS14_v2: 1.435, 'Standard_DS14-8_v2': 1.435, 'Standard_DS14-4_v2': 1.435, Standard_DS13_v2: 0.718, 'Standard_DS13-4_v2': 0.718, 'Standard_DS13-2_v2': 0.718, Standard_DS12_v2: 0.359, 'Standard_DS12-2_v2': 0.359, 'Standard_DS12-1_v2': 0.359, Standard_DS11_v2: 0.179, 'Standard_DS11-1_v2': 0.179, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'northcentralus', Standard_DS5_v2: 1.17, Standard_DS4_v2: 0.585, Standard_DS3_v2: 0.293, Standard_DS2_v2: 0.146, Standard_DS1_v2: 0.073, Standard_DS15i_v2: 1.852, Standard_DS15_v2: 1.852, Standard_DS14_v2: 1.482, 'Standard_DS14-8_v2': 1.482, 'Standard_DS14-4_v2': 1.482, Standard_DS13_v2: 0.741, 'Standard_DS13-4_v2': 0.741, 'Standard_DS13-2_v2': 0.741, Standard_DS12_v2: 0.37, 'Standard_DS12-2_v2': 0.37, 'Standard_DS12-1_v2': 0.37, Standard_DS11_v2: 0.185, 'Standard_DS11-1_v2': 0.185, 'S80 LRS': 1048.58, 'S70 LRS': 524.29, 'S60 LRS': 262.14, 'S6 LRS': 3.008, 'S50 LRS': 143.36, 'S40 LRS': 77.824, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'northeurope', Standard_DS5_v2: 1.053, Standard_DS4_v2: 0.527, Standard_DS3_v2: 0.263, Standard_DS2_v2: 0.132, Standard_DS1_v2: 0.0658, Standard_DS15i_v2: 1.853, Standard_DS15_v2: 1.853, Standard_DS14_v2: 1.482, 'Standard_DS14-8_v2': 1.482, 'Standard_DS14-4_v2': 1.482, Standard_DS13_v2: 0.741, 'Standard_DS13-4_v2': 0.741, 'Standard_DS13-2_v2': 0.741, Standard_DS12_v2: 0.371, 'Standard_DS12-2_v2': 0.371, 'Standard_DS12-1_v2': 0.371, Standard_DS11_v2: 0.185, 'Standard_DS11-1_v2': 0.185, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'norwayeast', Standard_DS5_v2: 1.196, Standard_DS4_v2: 0.598, Standard_DS3_v2: 0.299, Standard_DS2_v2: 0.15, Standard_DS1_v2: 0.0747, Standard_DS15i_v2: 2.087, Standard_DS15_v2: 2.087, Standard_DS14_v2: 1.67, 'Standard_DS14-8_v2': 1.67, 'Standard_DS14-4_v2': 1.67, Standard_DS13_v2: 0.835, 'Standard_DS13-4_v2': 0.835, 'Standard_DS13-2_v2': 0.835, Standard_DS12_v2: 0.417, 'Standard_DS12-2_v2': 0.417, 'Standard_DS12-1_v2': 0.417, Standard_DS11_v2: 0.209, 'Standard_DS11-1_v2': 0.209, 'S90 LRS': 1441.79, 'S80 LRS': 1441.79, 'S70 LRS': 720.9, 'S60 LRS': 360.45, 'S6 LRS': 3.309, 'S50 LRS': 180.22, 'S40 LRS': 90.112, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.461, 'S10 LRS': 6.477
  },
  {
    name: 'norwaywest', Standard_DS5_v2: 1.554, Standard_DS4_v2: 0.778, Standard_DS3_v2: 0.389, Standard_DS2_v2: 0.194, Standard_DS1_v2: 0.0971, Standard_DS15i_v2: 2.713, Standard_DS15_v2: 2.713, Standard_DS14_v2: 2.171, 'Standard_DS14-8_v2': 2.171, 'Standard_DS14-4_v2': 2.171, Standard_DS13_v2: 1.085, 'Standard_DS13-4_v2': 1.085, 'Standard_DS13-2_v2': 1.085, Standard_DS12_v2: 0.542, 'Standard_DS12-2_v2': 0.542, 'Standard_DS12-1_v2': 0.542, Standard_DS11_v2: 0.272, 'Standard_DS11-1_v2': 0.272, 'S90 LRS': 1874.33, 'S80 LRS': 1874.33, 'S70 LRS': 937.16, 'S60 LRS': 468.58, 'S6 LRS': 4.301, 'S50 LRS': 234.29, 'S40 LRS': 117.15, 'S4 LRS': 2.196, 'S30 LRS': 58.573, 'S20 LRS': 31.117, 'S15 LRS': 16.199, 'S10 LRS': 8.42
  },
  {
    name: 'qatarcentral', Standard_DS5_v2: 1.099, Standard_DS4_v2: 0.55, Standard_DS3_v2: 0.275, Standard_DS2_v2: 0.137, Standard_DS1_v2: 0.0687, Standard_DS15i_v2: 1.794, Standard_DS15_v2: 1.794, Standard_DS14_v2: 1.435, 'Standard_DS14-8_v2': 1.435, 'Standard_DS14-4_v2': 1.435, Standard_DS13_v2: 0.718, 'Standard_DS13-4_v2': 0.718, 'Standard_DS13-2_v2': 0.718, Standard_DS12_v2: 0.359, 'Standard_DS12-2_v2': 0.359, 'Standard_DS12-1_v2': 0.359, Standard_DS11_v2: 0.179, 'Standard_DS11-1_v2': 0.179, 'S90 LRS': 1572.864, 'S80 LRS': 1258.29, 'S70 LRS': 629.15, 'S60 LRS': 314.57, 'S6 LRS': 3.6096, 'S50 LRS': 172.03, 'S40 LRS': 93.389, 'S4 LRS': 1.8432, 'S30 LRS': 49.152, 'S20 LRS': 26.112, 'S15 LRS': 13.5936, 'S10 LRS': 7.0656
  },
  {
    name: 'southafricanorth', Standard_DS5_v2: 1.227, Standard_DS4_v2: 0.614, Standard_DS3_v2: 0.307, Standard_DS2_v2: 0.153, Standard_DS1_v2: 0.0767, Standard_DS15i_v2: 2.003, Standard_DS15_v2: 2.003, Standard_DS14_v2: 1.603, 'Standard_DS14-8_v2': 1.603, 'Standard_DS14-4_v2': 1.603, Standard_DS13_v2: 0.801, 'Standard_DS13-4_v2': 0.801, 'Standard_DS13-2_v2': 0.801, Standard_DS12_v2: 0.401, 'Standard_DS12-2_v2': 0.401, 'Standard_DS12-1_v2': 0.401, Standard_DS11_v2: 0.2, 'Standard_DS11-1_v2': 0.2, 'S80 LRS': 1405.1, 'S70 LRS': 702.55, 'S60 LRS': 351.27, 'S6 LRS': 4.031, 'S50 LRS': 192.1, 'S40 LRS': 104.28, 'S4 LRS': 2.058, 'S30 LRS': 54.886, 'S20 LRS': 29.158, 'S15 LRS': 15.18, 'S10 LRS': 7.89
  },
  {
    name: 'southafricawest', Standard_DS5_v2: 1.539, Standard_DS4_v2: 0.769, Standard_DS3_v2: 0.385, Standard_DS2_v2: 0.192, Standard_DS1_v2: 0.0962, Standard_DS15i_v2: 2.512, Standard_DS15_v2: 2.512, Standard_DS14_v2: 2.009, 'Standard_DS14-8_v2': 2.009, 'Standard_DS14-4_v2': 2.009, Standard_DS13_v2: 1.005, 'Standard_DS13-4_v2': 1.005, 'Standard_DS13-2_v2': 1.005, Standard_DS12_v2: 0.502, 'Standard_DS12-2_v2': 0.502, 'Standard_DS12-1_v2': 0.502, Standard_DS11_v2: 0.251, 'Standard_DS11-1_v2': 0.251, 'S80 LRS': 1761.61, 'S70 LRS': 880.81, 'S60 LRS': 440.4, 'S6 LRS': 5.053, 'S50 LRS': 240.84, 'S40 LRS': 130.74, 'S4 LRS': 2.58, 'S30 LRS': 68.813, 'S20 LRS': 36.557, 'S15 LRS': 19.031, 'S10 LRS': 9.892
  },
  {
    name: 'southcentralus', Standard_DS5_v2: 1.017, Standard_DS4_v2: 0.509, Standard_DS3_v2: 0.254, Standard_DS2_v2: 0.127, Standard_DS1_v2: 0.0636, Standard_DS15i_v2: 1.662, Standard_DS15_v2: 1.662, Standard_DS14_v2: 1.33, 'Standard_DS14-8_v2': 1.33, 'Standard_DS14-4_v2': 1.33, Standard_DS13_v2: 0.665, 'Standard_DS13-4_v2': 0.665, 'Standard_DS13-2_v2': 0.665, Standard_DS12_v2: 0.332, 'Standard_DS12-2_v2': 0.332, 'Standard_DS12-1_v2': 0.332, Standard_DS11_v2: 0.166, 'Standard_DS11-1_v2': 0.166, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'southeastasia', Standard_DS5_v2: 1.263, Standard_DS4_v2: 0.631, Standard_DS3_v2: 0.316, Standard_DS2_v2: 0.158, Standard_DS1_v2: 0.0789, Standard_DS15i_v2: 1.912, Standard_DS15_v2: 1.912, Standard_DS14_v2: 1.53, 'Standard_DS14-8_v2': 1.53, 'Standard_DS14-4_v2': 1.53, Standard_DS13_v2: 0.765, 'Standard_DS13-4_v2': 0.765, 'Standard_DS13-2_v2': 0.765, Standard_DS12_v2: 0.382, 'Standard_DS12-2_v2': 0.382, 'Standard_DS12-1_v2': 0.382, Standard_DS11_v2: 0.191, 'Standard_DS11-1_v2': 0.191, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'southindia', Standard_DS5_v2: 1.35, Standard_DS4_v2: 0.675, Standard_DS3_v2: 0.337, Standard_DS2_v2: 0.169, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.895, Standard_DS15_v2: 1.895, Standard_DS14_v2: 1.516, 'Standard_DS14-8_v2': 1.516, 'Standard_DS14-4_v2': 1.516, Standard_DS13_v2: 0.758, 'Standard_DS13-4_v2': 0.758, 'Standard_DS13-2_v2': 0.758, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.189, 'Standard_DS11-1_v2': 0.189, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'swedencentral', Standard_DS5_v2: 1.088, Standard_DS4_v2: 0.544, Standard_DS3_v2: 0.272, Standard_DS2_v2: 0.136, Standard_DS1_v2: 0.068, Standard_DS15i_v2: 1.726, Standard_DS15_v2: 1.726, Standard_DS14_v2: 1.381, 'Standard_DS14-8_v2': 1.381, 'Standard_DS14-4_v2': 1.381, Standard_DS13_v2: 0.691, 'Standard_DS13-4_v2': 0.691, 'Standard_DS13-2_v2': 0.691, Standard_DS12_v2: 0.345, 'Standard_DS12-2_v2': 0.345, 'Standard_DS12-1_v2': 0.345, Standard_DS11_v2: 0.171, 'Standard_DS11-1_v2': 0.171, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'swedensouth', Standard_DS5_v2: 1.414, Standard_DS4_v2: 0.707, Standard_DS3_v2: 0.353, Standard_DS2_v2: 0.177, Standard_DS1_v2: 0.0884, Standard_DS15i_v2: 2.244, Standard_DS15_v2: 2.244, Standard_DS14_v2: 1.795, 'Standard_DS14-8_v2': 1.795, 'Standard_DS14-4_v2': 1.795, Standard_DS13_v2: 0.898, 'Standard_DS13-4_v2': 0.898, 'Standard_DS13-2_v2': 0.898, Standard_DS12_v2: 0.449, 'Standard_DS12-2_v2': 0.449, 'Standard_DS12-1_v2': 0.449, Standard_DS11_v2: 0.223, 'Standard_DS11-1_v2': 0.223, 'S80 LRS': 1703.936, 'S70 LRS': 851.968, 'S60 LRS': 425.984, 'S6 LRS': 3.9104, 'S50 LRS': 212.992, 'S40 LRS': 106.496, 'S4 LRS': 1.9968, 'S30 LRS': 53.248, 'S20 LRS': 28.288, 'S15 LRS': 14.7264, 'S10 LRS': 7.6544
  },
  {
    name: 'switzerlandnorth', Standard_DS5_v2: 1.1957, Standard_DS4_v2: 0.5984, Standard_DS3_v2: 0.2992, Standard_DS2_v2: 0.1496, Standard_DS1_v2: 0.07469, Standard_DS15i_v2: 2.0867, Standard_DS15_v2: 2.0867, Standard_DS14_v2: 1.6698, 'Standard_DS14-8_v2': 1.6698, 'Standard_DS14-4_v2': 1.6698, Standard_DS13_v2: 0.8349, 'Standard_DS13-4_v2': 0.8349, 'Standard_DS13-2_v2': 0.8349, Standard_DS12_v2: 0.4169, 'Standard_DS12-2_v2': 0.4169, 'Standard_DS12-1_v2': 0.4169, Standard_DS11_v2: 0.209, 'Standard_DS11-1_v2': 0.209, 'S80 LRS': 1430.325, 'S70 LRS': 720.896, 'S60 LRS': 360.448, 'S6 LRS': 3.3088, 'S50 LRS': 180.224, 'S40 LRS': 90.112, 'S4 LRS': 1.6896, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.4608, 'S10 LRS': 6.4768
  },
  {
    name: 'switzerlandwest', Standard_DS5_v2: 1.55368, Standard_DS4_v2: 0.77801, Standard_DS3_v2: 0.38914, Standard_DS2_v2: 0.19457, Standard_DS1_v2: 0.09702, Standard_DS15i_v2: 2.71271, Standard_DS15_v2: 2.71271, Standard_DS14_v2: 2.17056, 'Standard_DS14-8_v2': 2.17056, 'Standard_DS14-4_v2': 2.17056, Standard_DS13_v2: 1.08574, 'Standard_DS13-4_v2': 1.08574, 'Standard_DS13-2_v2': 1.08574, Standard_DS12_v2: 0.54215, 'Standard_DS12-2_v2': 0.54215, 'Standard_DS12-1_v2': 0.54215, Standard_DS11_v2: 0.27133, 'Standard_DS11-1_v2': 0.27133, 'S80 LRS': 1859.4225, 'S70 LRS': 937.1648, 'S60 LRS': 468.5824, 'S6 LRS': 4.300523, 'S50 LRS': 234.28845, 'S40 LRS': 117.15, 'S4 LRS': 2.196572, 'S30 LRS': 58.573167, 'S20 LRS': 31.117167, 'S15 LRS': 16.198857, 'S10 LRS': 8.419107
  },
  {
    name: 'uaecentral', Standard_DS5_v2: 1.429, Standard_DS4_v2: 0.714, Standard_DS3_v2: 0.357, Standard_DS2_v2: 0.178, Standard_DS1_v2: 0.0893, Standard_DS15i_v2: 2.332, Standard_DS15_v2: 2.332, Standard_DS14_v2: 1.866, 'Standard_DS14-8_v2': 1.866, 'Standard_DS14-4_v2': 1.866, Standard_DS13_v2: 0.933, 'Standard_DS13-4_v2': 0.933, 'Standard_DS13-2_v2': 0.933, Standard_DS12_v2: 0.466, 'Standard_DS12-2_v2': 0.466, 'Standard_DS12-1_v2': 0.466, Standard_DS11_v2: 0.233, 'Standard_DS11-1_v2': 0.233, 'S90 LRS': 2044.7232, 'S80 LRS': 1635.78, 'S70 LRS': 817.89, 'S60 LRS': 408.94, 'S6 LRS': 3.9104, 'S50 LRS': 212.992, 'S40 LRS': 106.496, 'S4 LRS': 1.9968, 'S30 LRS': 53.248, 'S20 LRS': 28.288, 'S15 LRS': 14.726, 'S10 LRS': 7.6544
  },
  {
    name: 'uaenorth', Standard_DS5_v2: 1.099, Standard_DS4_v2: 0.55, Standard_DS3_v2: 0.275, Standard_DS2_v2: 0.137, Standard_DS1_v2: 0.0687, Standard_DS15i_v2: 1.794, Standard_DS15_v2: 1.794, Standard_DS14_v2: 1.435, 'Standard_DS14-8_v2': 1.435, 'Standard_DS14-4_v2': 1.435, Standard_DS13_v2: 0.718, 'Standard_DS13-4_v2': 0.718, 'Standard_DS13-2_v2': 0.718, Standard_DS12_v2: 0.359, 'Standard_DS12-2_v2': 0.359, 'Standard_DS12-1_v2': 0.359, Standard_DS11_v2: 0.179, 'Standard_DS11-1_v2': 0.179, 'S90 LRS': 1572.864, 'S80 LRS': 1258.29, 'S70 LRS': 629.15, 'S60 LRS': 314.57, 'S6 LRS': 3.6096, 'S50 LRS': 172.03, 'S40 LRS': 93.389, 'S4 LRS': 1.8432, 'S30 LRS': 49.152, 'S20 LRS': 26.112, 'S15 LRS': 13.5936, 'S10 LRS': 7.0656
  },
  {
    name: 'uksouth', Standard_DS5_v2: 1.405, Standard_DS4_v2: 0.702, Standard_DS3_v2: 0.351, Standard_DS2_v2: 0.176, Standard_DS1_v2: 0.0878, Standard_DS15i_v2: 2.343, Standard_DS15_v2: 2.343, Standard_DS14_v2: 1.874, 'Standard_DS14-8_v2': 1.874, 'Standard_DS14-4_v2': 1.874, Standard_DS13_v2: 0.937, 'Standard_DS13-4_v2': 0.937, 'Standard_DS13-2_v2': 0.937, Standard_DS12_v2: 0.469, 'Standard_DS12-2_v2': 0.469, 'Standard_DS12-1_v2': 0.469, Standard_DS11_v2: 0.234, 'Standard_DS11-1_v2': 0.234, 'S80 LRS': 1153.29, 'S70 LRS': 576.65, 'S60 LRS': 288.32, 'S6 LRS': 3.309, 'S50 LRS': 157.67652, 'S40 LRS': 85.595826, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.477
  },
  {
    name: 'ukwest', Standard_DS5_v2: 1.404, Standard_DS4_v2: 0.702, Standard_DS3_v2: 0.351, Standard_DS2_v2: 0.175, Standard_DS1_v2: 0.0877, Standard_DS15i_v2: 2.343, Standard_DS15_v2: 2.343, Standard_DS14_v2: 1.874, 'Standard_DS14-8_v2': 1.874, 'Standard_DS14-4_v2': 1.874, Standard_DS13_v2: 0.937, 'Standard_DS13-4_v2': 0.937, 'Standard_DS13-2_v2': 0.937, Standard_DS12_v2: 0.469, 'Standard_DS12-2_v2': 0.469, 'Standard_DS12-1_v2': 0.469, Standard_DS11_v2: 0.234, 'Standard_DS11-1_v2': 0.234, 'S80 LRS': 1441.61, 'S70 LRS': 720.81, 'S60 LRS': 360.4, 'S6 LRS': 3.309, 'S50 LRS': 180.201738, 'S40 LRS': 90.100868, 'S4 LRS': 1.69, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.477
  },
  {
    name: 'usgovarizona', Standard_DS5_v2: 1.142, Standard_DS4_v2: 0.571, Standard_DS3_v2: 0.285, Standard_DS2_v2: 0.143, Standard_DS1_v2: 0.071, Standard_DS15i_v2: 1.864, Standard_DS15_v2: 1.864, Standard_DS14_v2: 1.491, 'Standard_DS14-8_v2': 1.491, 'Standard_DS14-4_v2': 1.491, Standard_DS13_v2: 0.746, 'Standard_DS13-4_v2': 0.746, 'Standard_DS13-2_v2': 0.746, Standard_DS12_v2: 0.373, 'Standard_DS12-2_v2': 0.373, 'Standard_DS12-1_v2': 0.373, Standard_DS11_v2: 0.186, 'Standard_DS11-1_v2': 0.186, 'S80 LRS': 1441.63, 'S70 LRS': 720.81, 'S60 LRS': 360.403478, 'S6 LRS': 3.3088, 'S50 LRS': 180.201738, 'S40 LRS': 90.100868, 'S4 LRS': 1.536, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.4768
  },
  {
    name: 'usgovtexas', Standard_DS5_v2: 1.142, Standard_DS4_v2: 0.571, Standard_DS3_v2: 0.285, Standard_DS2_v2: 0.143, Standard_DS1_v2: 0.071, Standard_DS15i_v2: 1.864, Standard_DS15_v2: 1.864, Standard_DS14_v2: 1.491, 'Standard_DS14-8_v2': 1.491, 'Standard_DS14-4_v2': 1.491, Standard_DS13_v2: 0.746, 'Standard_DS13-4_v2': 0.746, 'Standard_DS13-2_v2': 0.746, Standard_DS12_v2: 0.373, 'Standard_DS12-2_v2': 0.373, 'Standard_DS12-1_v2': 0.373, Standard_DS11_v2: 0.186, 'Standard_DS11-1_v2': 0.186, 'S80 LRS': 1441.63, 'S70 LRS': 720.81, 'S60 LRS': 360.403478, 'S6 LRS': 3.3088, 'S50 LRS': 180.201738, 'S40 LRS': 90.100868, 'S4 LRS': 1.536, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.4768
  },
  {
    name: 'usgovvirginia', Standard_DS5_v2: 1.142, Standard_DS4_v2: 0.571, Standard_DS3_v2: 0.285, Standard_DS2_v2: 0.143, Standard_DS1_v2: 0.071, Standard_DS15i_v2: 1.864, Standard_DS15_v2: 1.864, Standard_DS14_v2: 1.491, 'Standard_DS14-8_v2': 1.491, 'Standard_DS14-4_v2': 1.491, Standard_DS13_v2: 0.746, 'Standard_DS13-4_v2': 0.746, 'Standard_DS13-2_v2': 0.746, Standard_DS12_v2: 0.373, 'Standard_DS12-2_v2': 0.373, 'Standard_DS12-1_v2': 0.373, Standard_DS11_v2: 0.186, 'Standard_DS11-1_v2': 0.186, 'S80 LRS': 1441.63, 'S70 LRS': 720.81, 'S60 LRS': 360.403478, 'S6 LRS': 3.3088, 'S50 LRS': 180.201738, 'S40 LRS': 90.100868, 'S4 LRS': 1.68, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 12.45926, 'S10 LRS': 6.4768
  },
  {
    name: 'westcentralus', Standard_DS5_v2: 1.017, Standard_DS4_v2: 0.509, Standard_DS3_v2: 0.254, Standard_DS2_v2: 0.127, Standard_DS1_v2: 0.0636, Standard_DS15i_v2: 1.662, Standard_DS15_v2: 1.662, Standard_DS14_v2: 1.33, 'Standard_DS14-8_v2': 1.33, 'Standard_DS14-4_v2': 1.33, Standard_DS13_v2: 0.665, 'Standard_DS13-4_v2': 0.665, 'Standard_DS13-2_v2': 0.665, Standard_DS12_v2: 0.332, 'Standard_DS12-2_v2': 0.332, 'Standard_DS12-1_v2': 0.332, Standard_DS11_v2: 0.166, 'Standard_DS11-1_v2': 0.166, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'westeurope', Standard_DS5_v2: 1.087, Standard_DS4_v2: 0.544, Standard_DS3_v2: 0.272, Standard_DS2_v2: 0.136, Standard_DS1_v2: 0.0679, Standard_DS15i_v2: 1.897, Standard_DS15_v2: 1.897, Standard_DS14_v2: 1.518, 'Standard_DS14-8_v2': 1.518, 'Standard_DS14-4_v2': 1.518, Standard_DS13_v2: 0.759, 'Standard_DS13-4_v2': 0.759, 'Standard_DS13-2_v2': 0.759, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.19, 'Standard_DS11-1_v2': 0.19, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'westindia', Standard_DS5_v2: 1.35, Standard_DS4_v2: 0.675, Standard_DS3_v2: 0.337, Standard_DS2_v2: 0.169, Standard_DS1_v2: 0.084, Standard_DS15i_v2: 1.895, Standard_DS15_v2: 1.895, Standard_DS14_v2: 1.516, 'Standard_DS14-8_v2': 1.516, 'Standard_DS14-4_v2': 1.516, Standard_DS13_v2: 0.758, 'Standard_DS13-4_v2': 0.758, 'Standard_DS13-2_v2': 0.758, Standard_DS12_v2: 0.379, 'Standard_DS12-2_v2': 0.379, 'Standard_DS12-1_v2': 0.379, Standard_DS11_v2: 0.189, 'Standard_DS11-1_v2': 0.189, 'S80 LRS': 1658.08, 'S70 LRS': 829.04, 'S60 LRS': 414.52, 'S6 LRS': 3.3088, 'S50 LRS': 207.259826, 'S40 LRS': 103.629912, 'S4 LRS': 1.6896, 'S30 LRS': 45.056, 'S20 LRS': 23.936, 'S15 LRS': 14.330072, 'S10 LRS': 6.4768
  },
  {
    name: 'westus', Standard_DS5_v2: 1.117, Standard_DS4_v2: 0.559, Standard_DS3_v2: 0.279, Standard_DS2_v2: 0.14, Standard_DS1_v2: 0.07, Standard_DS15i_v2: 1.852, Standard_DS15_v2: 1.852, Standard_DS14_v2: 1.482, 'Standard_DS14-8_v2': 1.482, 'Standard_DS14-4_v2': 1.482, Standard_DS13_v2: 0.741, 'Standard_DS13-4_v2': 0.741, 'Standard_DS13-2_v2': 0.741, Standard_DS12_v2: 0.37, 'Standard_DS12-2_v2': 0.37, 'Standard_DS12-1_v2': 0.37, Standard_DS11_v2: 0.185, 'Standard_DS11-1_v2': 0.185, 'S80 LRS': 1310.72, 'S70 LRS': 655.36, 'S60 LRS': 327.68, 'S6 LRS': 3.008, 'S50 LRS': 163.84, 'S40 LRS': 81.92, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'westus2', Standard_DS5_v2: 0.916, Standard_DS4_v2: 0.458, Standard_DS3_v2: 0.229, Standard_DS2_v2: 0.114, Standard_DS1_v2: 0.057, Standard_DS15i_v2: 1.495, Standard_DS15_v2: 1.495, Standard_DS14_v2: 1.196, 'Standard_DS14-8_v2': 1.196, 'Standard_DS14-4_v2': 1.196, Standard_DS13_v2: 0.598, 'Standard_DS13-4_v2': 0.598, 'Standard_DS13-2_v2': 0.598, Standard_DS12_v2: 0.299, 'Standard_DS12-2_v2': 0.299, 'Standard_DS12-1_v2': 0.299, Standard_DS11_v2: 0.149, 'Standard_DS11-1_v2': 0.149, 'S90 LRS': 983.04, 'S80 LRS': 953.55, 'S70 LRS': 491.52, 'S60 LRS': 262.14, 'S6 LRS': 3.008, 'S50 LRS': 143.36, 'S40 LRS': 77.824, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
  {
    name: 'westus3', Standard_DS5_v2: 0.916, Standard_DS4_v2: 0.458, Standard_DS3_v2: 0.229, Standard_DS2_v2: 0.114, Standard_DS1_v2: 0.057, Standard_DS15i_v2: 1.495, Standard_DS15_v2: 1.495, Standard_DS14_v2: 1.196, 'Standard_DS14-8_v2': 1.196, 'Standard_DS14-4_v2': 1.196, Standard_DS13_v2: 0.598, 'Standard_DS13-4_v2': 0.598, 'Standard_DS13-2_v2': 0.598, Standard_DS12_v2: 0.299, 'Standard_DS12-2_v2': 0.299, 'Standard_DS12-1_v2': 0.299, Standard_DS11_v2: 0.149, 'Standard_DS11-1_v2': 0.149, 'S80 LRS': 953.55, 'S70 LRS': 491.52, 'S60 LRS': 262.14, 'S6 LRS': 3.008, 'S50 LRS': 143.36, 'S40 LRS': 77.824, 'S4 LRS': 1.536, 'S30 LRS': 40.96, 'S20 LRS': 21.76, 'S15 LRS': 11.328, 'S10 LRS': 5.888
  },
]

export const getAzurePricesForRegion = key => _.has(key, azureRegions) ? _.find(priceObj => priceObj.name === key, azureRegionToPrices) : {}

export const version = '1'
