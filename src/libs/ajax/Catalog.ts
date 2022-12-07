import * as _ from 'lodash/fp'
import { authOpts, fetchCatalog, jsonBody } from 'src/libs/ajax/ajax-common'


interface DatasetTableListEntry {
  name: string
  hasData?: boolean
}

interface DatasetTableListResponse {
  tables: DatasetTableListEntry[]
}

interface Column {
  name?: string
}

interface DatasetTableResponse {
  columns: Column[]
  rows: any[]
}


type DataUsePermission =
    'DUO:0000007' |
    'DUO:0000042' |
    'DUO:0000006' |
    'DUO:0000011' |
    'DUO:0000004'

type CloudRegion =
    'southamerica-west1' |
    'us-central1' |
    'us-east1' |
    'us-east4' |
    'us-west1' |
    'us-west4' |
    'europe-north1' |
    'europe-west1' |
    'europe-west4' |
    'asia-east1' |
    'asia-southeast1'

type CloudResource =
    'bigquery' |
    'firestore' |
    'bucket'

type CloudPlatform =
    'gcp' |
    'azure'

type AccessLevel =
    'owner' |
    'reader' |
    'discoverer' |
    'no_access'

interface Publication {
  'dct:title'?: string
  'dcat:accessURL'?: string
}

interface DataCollection {
  'dct:identifier'?: string
  'dct:title'?: string
  'dct:description'?: string
  'dct:creator'?: string
  'dct:publisher'?: string
  'dct:issued'?: string
  'dct:modified'?: string
}

interface GeneratedBy {
  'TerraCore:hasAssayCategory'?: string[]
  'TerraCore:hasDataModality'?: string[]
}

interface StorageObject {
  region?: CloudRegion
  cloudResource?: CloudResource
  cloudPlatform?: CloudPlatform
}

interface Counts {
  donors?: number
  samples?: number
  files?: number
}

interface FileTypeCounts {
  'TerraCore:hasFileFormat'?: string
  byteSize: number
  count: number
}

interface Samples {
  disease?: string[]
  species?: string[]
}

interface Contributor {
  name: string
  email: string
  additionalInformation: any
}

interface DatasetResponse {
  'TerraCore:id'?: string
  'dct:title': string
  'dct:description': string
  'dct:creator': string
  'dct:issued': string
  'dct:modified'?: string
  'dcat:accessURL': string
  'requestAccessURL'?: string
  'TerraDCAT_ap:hasDataUsePermission'?: DataUsePermission
  'TerraDCAT_ap:hasOriginalPublication'?: Publication
  'TerraDCAT_ap:hasPublication'?: Publication[]
  'TerraDCAT_ap:hasDataCollection': DataCollection[]
  'TerraDCAT_ap:hasOwner'?: string
  'TerraDCAT_ap:hasCustodian'?: string[]
  'TerraDCAT_ap:hasConsentGroup'?: string
  'TerraCoreValueSets:SampleType'?: string[]
  'prov:wasAssociatedWith'?: string[]
  'prov:wasGeneratedBy'?: GeneratedBy[]
  'TerraDCAT_ap:hasGenomicDataType'?: string[]
  'TerraDCAT_ap:hasPhenotypeDataType'?: string[]
  storage: StorageObject[]
  counts: Counts
  fileAggregate?: FileTypeCounts[]
  samples: Samples
  contributors: Contributor[]
  id: string
  accessLevel: AccessLevel
  phsId: string
}

interface DatasetListResponse {
  response: DatasetResponse[]
}

interface GetDatasetPreviewTableRequest {
  id: string
  tableName: string
}

interface ExportDatasetRequest {
  id: string
  workspaceId: string
}

export const Catalog = signal => ({
  getDatasets: async (): Promise<DatasetListResponse> => {
    const res = await fetchCatalog('v1/datasets', _.merge(authOpts(), { signal }))
    return res.json()
  },
  getDatasetTables: async (id: string): Promise<DatasetTableListResponse> => {
    const res = await fetchCatalog(`v1/datasets/${id}/tables`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  getDatasetPreviewTable: async ({ id, tableName }: GetDatasetPreviewTableRequest): Promise<DatasetTableResponse> => {
    const res = await fetchCatalog(`v1/datasets/${id}/tables/${tableName}`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  exportDataset: async ({ id, workspaceId }: ExportDatasetRequest): Promise<Response> => {
    return await fetchCatalog(`v1/datasets/${id}/export`, _.mergeAll([authOpts(), jsonBody({ workspaceId }), { signal, method: 'POST' }]))
  }
})
