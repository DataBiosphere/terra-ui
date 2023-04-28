import * as _ from "lodash/fp";
import { authOpts, fetchCatalog, jsonBody } from "src/libs/ajax/ajax-common";

// Types are pulled from https://github.com/DataBiosphere/terra-data-catalog/blob/main/common/src/main/resources/schema/development/schema.json
export type StorageSystem = "wks" | "ext" | "tdr";

export interface DatasetTableListEntry {
  name: string;
  hasData?: boolean;
}

export interface DatasetTableListResponse {
  tables: DatasetTableListEntry[];
}

export interface Column {
  name?: string;
}

export interface DatasetTableResponse {
  columns: Column[];
  rows: any[];
}

export type AccessLevel = "owner" | "reader" | "discoverer" | "no_access";

export type DatasetDataUsePermission = "DUO:0000007" | "DUO:0000042" | "DUO:0000006" | "DUO:0000011" | "DUO:0000004";

export const datasetDataUsePermissionTypes: Record<DatasetDataUsePermission, DatasetDataUsePermission> = {
  "DUO:0000007": "DUO:0000007",
  "DUO:0000042": "DUO:0000042",
  "DUO:0000006": "DUO:0000006",
  "DUO:0000011": "DUO:0000011",
  "DUO:0000004": "DUO:0000004",
};

export type GoogleCloudResource = "bigquery" | "firestore" | "bucket";

export const googleCloudResourceTypes: Record<GoogleCloudResource, GoogleCloudResource> = {
  bigquery: "bigquery",
  firestore: "firestore",
  bucket: "bucket",
};

export type GoogleCloudRegion =
  | "southamerica-west1"
  | "us-central1"
  | "us-east1"
  | "us-east4"
  | "us-west1"
  | "us-west4"
  | "europe-north1"
  | "europe-west1"
  | "europe-west4"
  | "asia-east1"
  | "asia-southeast1";

export const googleCloudRegionTypes: Record<GoogleCloudRegion, GoogleCloudRegion> = {
  "southamerica-west1": "southamerica-west1",
  "us-central1": "us-central1",
  "us-east1": "us-east1",
  "us-east4": "us-east4",
  "us-west1": "us-west1",
  "us-west4": "us-west4",
  "europe-north1": "europe-north1",
  "europe-west1": "europe-west1",
  "europe-west4": "europe-west4",
  "asia-east1": "asia-east1",
  "asia-southeast1": "asia-southeast1",
};

export type AzureCloudResource = "application_deployment" | "storage_account" | "synapse_workspace";

export const azureCloudResourceTypes: Record<AzureCloudResource, AzureCloudResource> = {
  application_deployment: "application_deployment",
  storage_account: "storage_account",
  synapse_workspace: "synapse_workspace",
};

export type AzureCloudRegion =
  | "eastus"
  | "eastus2"
  | "southcentralus"
  | "westus2"
  | "westus3"
  | "australiaeast"
  | "southeastasia"
  | "northeurope"
  | "swedencentral"
  | "uksouth"
  | "westeurope"
  | "centralus"
  | "southafricanorth"
  | "centralindia"
  | "eastasia"
  | "japaneast"
  | "koreacentral"
  | "canadacentral"
  | "francecentral"
  | "germanywestcentral"
  | "norwayeast"
  | "switzerlandnorth"
  | "uaenorth"
  | "brazilsouth"
  | "eassus2euap"
  | "qatarcentral"
  | "centralusstage"
  | "eastusstage"
  | "eastus2stage"
  | "northcentralusstage"
  | "southcentralusstage"
  | "westtusstage"
  | "westus2stage"
  | "asia"
  | "asiapacific"
  | "australia"
  | "brazil"
  | "canada"
  | "europe"
  | "france"
  | "germany"
  | "global"
  | "india"
  | "japan"
  | "korea"
  | "norway"
  | "singapore"
  | "southafrica"
  | "switzerland"
  | "uae"
  | "uk"
  | "unitedstates"
  | "unitedstateseuap"
  | "eastasiastage"
  | "southeastasiastage"
  | "eastusstg"
  | "southcentralusstg"
  | "northcentralus"
  | "westus"
  | "jioindiawest"
  | "centraluseuap"
  | "westcentralus"
  | "southafricawest"
  | "australiacentral"
  | "australiacentral2"
  | "australiasoutheast"
  | "japanwest"
  | "jioindiacentral"
  | "koreasouth"
  | "southindia"
  | "westindia"
  | "canadaeast"
  | "francesouth"
  | "germanynorth"
  | "norwaywest"
  | "switzerlandwest"
  | "ukwest"
  | "uaecentral"
  | "brazilsoutheast";

