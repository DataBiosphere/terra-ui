import _ from 'lodash/fp'


export const defaultAzureMachineType = 'Standard_DS2_v2'
export const defaultAzureDiskSize = 50
export const defaultAzureRegion = 'eastus'

export const defaultAzureComputeConfig = {
  machineType: defaultAzureMachineType,
  diskSize: defaultAzureDiskSize
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

