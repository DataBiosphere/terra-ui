// define metadata structures
interface EntityTypeMetadata {
  attributeNames: string[],
  count: number,
  idName: string
}

export interface EntityMetadata {
  [index: string]: EntityTypeMetadata
}

export enum EntityQuerySortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum EntityQueryFilterOperator {
  And = 'and',
  Or = 'or'
}

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
export type GetPage = (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => Promise<EntityQueryResponse>

export type GetMetadata = (signal: AbortSignal) => Promise<EntityMetadata>

export type DeleteTable = (entityType: string) => Promise<void>

export interface DataProviderFeatures {
  supportsTsvDownload: boolean,
  supportsTypeDeletion: boolean,
  supportsTypeRenaming: boolean,
  supportsExport: boolean,
  supportsPointCorrection: boolean,
  supportsFiltering: boolean
}

export interface DataProvider {
  features: DataProviderFeatures,
  getPage: GetPage,
  deleteTable: DeleteTable
  // todos that we will need soon:
  // getMetadata: GetMetadata
  // downloadTsv: function, see also supportsTsvDownload
  // updateAttribute: function, see also boolean
}