export const azureCloudRegionTypes: Record<AzureCloudRegion, AzureCloudRegion> = {
  eastus: "eastus",
  eastus2: "eastus2",
  southcentralus: "southcentralus",
  westus2: "westus2",
  westus3: "westus3",
  australiaeast: "australiaeast",
  southeastasia: "southeastasia",
  northeurope: "northeurope",
  swedencentral: "swedencentral",
  uksouth: "uksouth",
  westeurope: "westeurope",
  centralus: "centralus",
  southafricanorth: "southafricanorth",
  centralindia: "centralindia",
  eastasia: "eastasia",
  japaneast: "japaneast",
  koreacentral: "koreacentral",
  canadacentral: "canadacentral",
  francecentral: "francecentral",
  germanywestcentral: "germanywestcentral",
  norwayeast: "norwayeast",
  switzerlandnorth: "switzerlandnorth",
  uaenorth: "uaenorth",
  brazilsouth: "brazilsouth",
  eassus2euap: "eassus2euap",
  qatarcentral: "qatarcentral",
  centralusstage: "centralusstage",
  eastusstage: "eastusstage",
  eastus2stage: "eastus2stage",
  northcentralusstage: "northcentralusstage",
  southcentralusstage: "southcentralusstage",
  westtusstage: "westtusstage",
  westus2stage: "westus2stage",
  asia: "asia",
  asiapacific: "asiapacific",
  australia: "australia",
  brazil: "brazil",
  canada: "canada",
  europe: "europe",
  france: "france",
  germany: "germany",
  global: "global",
  india: "india",
  japan: "japan",
  korea: "korea",
  norway: "norway",
  singapore: "singapore",
  southafrica: "southafrica",
  switzerland: "switzerland",
  uae: "uae",
  uk: "uk",
  unitedstates: "unitedstates",
  unitedstateseuap: "unitedstateseuap",
  eastasiastage: "eastasiastage",
  southeastasiastage: "southeastasiastage",
  eastusstg: "eastusstg",
  southcentralusstg: "southcentralusstg",
  northcentralus: "northcentralus",
  westus: "westus",
  jioindiawest: "jioindiawest",
  centraluseuap: "centraluseuap",
  westcentralus: "westcentralus",
  southafricawest: "southafricawest",
  australiacentral: "australiacentral",
  australiacentral2: "australiacentral2",
  australiasoutheast: "australiasoutheast",
  japanwest: "japanwest",
  jioindiacentral: "jioindiacentral",
  koreasouth: "koreasouth",
  southindia: "southindia",
  westindia: "westindia",
  canadaeast: "canadaeast",
  francesouth: "francesouth",
  germanynorth: "germanynorth",
  norwaywest: "norwaywest",
  switzerlandwest: "switzerlandwest",
  ukwest: "ukwest",
  uaecentral: "uaecentral",
  brazilsoutheast: "brazilsoutheast",
};

export interface Publication {
  "dct:title"?: string;
  "dcat:accessURL"?: string;
}

export interface DataCollection {
  "dct:identifier"?: string;
  "dct:title"?: string;
  "dct:description"?: string;
  "dct:creator"?: string;
  "dct:publisher"?: string;
  "dct:issued"?: string;
  "dct:modified"?: string;
}

export interface GeneratedBy {
  "TerraCore:hasAssayCategory"?: string[];
  "TerraCore:hasDataModality"?: string[];
}

