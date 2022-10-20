// define metadata structures
interface EntityTypeMetadata {
  attributeNames: string[],
  count: number,
  idName: string
}

export interface EntityMetadata {
  [index: string]: EntityTypeMetadata
}

export type EntityQuerySortDirection = 'asc' | 'desc'

export type EntityQueryFilterOperator = 'and' | 'or'

// define paginated query result structures
interface EntityQuery {
  page: number,
  pageSize: number,
  sortField: string,
  sortDirection: EntityQuerySortDirection,
  filterTerms: string,
  filterOperator: EntityQueryFilterOperator
}
interface EntityQueryResultMetadata {
  unfilteredCount: number,
  filteredCount: number,
  filteredPageCount: number
}
interface Entity {
  name: string,
  entityType: string,
  attributes: Record<string, any>
}

export interface EntityQueryResponse {
  parameters: EntityQuery,
  resultMetadata: EntityQueryResultMetadata,
  results: Entity[]
}

export interface EntityQueryOptions {
  pageNumber: number,
  itemsPerPage: number,
  sortField: string,
  sortDirection: EntityQuerySortDirection,
  snapshotName: string,
  googleProject: string,
  activeTextFilter: string,
  filterOperator: string
}

// queryOptions can contain:
export type GetPageFn = (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => Promise<EntityQueryResponse>

export type GetMetadataFn = (signal: AbortSignal) => Promise<EntityMetadata>

export type DeleteTableFn = (entityType: string) => Promise<void>

export interface DataTableFeatures {
  supportsTsvDownload: boolean,
  supportsTypeDeletion: boolean,
  supportsTypeRenaming: boolean,
  supportsExport: boolean,
  supportsPointCorrection: boolean,
  supportsFiltering: boolean
}

export interface DataTableProvider {
  features: DataTableFeatures,
  getPage: GetPageFn,
  deleteTable: DeleteTableFn
  // todos that we will need soon:
  // getMetadata: GetMetadataFn
  // downloadTsv: function, see also supportsTsvDownload
  // updateAttribute: function, see also boolean
}

