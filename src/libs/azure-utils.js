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
export const getDiskType = diskSize => _.findKey(maxSize => diskSize <= maxSize, azureDiskTypes)

// Storage prices below are monthly; see https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types#standard-ssds
// Compute prices below are hourly, per https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/#pricing.
// The data below comes from Azure's pricing API: https://prices.azure.com/api/retail/prices
// There is a script available at https://github.com/broadinstitute/dsp-scripts/blob/master/terra-ui/regionality/parse_pricing_api_azure.py.
// It parses the API and outputs the response data.
export const azureRegionToPrices = [
  {
    name: 'attdetroit1', Standard_DS2_v2: 0.0229, Standard_DS3_v2: 0.0458, Standard_DS4_v2: 0.0916, Standard_DS5_v2: 0.183, 'E1 LRS': 0.3, 'E2 LRS': 0.06, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 0.0, 'E10 LRS': 0.002, 'E15 LRS': 19.2, 'E20 LRS': 0.002, 'E30 LRS': 0.002, 'E40 LRS': 13.14, 'E50 LRS': 0.002, 'E60 LRS': 51.1, 'E70 LRS': 109.5, 'E80 LRS': 2457.6
  },
  {
    name: 'usgovvirginia', Standard_DS2_v2: 0.015312, Standard_DS3_v2: 0.030518, Standard_DS4_v2: 0.061143, Standard_DS5_v2: 0.122285, 'E1 LRS': 0.0375, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 0.325, 'E6 LRS': 5.28, 'E10 LRS': 1.138, 'E15 LRS': 21.119999, 'E20 LRS': 4.112, 'E30 LRS': 8.212, 'E40 LRS': 16.425, 'E50 LRS': 337.919999, 'E60 LRS': 675.84, 'E70 LRS': 136.88, 'E80 LRS': 2703.36
  },
  {
    name: 'attdallas1', Standard_DS2_v2: 0.171, Standard_DS3_v2: 0.0686, Standard_DS4_v2: 0.137, Standard_DS5_v2: 1.372, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 0.0, 'E10 LRS': 1.092, 'E15 LRS': 19.2, 'E20 LRS': 3.948, 'E30 LRS': 7.884, 'E40 LRS': 0.002, 'E50 LRS': 30.66, 'E60 LRS': 0.002, 'E70 LRS': 1228.8, 'E80 LRS': 262.8
  },
  {
    name: 'switzerlandwest', Standard_DS2_v2: 0.019457, Standard_DS3_v2: 0.038914, Standard_DS4_v2: 0.077801, Standard_DS5_v2: 0.155368, 'E1 LRS': 0.0585, 'E2 LRS': 0.117, 'E3 LRS': 1.716, 'E4 LRS': 0.507, 'E6 LRS': 0.916, 'E10 LRS': 13.728, 'E15 LRS': 27.456, 'E20 LRS': 6.416, 'E30 LRS': 109.825833, 'E40 LRS': 219.651667, 'E50 LRS': 49.822, 'E60 LRS': 99.645, 'E70 LRS': 213.52, 'E80 LRS': 427.05
  },
  {
    name: 'westeurope', Standard_DS2_v2: 0.019472, Standard_DS3_v2: 0.038945, Standard_DS4_v2: 0.077889, Standard_DS5_v2: 0.155635, 'E1 LRS': 0.039, 'E2 LRS': 0.078, 'E3 LRS': 0.156, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 4.277, 'E30 LRS': 8.541, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 142.35, 'E80 LRS': 2457.6
  },
  {
    name: 'japanwest', Standard_DS2_v2: 0.0193, Standard_DS3_v2: 0.038705, Standard_DS4_v2: 0.077304, Standard_DS5_v2: 0.154715, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 1.41, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 10.184, 'E40 LRS': 20.367, 'E50 LRS': 307.2, 'E60 LRS': 79.205, 'E70 LRS': 1228.8, 'E80 LRS': 339.45
  },
  {
    name: 'eastus', Standard_DS2_v2: 0.064348, Standard_DS3_v2: 0.129137, Standard_DS4_v2: 0.257833, Standard_DS5_v2: 0.515667, 'E1 LRS': 0.03, 'E2 LRS': 0.6, 'E3 LRS': 0.12, 'E4 LRS': 0.26, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 1.83, 'E20 LRS': 3.29, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 51.1, 'E70 LRS': 1228.8, 'E80 LRS': 219.0
  },
  {
    name: 'southcentralus', Standard_DS2_v2: 0.025638, Standard_DS3_v2: 0.051276, Standard_DS4_v2: 0.102754, Standard_DS5_v2: 0.205307, 'E1 LRS': 0.3, 'E2 LRS': 0.072, 'E3 LRS': 0.144, 'E4 LRS': 0.312, 'E6 LRS': 0.564, 'E10 LRS': 1.092, 'E15 LRS': 19.2, 'E20 LRS': 3.948, 'E30 LRS': 7.884, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 61.32, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'eastasia', Standard_DS2_v2: 0.022339, Standard_DS3_v2: 0.044679, Standard_DS4_v2: 0.089461, Standard_DS5_v2: 0.178923, 'E1 LRS': 0.0465, 'E2 LRS': 0.093, 'E3 LRS': 1.2, 'E4 LRS': 0.403, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 20.367, 'E50 LRS': 307.2, 'E60 LRS': 79.205, 'E70 LRS': 169.72, 'E80 LRS': 339.45
  },
  {
    name: 'qatarcentral', Standard_DS2_v2: 0.0548, Standard_DS3_v2: 0.11, Standard_DS4_v2: 0.22, Standard_DS5_v2: 0.4396, 'E1 LRS': 0.0396, 'E2 LRS': 0.72, 'E3 LRS': 0.158, 'E4 LRS': 2.88, 'E6 LRS': 5.76, 'E10 LRS': 1.201, 'E15 LRS': 23.04, 'E20 LRS': 46.08, 'E30 LRS': 8.672, 'E40 LRS': 17.345, 'E50 LRS': 33.726, 'E60 LRS': 67.452, 'E70 LRS': 1474.56, 'E80 LRS': 2949.12
  },
  {
    name: 'francesouth', Standard_DS2_v2: 0.0228, Standard_DS3_v2: 0.0456, Standard_DS4_v2: 0.0912, Standard_DS5_v2: 0.1824, 'E1 LRS': 0.43, 'E2 LRS': 0.858, 'E3 LRS': 0.195, 'E4 LRS': 0.422, 'E6 LRS': 0.764, 'E10 LRS': 13.728, 'E15 LRS': 2.974, 'E20 LRS': 5.346, 'E30 LRS': 109.824, 'E40 LRS': 219.648, 'E50 LRS': 439.296, 'E60 LRS': 878.59, 'E70 LRS': 1757.18, 'E80 LRS': 3514.37
  },
  {
    name: 'eastus2', Standard_DS2_v2: 0.055175, Standard_DS3_v2: 0.110834, Standard_DS4_v2: 0.221667, Standard_DS5_v2: 0.443335, 'E1 LRS': 0.03, 'E2 LRS': 0.06, 'E3 LRS': 0.12, 'E4 LRS': 0.26, 'E6 LRS': 0.47, 'E10 LRS': 0.91, 'E15 LRS': 1.83, 'E20 LRS': 3.29, 'E30 LRS': 6.57, 'E40 LRS': 153.6, 'E50 LRS': 25.55, 'E60 LRS': 51.1, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'australiacentral', Standard_DS2_v2: 0.018686, Standard_DS3_v2: 0.037373, Standard_DS4_v2: 0.074857, Standard_DS5_v2: 0.149603, 'E1 LRS': 0.0435, 'E2 LRS': 1.02, 'E3 LRS': 2.04, 'E4 LRS': 3.264, 'E6 LRS': 0.682, 'E10 LRS': 1.32, 'E15 LRS': 26.112, 'E20 LRS': 4.77, 'E30 LRS': 9.526, 'E40 LRS': 208.896, 'E50 LRS': 417.79, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 3342.34
  },
  {
    name: 'uaecentral', Standard_DS2_v2: 0.01869, Standard_DS3_v2: 0.037485, Standard_DS4_v2: 0.07497, Standard_DS5_v2: 0.150045, 'E1 LRS': 0.0516, 'E2 LRS': 0.936, 'E3 LRS': 0.206, 'E4 LRS': 0.447, 'E6 LRS': 0.808, 'E10 LRS': 1.565, 'E15 LRS': 24.96, 'E20 LRS': 49.92, 'E30 LRS': 11.3, 'E40 LRS': 22.601, 'E50 LRS': 399.36, 'E60 LRS': 798.72, 'E70 LRS': 188.34, 'E80 LRS': 3194.88
  },
  {
    name: 'australiaeast', Standard_DS2_v2: 0.018598, Standard_DS3_v2: 0.037195, Standard_DS4_v2: 0.074501, Standard_DS5_v2: 0.148892, 'E1 LRS': 0.408, 'E2 LRS': 0.816, 'E3 LRS': 0.174, 'E4 LRS': 3.264, 'E6 LRS': 0.682, 'E10 LRS': 13.056, 'E15 LRS': 2.654, 'E20 LRS': 52.224, 'E30 LRS': 9.526, 'E40 LRS': 208.896, 'E50 LRS': 417.792, 'E60 LRS': 835.58, 'E70 LRS': 158.78, 'E80 LRS': 317.55
  },
  {
    name: 'ukwest', Standard_DS2_v2: 0.018056, Standard_DS3_v2: 0.036215, Standard_DS4_v2: 0.07243, Standard_DS5_v2: 0.144859, 'E1 LRS': 0.0393, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 2.397, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 17.213, 'E50 LRS': 337.92, 'E60 LRS': 66.941, 'E70 LRS': 143.44, 'E80 LRS': 2703.36
  },
  {
    name: 'southafricawest', Standard_DS2_v2: 0.0192, Standard_DS3_v2: 0.0385, Standard_DS4_v2: 0.0769, Standard_DS5_v2: 0.1539, 'E1 LRS': 0.504, 'E2 LRS': 1.008, 'E3 LRS': 0.228, 'E4 LRS': 4.032, 'E6 LRS': 8.064, 'E10 LRS': 1.727, 'E15 LRS': 32.256, 'E20 LRS': 64.512, 'E30 LRS': 129.02, 'E40 LRS': 24.94, 'E50 LRS': 516.1, 'E60 LRS': 1032.19, 'E70 LRS': 2064.38, 'E80 LRS': 4128.77
  },
  {
    name: 'uksouth', Standard_DS2_v2: 0.020642, Standard_DS3_v2: 0.041167, Standard_DS4_v2: 0.082334, Standard_DS5_v2: 0.164786, 'E1 LRS': 0.0375, 'E2 LRS': 0.66, 'E3 LRS': 0.15, 'E4 LRS': 2.64, 'E6 LRS': 0.588, 'E10 LRS': 1.138, 'E15 LRS': 2.288, 'E20 LRS': 4.112, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 273.75
  },
  {
    name: 'usgovtexas', Standard_DS2_v2: 0.014725, Standard_DS3_v2: 0.029347, Standard_DS4_v2: 0.058797, Standard_DS5_v2: 0.117594, 'E1 LRS': 0.0375, 'E2 LRS': 0.075, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 1.138, 'E15 LRS': 21.119999, 'E20 LRS': 42.239999, 'E30 LRS': 84.479999, 'E40 LRS': 168.959999, 'E50 LRS': 31.938, 'E60 LRS': 63.875, 'E70 LRS': 1351.68, 'E80 LRS': 273.75
  },
  {
    name: 'westus3', Standard_DS2_v2: 0.011459, Standard_DS3_v2: 0.023019, Standard_DS4_v2: 0.046038, Standard_DS5_v2: 0.092075, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 0.12, 'E4 LRS': 0.26, 'E6 LRS': 0.47, 'E10 LRS': 9.6, 'E15 LRS': 1.83, 'E20 LRS': 3.29, 'E30 LRS': 76.8, 'E40 LRS': 13.14, 'E50 LRS': 25.55, 'E60 LRS': 51.1, 'E70 LRS': 1228.8, 'E80 LRS': 219.0
  },
  {
    name: 'westus', Standard_DS2_v2: 0.015413, Standard_DS3_v2: 0.030715, Standard_DS4_v2: 0.061541, Standard_DS5_v2: 0.122971, 'E1 LRS': 0.3, 'E2 LRS': 0.078, 'E3 LRS': 0.156, 'E4 LRS': 0.338, 'E6 LRS': 4.8, 'E10 LRS': 1.183, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 33.215, 'E60 LRS': 66.43, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'brazilsoutheast', Standard_DS2_v2: 0.0223, Standard_DS3_v2: 0.0445, Standard_DS4_v2: 0.089, Standard_DS5_v2: 0.178, 'E1 LRS': 0.0313, 'E2 LRS': 1.6848, 'E3 LRS': 0.125, 'E4 LRS': 0.271, 'E6 LRS': 13.4784, 'E10 LRS': 0.949, 'E15 LRS': 1.908, 'E20 LRS': 3.43, 'E30 LRS': 6.849, 'E40 LRS': 13.698, 'E50 LRS': 862.6176, 'E60 LRS': 1725.23, 'E70 LRS': 3450.473, 'E80 LRS': 228.31
  },
  {
    name: 'australiacentral2', Standard_DS2_v2: 0.0168, Standard_DS3_v2: 0.0336, Standard_DS4_v2: 0.0673, Standard_DS5_v2: 0.1345, 'E1 LRS': 0.51, 'E2 LRS': 0.087, 'E3 LRS': 0.174, 'E4 LRS': 3.264, 'E6 LRS': 0.682, 'E10 LRS': 1.32, 'E15 LRS': 2.654, 'E20 LRS': 4.77, 'E30 LRS': 104.448, 'E40 LRS': 19.053, 'E50 LRS': 37.048, 'E60 LRS': 835.58, 'E70 LRS': 1671.17, 'E80 LRS': 317.55
  },
  {
    name: 'koreacentral', Standard_DS2_v2: 0.018342, Standard_DS3_v2: 0.036684, Standard_DS4_v2: 0.073367, Standard_DS5_v2: 0.146846, 'E1 LRS': 0.0405, 'E2 LRS': 0.081, 'E3 LRS': 1.2, 'E4 LRS': 0.351, 'E6 LRS': 4.8, 'E10 LRS': 1.228, 'E15 LRS': 2.47, 'E20 LRS': 4.442, 'E30 LRS': 76.8, 'E40 LRS': 17.739, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 147.82, 'E80 LRS': 2457.6
  },
  {
    name: 'attatlanta1', Standard_DS2_v2: 0.155, Standard_DS3_v2: 0.1236, Standard_DS4_v2: 0.2472, Standard_DS5_v2: 1.237, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 0.12, 'E4 LRS': 2.4, 'E6 LRS': 0.47, 'E10 LRS': 0.002, 'E15 LRS': 0.002, 'E20 LRS': 0.002, 'E30 LRS': 6.57, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 0.002, 'E70 LRS': 0.002, 'E80 LRS': 219.0
  },
  {
    name: 'centralindia', Standard_DS2_v2: 0.018758, Standard_DS3_v2: 0.037404, Standard_DS4_v2: 0.074919, Standard_DS5_v2: 0.149838, 'E1 LRS': 0.33, 'E2 LRS': 0.084, 'E3 LRS': 0.168, 'E4 LRS': 0.364, 'E6 LRS': 5.28, 'E10 LRS': 1.274, 'E15 LRS': 21.12, 'E20 LRS': 4.606, 'E30 LRS': 9.198, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 71.54, 'E70 LRS': 153.3, 'E80 LRS': 306.6
  },
  {
    name: 'southafricanorth', Standard_DS2_v2: 0.016105, Standard_DS3_v2: 0.032316, Standard_DS4_v2: 0.064632, Standard_DS5_v2: 0.129159, 'E1 LRS': 0.0438, 'E2 LRS': 0.0876, 'E3 LRS': 1.752, 'E4 LRS': 3.504, 'E6 LRS': 0.686, 'E10 LRS': 14.016, 'E15 LRS': 28.032, 'E20 LRS': 4.803, 'E30 LRS': 9.592, 'E40 LRS': 224.26, 'E50 LRS': 448.51, 'E60 LRS': 823.3, 'E70 LRS': 1646.59, 'E80 LRS': 319.74
  },
  {
    name: 'usgovarizona', Standard_DS2_v2: 0.014443, Standard_DS3_v2: 0.028785, Standard_DS4_v2: 0.057671, Standard_DS5_v2: 0.115342, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 0.15, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.559999, 'E15 LRS': 21.119999, 'E20 LRS': 4.112, 'E30 LRS': 84.479999, 'E40 LRS': 16.425, 'E50 LRS': 31.938, 'E60 LRS': 63.875, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'norwaywest', Standard_DS2_v2: 0.0194, Standard_DS3_v2: 0.0389, Standard_DS4_v2: 0.0778, Standard_DS5_v2: 0.1554, 'E1 LRS': 0.0558, 'E2 LRS': 0.858, 'E3 LRS': 1.716, 'E4 LRS': 0.483, 'E6 LRS': 0.874, 'E10 LRS': 13.728, 'E15 LRS': 3.402, 'E20 LRS': 54.912, 'E30 LRS': 12.214, 'E40 LRS': 219.65, 'E50 LRS': 47.497, 'E60 LRS': 878.59, 'E70 LRS': 1757.18, 'E80 LRS': 407.12
  },
  {
    name: 'brazilsouth', Standard_DS2_v2: 0.017459, Standard_DS3_v2: 0.035019, Standard_DS4_v2: 0.069936, Standard_DS5_v2: 0.139873, 'E1 LRS': 0.56, 'E2 LRS': 0.12, 'E3 LRS': 2.24, 'E4 LRS': 4.48, 'E6 LRS': 0.94, 'E10 LRS': 1.82, 'E15 LRS': 35.84, 'E20 LRS': 71.68, 'E30 LRS': 143.36, 'E40 LRS': 26.28, 'E50 LRS': 573.44, 'E60 LRS': 1146.88, 'E70 LRS': 219.0, 'E80 LRS': 4587.52
  },
  {
    name: 'norwayeast', Standard_DS2_v2: 0.015783, Standard_DS3_v2: 0.03146, Standard_DS4_v2: 0.062921, Standard_DS5_v2: 0.125841, 'E1 LRS': 0.33, 'E2 LRS': 0.0858, 'E3 LRS': 0.172, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 9.395, 'E40 LRS': 168.96, 'E50 LRS': 36.536, 'E60 LRS': 73.073, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'westus2', Standard_DS2_v2: 0.016212, Standard_DS3_v2: 0.032566, Standard_DS4_v2: 0.065132, Standard_DS5_v2: 0.130265, 'E1 LRS': 0.03, 'E2 LRS': 0.06, 'E3 LRS': 1.2, 'E4 LRS': 0.26, 'E6 LRS': 4.8, 'E10 LRS': 0.91, 'E15 LRS': 1.83, 'E20 LRS': 3.29, 'E30 LRS': 76.8, 'E40 LRS': 13.14, 'E50 LRS': 25.55, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'switzerlandnorth', Standard_DS2_v2: 0.016247, Standard_DS3_v2: 0.032494, Standard_DS4_v2: 0.064987, Standard_DS5_v2: 0.129855, 'E1 LRS': 0.045, 'E2 LRS': 0.09, 'E3 LRS': 0.18, 'E4 LRS': 0.39, 'E6 LRS': 5.76, 'E10 LRS': 1.365, 'E15 LRS': 2.745, 'E20 LRS': 46.08, 'E30 LRS': 9.855, 'E40 LRS': 184.32, 'E50 LRS': 368.64, 'E60 LRS': 76.65, 'E70 LRS': 1843.2, 'E80 LRS': 3686.4
  },
  {
    name: 'uaenorth', Standard_DS2_v2: 0.014914, Standard_DS3_v2: 0.029937, Standard_DS4_v2: 0.059873, Standard_DS5_v2: 0.119638, 'E1 LRS': 0.0396, 'E2 LRS': 0.72, 'E3 LRS': 0.158, 'E4 LRS': 0.343, 'E6 LRS': 5.76, 'E10 LRS': 11.52, 'E15 LRS': 23.04, 'E20 LRS': 46.08, 'E30 LRS': 92.16, 'E40 LRS': 184.32, 'E50 LRS': 368.64, 'E60 LRS': 67.452, 'E70 LRS': 144.54, 'E80 LRS': 289.08
  },
  {
    name: 'koreasouth', Standard_DS2_v2: 0.015543, Standard_DS3_v2: 0.030982, Standard_DS4_v2: 0.061964, Standard_DS5_v2: 0.124032, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 1.138, 'E15 LRS': 2.288, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 16.425, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 136.88, 'E80 LRS': 2457.6
  },
  {
    name: 'southeastasia', Standard_DS2_v2: 0.01938, Standard_DS3_v2: 0.038759, Standard_DS4_v2: 0.077396, Standard_DS5_v2: 0.154915, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 0.338, 'E6 LRS': 0.611, 'E10 LRS': 1.183, 'E15 LRS': 2.379, 'E20 LRS': 38.4, 'E30 LRS': 76.8, 'E40 LRS': 17.082, 'E50 LRS': 33.215, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'canadaeast', Standard_DS2_v2: 0.014322, Standard_DS3_v2: 0.028644, Standard_DS4_v2: 0.057288, Standard_DS5_v2: 0.114576, 'E1 LRS': 0.33, 'E2 LRS': 0.072, 'E3 LRS': 0.144, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 1.092, 'E15 LRS': 2.196, 'E20 LRS': 3.948, 'E30 LRS': 84.48, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 61.32, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'swedencentral', Standard_DS2_v2: 0.027853, Standard_DS3_v2: 0.055706, Standard_DS4_v2: 0.111411, Standard_DS5_v2: 0.222822, 'E1 LRS': 0.039, 'E2 LRS': 0.6, 'E3 LRS': 0.156, 'E4 LRS': 0.338, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 38.4, 'E30 LRS': 8.541, 'E40 LRS': 17.082, 'E50 LRS': 33.215, 'E60 LRS': 614.4, 'E70 LRS': 142.35, 'E80 LRS': 284.7
  },
  {
    name: 'centralus', Standard_DS2_v2: 0.016235, Standard_DS3_v2: 0.032582, Standard_DS4_v2: 0.065052, Standard_DS5_v2: 0.130104, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 0.148, 'E4 LRS': 0.32, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 4.047, 'E30 LRS': 8.081, 'E40 LRS': 16.162, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'westcentralus', Standard_DS2_v2: 0.024037, Standard_DS3_v2: 0.048074, Standard_DS4_v2: 0.096337, Standard_DS5_v2: 0.192485, 'E1 LRS': 0.036, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 2.4, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 3.948, 'E30 LRS': 7.884, 'E40 LRS': 15.768, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 131.4, 'E80 LRS': 262.8
  },
  {
    name: 'westindia', Standard_DS2_v2: 0.018032, Standard_DS3_v2: 0.035956, Standard_DS4_v2: 0.072019, Standard_DS5_v2: 0.144039, 'E1 LRS': 0.33, 'E2 LRS': 0.0828, 'E3 LRS': 1.32, 'E4 LRS': 0.359, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 18.133, 'E50 LRS': 35.259, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 302.22
  },
  {
    name: 'japaneast', Standard_DS2_v2: 0.021946, Standard_DS3_v2: 0.043785, Standard_DS4_v2: 0.087571, Standard_DS5_v2: 0.175141, 'E1 LRS': 0.0435, 'E2 LRS': 0.087, 'E3 LRS': 0.174, 'E4 LRS': 0.377, 'E6 LRS': 4.8, 'E10 LRS': 1.32, 'E15 LRS': 2.654, 'E20 LRS': 38.4, 'E30 LRS': 9.526, 'E40 LRS': 153.6, 'E50 LRS': 37.048, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'northeurope', Standard_DS2_v2: 0.0412, Standard_DS3_v2: 0.082088, Standard_DS4_v2: 0.164487, Standard_DS5_v2: 0.328662, 'E1 LRS': 0.3, 'E2 LRS': 0.6, 'E3 LRS': 1.2, 'E4 LRS': 0.312, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 19.2, 'E20 LRS': 3.948, 'E30 LRS': 7.884, 'E40 LRS': 15.768, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 262.8
  },
  {
    name: 'germanywestcentral', Standard_DS2_v2: 0.014881, Standard_DS3_v2: 0.029763, Standard_DS4_v2: 0.059525, Standard_DS5_v2: 0.119051, 'E1 LRS': 0.039, 'E2 LRS': 0.078, 'E3 LRS': 1.2, 'E4 LRS': 0.338, 'E6 LRS': 0.611, 'E10 LRS': 9.6, 'E15 LRS': 2.379, 'E20 LRS': 4.277, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 737.28, 'E70 LRS': 142.35, 'E80 LRS': 284.7
  },
  {
    name: 'francecentral', Standard_DS2_v2: 0.019261, Standard_DS3_v2: 0.038631, Standard_DS4_v2: 0.077263, Standard_DS5_v2: 0.154526, 'E1 LRS': 0.33, 'E2 LRS': 0.66, 'E3 LRS': 1.32, 'E4 LRS': 0.325, 'E6 LRS': 0.588, 'E10 LRS': 1.138, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 8.212, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 675.84, 'E70 LRS': 1351.68, 'E80 LRS': 2703.36
  },
  {
    name: 'northcentralus', Standard_DS2_v2: 0.016188, Standard_DS3_v2: 0.032487, Standard_DS4_v2: 0.064864, Standard_DS5_v2: 0.129727, 'E1 LRS': 0.3, 'E2 LRS': 0.072, 'E3 LRS': 1.2, 'E4 LRS': 0.312, 'E6 LRS': 0.564, 'E10 LRS': 9.6, 'E15 LRS': 2.196, 'E20 LRS': 3.948, 'E30 LRS': 76.8, 'E40 LRS': 153.6, 'E50 LRS': 307.2, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'southindia', Standard_DS2_v2: 0.017438, Standard_DS3_v2: 0.034773, Standard_DS4_v2: 0.06965, Standard_DS5_v2: 0.1393, 'E1 LRS': 0.0453, 'E2 LRS': 0.0906, 'E3 LRS': 0.181, 'E4 LRS': 0.393, 'E6 LRS': 4.8, 'E10 LRS': 9.6, 'E15 LRS': 2.763, 'E20 LRS': 4.968, 'E30 LRS': 9.921, 'E40 LRS': 19.841, 'E50 LRS': 38.58, 'E60 LRS': 614.4, 'E70 LRS': 1228.8, 'E80 LRS': 2457.6
  },
  {
    name: 'germanynorth', Standard_DS2_v2: 0.0174, Standard_DS3_v2: 0.0348, Standard_DS4_v2: 0.0697, Standard_DS5_v2: 0.1394, 'E1 LRS': 0.0507, 'E2 LRS': 0.101, 'E3 LRS': 1.56, 'E4 LRS': 0.439, 'E6 LRS': 6.24, 'E10 LRS': 1.538, 'E15 LRS': 24.96, 'E20 LRS': 5.56, 'E30 LRS': 99.84, 'E40 LRS': 199.68, 'E50 LRS': 399.36, 'E60 LRS': 86.359, 'E70 LRS': 185.06, 'E80 LRS': 370.11
  },
  {
    name: 'canadacentral', Standard_DS2_v2: 0.014038, Standard_DS3_v2: 0.028075, Standard_DS4_v2: 0.056151, Standard_DS5_v2: 0.112302, 'E1 LRS': 0.36, 'E2 LRS': 0.072, 'E3 LRS': 0.144, 'E4 LRS': 0.312, 'E6 LRS': 0.564, 'E10 LRS': 1.092, 'E15 LRS': 2.196, 'E20 LRS': 3.948, 'E30 LRS': 84.48, 'E40 LRS': 15.768, 'E50 LRS': 337.92, 'E60 LRS': 61.32, 'E70 LRS': 1351.68, 'E80 LRS': 262.8
  },
  {
    name: 'swedensouth', Standard_DS2_v2: 0.03625, Standard_DS3_v2: 0.072294, Standard_DS4_v2: 0.144794, Standard_DS5_v2: 0.289587, 'E1 LRS': 0.0507, 'E2 LRS': 0.101, 'E3 LRS': 1.56, 'E4 LRS': 0.439, 'E6 LRS': 0.794, 'E10 LRS': 12.48, 'E15 LRS': 3.093, 'E20 LRS': 5.56, 'E30 LRS': 11.103, 'E40 LRS': 199.68, 'E50 LRS': 43.18, 'E60 LRS': 86.359, 'E70 LRS': 1597.44, 'E80 LRS': 370.11
  },
  {
    name: 'australiasoutheast', Standard_DS2_v2: 0.015676, Standard_DS3_v2: 0.031299, Standard_DS4_v2: 0.062699, Standard_DS5_v2: 0.125399, 'E1 LRS': 0.408, 'E2 LRS': 0.816, 'E3 LRS': 0.168, 'E4 LRS': 3.264, 'E6 LRS': 6.528, 'E10 LRS': 13.056, 'E15 LRS': 26.112, 'E20 LRS': 4.606, 'E30 LRS': 104.448, 'E40 LRS': 208.896, 'E50 LRS': 35.77, 'E60 LRS': 71.54, 'E70 LRS': 1671.17, 'E80 LRS': 306.6
  },
  {
    name: 'jioindiacentral', 'E1 LRS': 0.042, 'E2 LRS': 0.084, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 5.28, 'E10 LRS': 10.56, 'E15 LRS': 21.12, 'E20 LRS': 42.24, 'E30 LRS': 9.198, 'E40 LRS': 168.96, 'E50 LRS': 337.92, 'E60 LRS': 71.54, 'E70 LRS': 1351.68, 'E80 LRS': 306.6
  },
  {
    name: 'jioindiawest', 'E1 LRS': 0.042, 'E2 LRS': 0.084, 'E3 LRS': 1.32, 'E4 LRS': 2.64, 'E6 LRS': 0.658, 'E10 LRS': 1.274, 'E15 LRS': 2.562, 'E20 LRS': 42.24, 'E30 LRS': 84.48, 'E40 LRS': 18.396, 'E50 LRS': 35.77, 'E60 LRS': 71.54, 'E70 LRS': 153.3, 'E80 LRS': 306.6
  },
  {
    name: 'Global', 'E4 LRS': 0.002, 'E6 LRS': 0.0
  },
]

export const version = '0'
