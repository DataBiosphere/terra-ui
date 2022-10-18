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
  // eslint-disable-next-line no-unused-vars
  Asc = 'asc',
  // eslint-disable-next-line no-unused-vars
  Desc = 'desc'
}

export enum EntityQueryFilterOperator {
  // eslint-disable-next-line no-unused-vars
  And = 'and',
  // eslint-disable-next-line no-unused-vars
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

export type GetPage = (signal: AbortSignal, workspaceId: string, entityType: string, pageNumber: number,
  itemsPerPage: number, sortField: string, sortDirection: EntityQuerySortDirection,
  namespace: string, name: string, snapshotName: string, googleProject: string, activeTextFilter: string, filterOperator: string) => Promise<EntityQueryResponse>

export type GetMetadata = (signal: AbortSignal, workspaceId: string, namespace: string, name: string) => Promise<EntityMetadata>

export type DeleteTable = (workspaceId: string, namespace: string, name: string, entityType: string) => Promise<void>

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

