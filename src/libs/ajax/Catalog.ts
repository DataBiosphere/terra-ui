import * as _ from 'lodash/fp'
import { authOpts, fetchCatalog, jsonBody } from 'src/libs/ajax/ajax-common'


export interface DatasetTableListEntry {
  name: string
  hasData?: boolean
}

export interface DatasetTableListResponse {
  tables: DatasetTableListEntry[]
}

export interface Column {
  name?: string
}

export interface DatasetTableResponse {
  columns: Column[]
  rows: any[]
}

export type AccessLevel =
    'owner' |
    'reader' |
    'discoverer' |
    'no_access'

export interface Publication {
  'dct:title'?: string
  'dcat:accessURL'?: string
}

export interface DataCollection {
  'dct:identifier'?: string
  'dct:title'?: string
  'dct:description'?: string
  'dct:creator'?: string
  'dct:publisher'?: string
  'dct:issued'?: string
  'dct:modified'?: string
}

export interface GeneratedBy {
  'TerraCore:hasAssayCategory'?: string[]
  'TerraCore:hasDataModality'?: string[]
}

export interface StorageObject {
  region?: string
  cloudResource?: string
  cloudPlatform?: string
}

export interface Counts {
  donors?: number
  samples?: number
  files?: number
}

export interface FileTypeCounts {
  'TerraCore:hasFileFormat'?: string
  byteSize: number
  count: number
}

export interface Samples {
  disease?: string[]
  species?: string[]
}

export interface Contributor {
  name: string
  email: string
  additionalInformation: any
}

export interface DatasetResponse {
  'TerraCore:id'?: string
  'dct:title': string
  'dct:description': string
  'dct:creator': string
  'dct:issued': string
  'dct:modified'?: string
  'dcat:accessURL': string
  'requestAccessURL'?: string
  'TerraDCAT_ap:hasDataUsePermission'?: string
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

export interface DatasetListResponse {
  result: DatasetResponse[]
}

export interface GetDatasetPreviewTableRequest {
  id: string
  tableName: string
}

export interface ExportDatasetRequest {
  id: string
  workspaceId: string
}

export interface CatalogContract {
  getDatasets: () => Promise<DatasetListResponse>
  getDatasetTables: (id: string) => Promise<DatasetTableListResponse>
  getDatasetPreviewTable: (request: GetDatasetPreviewTableRequest) => Promise<DatasetTableResponse>
  exportDataset: (request: ExportDatasetRequest) => Promise<Response>
}

const catalogGet = async <T>(url: string, signal: AbortSignal | undefined): Promise<T> => {
  const res = await fetchCatalog(url, _.merge(authOpts(), { signal }))
  return res.json()
}

const catalogPost = async (url: string, signal: AbortSignal | undefined, jsonBodyArg: object): Promise<Response> => {
  return await fetchCatalog(url, _.mergeAll([authOpts(), jsonBody(jsonBodyArg), { signal, method: 'POST' }]))
}

export const Catalog = (signal?: AbortSignal): CatalogContract => ({
  getDatasets: (): Promise<DatasetListResponse> => catalogGet('v1/datasets', signal),
  getDatasetTables: (id: string): Promise<DatasetTableListResponse> => catalogGet(`v1/datasets/${id}/tables`, signal),
  getDatasetPreviewTable: ({ id, tableName }: GetDatasetPreviewTableRequest): Promise<DatasetTableResponse> => catalogGet(`v1/datasets/${id}/tables/${tableName}`, signal),
  exportDataset: ({ id, workspaceId }: ExportDatasetRequest): Promise<Response> => catalogPost(`v1/datasets/${id}/export`, signal, { workspaceId })
})
