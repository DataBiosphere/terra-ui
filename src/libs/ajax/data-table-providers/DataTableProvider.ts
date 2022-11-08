// define metadata structures
export interface EntityTypeMetadata {
  attributeNames: string[]
  count: number
  idName: string
}

export interface EntityMetadata {
  [index: string]: EntityTypeMetadata
}

export type EntityQuerySortDirection = 'asc' | 'desc'

export type EntityQueryFilterOperator = 'and' | 'or'

// define paginated query result structures
interface EntityQuery {
  page: number
  pageSize: number
  sortField: string
  sortDirection: EntityQuerySortDirection
  filterTerms: string
  filterOperator: EntityQueryFilterOperator
}
interface EntityQueryResultMetadata {
  unfilteredCount: number
  filteredCount: number
  filteredPageCount: number
}
interface Entity {
  name: string
  entityType: string
  attributes: Record<string, any>
}

export interface EntityQueryResponse {
  parameters: EntityQuery
  resultMetadata: EntityQueryResultMetadata
  results: Entity[]
}

export interface EntityQueryOptions {
  pageNumber: number
  itemsPerPage: number
  sortField: string
  sortDirection: EntityQuerySortDirection
  snapshotName: string
  googleProject: string
  activeTextFilter: string
  filterOperator: string
}

export interface UploadParameters {
  file: File
  useFireCloudDataModel: boolean
  deleteEmptyValues: boolean
  namespace: string
  name: string
  workspaceId: string
  recordType: string
}

// queryOptions can contain:
export type GetPageFn = (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => Promise<EntityQueryResponse>

export type GetMetadataFn = (signal: AbortSignal) => Promise<EntityMetadata>

export type DeleteTableFn = (entityType: string) => Promise<Response>

export type DownloadTsvFn = (signal: AbortSignal, entityType: string) => Promise<Blob>

export type isInvalidTsvFn = (modeMatches: boolean, filePresent: boolean, match: boolean, sysNamePresent: boolean) => boolean

export type isTsvUploadButtonDisabledFn = (filePresent: boolean, isInvalid: boolean, uploading: boolean, recordTypePresent: boolean) => boolean

export type tsvUploadButtonTooltipFn = (filePresent: boolean, isInvalid: boolean, recordTypePresent: boolean) => string

export type uploadTsvFn = (uploadParams: UploadParameters) => Promise<Response>

export interface DataTableFeatures {
  supportsTsvDownload: boolean
  supportsTsvAjaxDownload: boolean
  supportsTypeDeletion: boolean
  supportsTypeRenaming: boolean
  supportsExport: boolean
  supportsPointCorrection: boolean
  supportsFiltering: boolean
  supportsTabBar: boolean
}

export interface TSVFeatures {
  needsTypeInput: boolean
  uploadInstructions: string
  sampleTSVLink: string
  invalidFormatWarning: string
  isInvalid: isInvalidTsvFn
  disabled: isTsvUploadButtonDisabledFn
  tooltip: tsvUploadButtonTooltipFn
}

export interface DataTableProvider {
  features: DataTableFeatures
  tsvFeatures: TSVFeatures
  getPage: GetPageFn
  deleteTable: DeleteTableFn
  downloadTsv: DownloadTsvFn
  uploadTsv: uploadTsvFn
  // todos that we may need soon:
  // getMetadata: GetMetadataFn
  // updateAttribute: function, see also boolean
}