export interface StorageObject {
  region?: GoogleCloudRegion | AzureCloudRegion;
  cloudResource?: GoogleCloudResource | AzureCloudResource;
  cloudPlatform?: "gcp" | "azure";
}

export interface Counts {
  donors?: number;
  samples?: number;
  files?: number;
}

export interface FileTypeCounts {
  "TerraCore:hasFileFormat"?: string;
  byteSize: number;
  count: number;
}

export interface Samples {
  disease?: string[];
  species?: string[];
}

export interface Contributor {
  name?: string;
  email?: string;
  additionalInformation?: any;
}

// This interface represents all user defined fields for a dataset
export interface DatasetMetadata {
  "TerraCore:id"?: string;
  "dct:title": string;
  "dct:description": string;
  "dct:creator": string;
  "dct:issued": string;
  "dct:modified"?: string;
  "dcat:accessURL": string;
  "TerraDCAT_ap:hasDataUsePermission"?: string;
  "TerraDCAT_ap:hasOriginalPublication"?: Publication;
  "TerraDCAT_ap:hasPublication"?: Publication[];
  "TerraDCAT_ap:hasDataCollection": DataCollection[];
  "TerraDCAT_ap:hasOwner"?: string;
  "TerraDCAT_ap:hasCustodian"?: string[];
  "TerraDCAT_ap:hasConsentGroup"?: string;
  "TerraCoreValueSets:SampleType"?: string[];
  "prov:wasAssociatedWith"?: string[];
  "prov:wasGeneratedBy"?: GeneratedBy[];
  "TerraDCAT_ap:hasGenomicDataType"?: string[];
  "TerraDCAT_ap:hasPhenotypeDataType"?: string[];
  storage: StorageObject[];
  counts: Counts;
  fileAggregate?: FileTypeCounts[];
  samples: Samples;
  contributors: Contributor[];
}

// This interface adds all catalog generated fields for a dataset
export interface Dataset extends DatasetMetadata {
  requestAccessURL?: string;
  id: string;
  accessLevel: AccessLevel;
  phsId?: string;
}

export interface DatasetListResponse {
  result: Dataset[];
}

export interface GetDatasetPreviewTableRequest {
  id: string;
  tableName: string;
}

export interface ExportDatasetRequest {
  id: string;
  workspaceId: string;
}

export interface CatalogContract {
  upsertDataset: (
    storageSystem: StorageSystem,
    storageSourceId: string,
    metadata: DatasetMetadata
  ) => Promise<Response>;
  getDatasets: () => Promise<DatasetListResponse>;
  getDatasetTables: (id: string) => Promise<DatasetTableListResponse>;
  getDatasetPreviewTable: (request: GetDatasetPreviewTableRequest) => Promise<DatasetTableResponse>;
  exportDataset: (request: ExportDatasetRequest) => Promise<Response>;
}

const catalogGet = async <T>(url: string, signal: AbortSignal | undefined): Promise<T> => {
  const res = await fetchCatalog(url, _.merge(authOpts(), { signal }));
  return res.json();
};

const catalogPost = async (url: string, signal: AbortSignal | undefined, jsonBodyArg: object): Promise<Response> => {
  return await fetchCatalog(url, _.mergeAll([authOpts(), jsonBody(jsonBodyArg), { signal, method: "POST" }]));
};

export const Catalog = (signal?: AbortSignal): CatalogContract => ({
  upsertDataset: (storageSystem, storageSourceId, metadata) =>
    catalogPost("v1/datasets", signal, { storageSystem, storageSourceId, catalogEntry: metadata }),
  getDatasets: () => catalogGet("v1/datasets", signal),
  getDatasetTables: (id) => catalogGet(`v1/datasets/${id}/tables`, signal),
  getDatasetPreviewTable: ({ id, tableName }) => catalogGet(`v1/datasets/${id}/tables/${tableName}`, signal),
  exportDataset: ({ id, workspaceId }) => catalogPost(`v1/datasets/${id}/export`, signal, { workspaceId }),
});
