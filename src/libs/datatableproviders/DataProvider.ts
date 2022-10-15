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
  resultMetadata: EntityQueryResultMetadata
  results: Entity[]
}

export type GetPage = (_signal: any, _workspaceId: string, _entityType: string, _pageNumber: number,
  _itemsPerPage: number, _sortField: string, _sortDirection: EntityQuerySortDirection,
  _namespace: string, _name: string, _snapshotName: string, _googleProject: string, _activeTextFilter: string, _filterOperator: string) => Promise<EntityQueryResponse>

export type GetMetadata = (_signal: any, _workspaceId: string, _namespace: string, _name: string) => Promise<EntityMetadata>

export type DeleteTable = (_signal: any, _workspaceId: string, _namespace: string, _name: string, _entityType: string) => Promise<any>

export interface DataProviderFeatures {
  enableTsvDownload: boolean,
  enableTypeDeletion: boolean,
  enableTypeRenaming: boolean,
  enableExport: boolean,
  enablePointCorrection: boolean,
  enableFiltering: boolean
}

export interface DataProvider {
  features: DataProviderFeatures,
  getPage: GetPage,
  deleteTable: DeleteTable
  // todos that we will need soon:
  // getMetadata: GetMetadata
  // downloadTsv: function, see also enableTsvDownload
  // updateAttribute: function, see also boolean
}

