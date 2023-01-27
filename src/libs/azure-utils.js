import _ from 'lodash/fp'

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
export const azureRegions = {
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

// max GB of each azure storage disk type; per https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types#standard-ssds
export const azureDiskTypes = {
  'E1 LRS': 4,
  'E2 LRS': 8,
  'E3 LRS': 16,
  'E4 LRS': 32,
  'E6 LRS': 64,
  'E10 LRS': 128,
  'E15 LRS': 256,
  'E20 LRS': 512,
  'E30 LRS': 1024,
  'E40 LRS': 2048,
  'E50 LRS': 4096,
  'E60 LRS': 8192,
  'E70 LRS': 16384,
  'E80 LRS': 32767,
}
/** Get Azure disk type (E1, E2, E4 etc) whose storage is large enough to hold the requested size (in Gb).
 * Note that the largest (E80 LRS) will not hold more than 32767 Gb, according to the Azure docs.
 * TODO [IA-3390] calculate differently
 */
export const getDiskType = diskSize => _.findKey(maxSize => diskSize <= maxSize, azureDiskTypes)

// Storage prices below are monthly; see https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types#standard-ssds
// Compute prices below are hourly, per https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/#pricing.
// The data below comes from Azure's pricing API: https://prices.azure.com/api/retail/prices
// There is a script available at https://github.com/broadinstitute/dsp-scripts/blob/master/terra-ui/regionality/parse_pricing_api_azure.py.
// It parses the API and outputs the response data.
export const azureRegionToPrices = [
  {
    name: 'southafricanorth', Standard_DS2_v2: 0.153, Standard_DS3_v2: 0.307, Standard_DS4_v2: 0.614, Standard_DS5_v2: 1.227, 'E1 LRS': 0.438, 'E2 LRS': 0.876, 'E3 LRS': 1.752, 'E4 LRS': 3.504, 'E6 LRS': 7.008, 'E10 LRS': 14.016, 'E15 LRS': 28.032, 'E20 LRS': 56.064, 'E30 LRS': 112.13, 'E40 LRS': 224.26, 'E50 LRS': 448.51, 'E60 LRS': 823.3, 'E70 LRS': 1646.59, 'E80 LRS': 3293.18
  },
  {
    name: 'francecentral', Standard_DS2_v2: 0.175, Standard_DS3_v2: 0.351, Standard_DS4_v2: 0.702, Standard_DS5_v2: 1.404, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'usgovvirginia', Standard_DS2_v2: 0.143, Standard_DS3_v2: 0.285, Standard_DS4_v2: 0.571, Standard_DS5_v2: 1.142, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.559999, 'E15 LRS': 21.119999, 'E20 LRS': 42.239999, 'E30 LRS': 84.479999, 'E40 LRS': 168.959999, 'E50 LRS': 337.919999, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'canadacentral', Standard_DS2_v2: 0.14, Standard_DS3_v2: 0.28, Standard_DS4_v2: 0.56, Standard_DS5_v2: 1.12, 'E1 LRS': 0.36, 'E2 LRS': 0.72, 'E3 LRS': 1.44, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'eastus', Standard_DS2_v2: 0.146, Standard_DS3_v2: 0.293, Standard_DS4_v2: 0.585, Standard_DS5_v2: 1.17, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'australiaeast', Standard_DS2_v2: 0.168, Standard_DS3_v2: 0.336, Standard_DS4_v2: 0.673, Standard_DS5_v2: 1.345, 'E1 LRS': 0.408, 'E2 LRS': 0.816, 'E3 LRS': 1.632, 'E4 LRS': 3.264, 'E6 LRS': 6.528, 'E10 LRS': 13.056, 'E15 LRS': 26.112, 'E20 LRS': 52.224, 'E30 LRS': 104.448, 'E40 LRS': 208.896, 'E50 LRS': 417.792, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 3342.34
  },
  {
    name: 'westus3', Standard_DS2_v2: 0.114, Standard_DS3_v2: 0.229, Standard_DS4_v2: 0.458, Standard_DS5_v2: 0.916, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'uksouth', Standard_DS2_v2: 0.176, Standard_DS3_v2: 0.351, Standard_DS4_v2: 0.702, Standard_DS5_v2: 1.405, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'canadaeast', Standard_DS2_v2: 0.14, Standard_DS3_v2: 0.28, Standard_DS4_v2: 0.56, Standard_DS5_v2: 1.12, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'centralus', Standard_DS2_v2: 0.146, Standard_DS3_v2: 0.293, Standard_DS4_v2: 0.585, Standard_DS5_v2: 1.17, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'attdetroit1', Standard_DS2_v2: 0.114, Standard_DS3_v2: 0.229, Standard_DS4_v2: 0.458, Standard_DS5_v2: 0.916, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'jioindiawest', Standard_DS2_v2: 0.169, Standard_DS3_v2: 0.337, Standard_DS4_v2: 0.675, Standard_DS5_v2: 1.35, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'eastus2', Standard_DS2_v2: 0.114, Standard_DS3_v2: 0.229, Standard_DS4_v2: 0.458, Standard_DS5_v2: 0.916, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'australiacentral2', Standard_DS2_v2: 0.168, Standard_DS3_v2: 0.336, Standard_DS4_v2: 0.673, Standard_DS5_v2: 1.345, 'E1 LRS': 0.51, 'E2 LRS': 1.02, 'E3 LRS': 2.04, 'E4 LRS': 3.264, 'E6 LRS': 6.528, 'E10 LRS': 13.056, 'E15 LRS': 26.112, 'E20 LRS': 52.224, 'E30 LRS': 104.448, 'E40 LRS': 208.896, 'E50 LRS': 417.79, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 3342.34
  },
  {
    name: 'ukwest', Standard_DS2_v2: 0.175, Standard_DS3_v2: 0.351, Standard_DS4_v2: 0.702, Standard_DS5_v2: 1.404, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'qatarcentral', Standard_DS2_v2: 0.137, Standard_DS3_v2: 0.275, Standard_DS4_v2: 0.55, Standard_DS5_v2: 1.099, 'E1 LRS': 0.36, 'E2 LRS': 0.72, 'E3 LRS': 1.44, 'E4 LRS': 2.88, 'E6 LRS': 5.76, 'E10 LRS': 11.52, 'E15 LRS': 23.04, 'E20 LRS': 46.08, 'E30 LRS': 92.16, 'E40 LRS': 184.32, 'E50 LRS': 368.64, 'E60 LRS': 737.28, 'E70 LRS': 1474.56, 'E80 LRS': 2949.12
  },
  {
    name: 'westcentralus', Standard_DS2_v2: 0.127, Standard_DS3_v2: 0.254, Standard_DS4_v2: 0.509, Standard_DS5_v2: 1.017, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'switzerlandnorth', Standard_DS2_v2: 0.1496, Standard_DS3_v2: 0.2992, Standard_DS4_v2: 0.5984, Standard_DS5_v2: 1.1957, 'E1 LRS': 0.36, 'E2 LRS': 0.72, 'E3 LRS': 1.44, 'E4 LRS': 2.88, 'E6 LRS': 5.76, 'E10 LRS': 11.52, 'E15 LRS': 23.04, 'E20 LRS': 46.08, 'E30 LRS': 92.16, 'E40 LRS': 184.32, 'E50 LRS': 368.64, 'E60 LRS': 921.6, 'E70 LRS': 1843.2, 'E80 LRS': 3686.4
  },
  {
    name: 'southcentralus', Standard_DS2_v2: 0.127, Standard_DS3_v2: 0.254, Standard_DS4_v2: 0.509, Standard_DS5_v2: 1.017, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'swedencentral', Standard_DS2_v2: 0.136, Standard_DS3_v2: 0.272, Standard_DS4_v2: 0.544, Standard_DS5_v2: 1.088, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'switzerlandwest', Standard_DS2_v2: 0.19457, Standard_DS3_v2: 0.38914, Standard_DS4_v2: 0.77801, Standard_DS5_v2: 1.55368, 'E1 LRS': 0.429, 'E2 LRS': 0.858, 'E3 LRS': 1.716, 'E4 LRS': 3.432, 'E6 LRS': 6.864, 'E10 LRS': 13.728, 'E15 LRS': 27.456, 'E20 LRS': 54.912, 'E30 LRS': 109.825833, 'E40 LRS': 219.651667, 'E50 LRS': 439.294167, 'E60 LRS': 878.592, 'E70 LRS': 1757.184, 'E80 LRS': 3514.368
  },
  {
    name: 'koreacentral', Standard_DS2_v2: 0.165, Standard_DS3_v2: 0.33, Standard_DS4_v2: 0.66, Standard_DS5_v2: 1.321, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'germanywestcentral', Standard_DS2_v2: 0.133, Standard_DS3_v2: 0.266, Standard_DS4_v2: 0.532, Standard_DS5_v2: 1.064, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 737.28, 'E70 LRS': 1474.56, 'E80 LRS': 2949.12
  },
  {
    name: 'australiacentral', Standard_DS2_v2: 0.168, Standard_DS3_v2: 0.336, Standard_DS4_v2: 0.673, Standard_DS5_v2: 1.345, 'E1 LRS': 0.51, 'E2 LRS': 1.02, 'E3 LRS': 2.04, 'E4 LRS': 3.264, 'E6 LRS': 6.528, 'E10 LRS': 13.056, 'E15 LRS': 26.112, 'E20 LRS': 52.224, 'E30 LRS': 104.448, 'E40 LRS': 208.896, 'E50 LRS': 417.79, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 3342.34
  },
  {
    name: 'brazilsoutheast', Standard_DS2_v2: 0.223, Standard_DS3_v2: 0.445, Standard_DS4_v2: 0.89, Standard_DS5_v2: 1.78, 'E1 LRS': 0.8424, 'E2 LRS': 1.6848, 'E3 LRS': 3.3696, 'E4 LRS': 6.7392, 'E6 LRS': 13.4784, 'E10 LRS': 26.9568, 'E15 LRS': 53.9136, 'E20 LRS': 107.8272, 'E30 LRS': 215.657, 'E40 LRS': 431.314, 'E50 LRS': 862.6176, 'E60 LRS': 1725.23, 'E70 LRS': 3450.473, 'E80 LRS': 6900.946
  },
  {
    name: 'norwaywest', Standard_DS2_v2: 0.194, Standard_DS3_v2: 0.389, Standard_DS4_v2: 0.778, Standard_DS5_v2: 1.554, 'E1 LRS': 0.429, 'E2 LRS': 0.858, 'E3 LRS': 1.716, 'E4 LRS': 3.432, 'E6 LRS': 6.864, 'E10 LRS': 13.728, 'E15 LRS': 27.456, 'E20 LRS': 54.912, 'E30 LRS': 109.82, 'E40 LRS': 219.65, 'E50 LRS': 439.3, 'E60 LRS': 878.59, 'E70 LRS': 1757.18, 'E80 LRS': 3514.37
  },
  {
    name: 'koreasouth', Standard_DS2_v2: 0.149, Standard_DS3_v2: 0.297, Standard_DS4_v2: 0.594, Standard_DS5_v2: 1.189, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'francesouth', Standard_DS2_v2: 0.228, Standard_DS3_v2: 0.456, Standard_DS4_v2: 0.912, Standard_DS5_v2: 1.824, 'E1 LRS': 0.43, 'E2 LRS': 0.858, 'E3 LRS': 1.716, 'E4 LRS': 3.432, 'E6 LRS': 6.864, 'E10 LRS': 13.728, 'E15 LRS': 27.456, 'E20 LRS': 54.912, 'E30 LRS': 109.824, 'E40 LRS': 219.648, 'E50 LRS': 439.296, 'E60 LRS': 878.59, 'E70 LRS': 1757.18, 'E80 LRS': 3514.37
  },
  {
    name: 'swedensouth', Standard_DS2_v2: 0.177, Standard_DS3_v2: 0.353, Standard_DS4_v2: 0.707, Standard_DS5_v2: 1.414, 'E1 LRS': 0.39, 'E2 LRS': 0.78, 'E3 LRS': 1.56, 'E4 LRS': 3.12, 'E6 LRS': 6.24, 'E10 LRS': 12.48, 'E15 LRS': 24.96, 'E20 LRS': 49.92, 'E30 LRS': 99.84, 'E40 LRS': 199.68, 'E50 LRS': 399.36, 'E60 LRS': 798.72, 'E70 LRS': 1597.44, 'E80 LRS': 3194.88
  },
  {
    name: 'southeastasia', Standard_DS2_v2: 0.158, Standard_DS3_v2: 0.316, Standard_DS4_v2: 0.631, Standard_DS5_v2: 1.263, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'centralindia', Standard_DS2_v2: 0.169, Standard_DS3_v2: 0.337, Standard_DS4_v2: 0.675, Standard_DS5_v2: 1.35, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'attdallas1', Standard_DS2_v2: 0.171, Standard_DS3_v2: 0.343, Standard_DS4_v2: 0.686, Standard_DS5_v2: 1.372, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'attatlanta1', Standard_DS2_v2: 0.155, Standard_DS3_v2: 0.309, Standard_DS4_v2: 0.618, Standard_DS5_v2: 1.237, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'usgovtexas', Standard_DS2_v2: 0.143, Standard_DS3_v2: 0.285, Standard_DS4_v2: 0.571, Standard_DS5_v2: 1.142, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.559999, 'E15 LRS': 21.119999, 'E20 LRS': 42.239999, 'E30 LRS': 84.479999, 'E40 LRS': 168.959999, 'E50 LRS': 337.919999, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'brazilsouth', Standard_DS2_v2: 0.171, Standard_DS3_v2: 0.343, Standard_DS4_v2: 0.685, Standard_DS5_v2: 1.37, 'E1 LRS': 0.56, 'E2 LRS': 1.12, 'E3 LRS': 2.24, 'E4 LRS': 4.48, 'E6 LRS': 8.96, 'E10 LRS': 17.92, 'E15 LRS': 35.84, 'E20 LRS': 71.68, 'E30 LRS': 143.36, 'E40 LRS': 286.72, 'E50 LRS': 573.44, 'E60 LRS': 1146.88, 'E70 LRS': 2293.76, 'E80 LRS': 4587.52
  },
  {
    name: 'eastasia', Standard_DS2_v2: 0.214, Standard_DS3_v2: 0.428, Standard_DS4_v2: 0.857, Standard_DS5_v2: 1.714, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'japanwest', Standard_DS2_v2: 0.182, Standard_DS3_v2: 0.365, Standard_DS4_v2: 0.729, Standard_DS5_v2: 1.459, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'norwayeast', Standard_DS2_v2: 0.15, Standard_DS3_v2: 0.299, Standard_DS4_v2: 0.598, Standard_DS5_v2: 1.196, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'northeurope', Standard_DS2_v2: 0.132, Standard_DS3_v2: 0.263, Standard_DS4_v2: 0.527, Standard_DS5_v2: 1.053, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'westindia', Standard_DS2_v2: 0.169, Standard_DS3_v2: 0.337, Standard_DS4_v2: 0.675, Standard_DS5_v2: 1.35, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'southafricawest', Standard_DS2_v2: 0.192, Standard_DS3_v2: 0.385, Standard_DS4_v2: 0.769, Standard_DS5_v2: 1.539, 'E1 LRS': 0.504, 'E2 LRS': 1.008, 'E3 LRS': 2.016, 'E4 LRS': 4.032, 'E6 LRS': 8.064, 'E10 LRS': 16.128, 'E15 LRS': 32.256, 'E20 LRS': 64.512, 'E30 LRS': 129.02, 'E40 LRS': 258.05, 'E50 LRS': 516.1, 'E60 LRS': 1032.19, 'E70 LRS': 2064.38, 'E80 LRS': 4128.77
  },
  {
    name: 'usgovarizona', Standard_DS2_v2: 0.143, Standard_DS3_v2: 0.285, Standard_DS4_v2: 0.571, Standard_DS5_v2: 1.142, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.559999, 'E15 LRS': 21.119999, 'E20 LRS': 42.239999, 'E30 LRS': 84.479999, 'E40 LRS': 168.959999, 'E50 LRS': 337.919999, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'uaecentral', Standard_DS2_v2: 0.178, Standard_DS3_v2: 0.357, Standard_DS4_v2: 0.714, Standard_DS5_v2: 1.429, 'E1 LRS': 0.468, 'E2 LRS': 0.936, 'E3 LRS': 1.872, 'E4 LRS': 3.12, 'E6 LRS': 6.24, 'E10 LRS': 12.48, 'E15 LRS': 24.96, 'E20 LRS': 49.92, 'E30 LRS': 99.84, 'E40 LRS': 199.68, 'E50 LRS': 399.36, 'E60 LRS': 798.72, 'E70 LRS': 1597.44, 'E80 LRS': 3194.88
  },
  {
    name: 'southindia', Standard_DS2_v2: 0.169, Standard_DS3_v2: 0.337, Standard_DS4_v2: 0.675, Standard_DS5_v2: 1.35, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'germanynorth', Standard_DS2_v2: 0.174, Standard_DS3_v2: 0.348, Standard_DS4_v2: 0.697, Standard_DS5_v2: 1.394, 'E1 LRS': 0.39, 'E2 LRS': 0.78, 'E3 LRS': 1.56, 'E4 LRS': 3.12, 'E6 LRS': 6.24, 'E10 LRS': 12.48, 'E15 LRS': 24.96, 'E20 LRS': 49.92, 'E30 LRS': 99.84, 'E40 LRS': 199.68, 'E50 LRS': 399.36, 'E60 LRS': 958.464, 'E70 LRS': 1916.928, 'E80 LRS': 3833.856
  },
  {
    name: 'westus', Standard_DS2_v2: 0.14, Standard_DS3_v2: 0.279, Standard_DS4_v2: 0.559, Standard_DS5_v2: 1.117, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'jioindiacentral', Standard_DS2_v2: 0.169, Standard_DS3_v2: 0.337, Standard_DS4_v2: 0.675, Standard_DS5_v2: 1.35, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'japaneast', Standard_DS2_v2: 0.205, Standard_DS3_v2: 0.409, Standard_DS4_v2: 0.818, Standard_DS5_v2: 1.636, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'northcentralus', Standard_DS2_v2: 0.146, Standard_DS3_v2: 0.293, Standard_DS4_v2: 0.585, Standard_DS5_v2: 1.17, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'australiasoutheast', Standard_DS2_v2: 0.15576, Standard_DS3_v2: 0.311, Standard_DS4_v2: 0.623, Standard_DS5_v2: 1.246, 'E1 LRS': 0.408, 'E2 LRS': 0.816, 'E3 LRS': 1.632, 'E4 LRS': 3.264, 'E6 LRS': 6.528, 'E10 LRS': 13.056, 'E15 LRS': 26.112, 'E20 LRS': 52.224, 'E30 LRS': 104.448, 'E40 LRS': 208.896, 'E50 LRS': 417.792, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 3342.34
  },
  {
    name: 'westus2', Standard_DS2_v2: 0.114, Standard_DS3_v2: 0.229, Standard_DS4_v2: 0.458, Standard_DS5_v2: 0.916, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'uaenorth', Standard_DS2_v2: 0.137, Standard_DS3_v2: 0.275, Standard_DS4_v2: 0.55, Standard_DS5_v2: 1.099, 'E1 LRS': 0.36, 'E2 LRS': 0.72, 'E3 LRS': 1.44, 'E4 LRS': 2.88, 'E6 LRS': 5.76, 'E10 LRS': 11.52, 'E15 LRS': 23.04, 'E20 LRS': 46.08, 'E30 LRS': 92.16, 'E40 LRS': 184.32, 'E50 LRS': 368.64, 'E60 LRS': 737.28, 'E70 LRS': 1474.56, 'E80 LRS': 2949.12
  },
  {
    name: 'westeurope', Standard_DS2_v2: 0.136, Standard_DS3_v2: 0.272, Standard_DS4_v2: 0.544, Standard_DS5_v2: 1.087, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
]

export const version = '0'
