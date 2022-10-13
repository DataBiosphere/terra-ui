

// define metadata structures
interface EntityTypeMetadata {
    attributeNames: string[],
    count: number,
    idName: string
}

export interface EntityMetadata {
    [index: string]: EntityTypeMetadata
}

// TODO: I want to define these enums for type safety, but they
// throw unused-vars warnings. Is that expected?
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
// TODO: pass signal argument?
// TODO: I want to define these function signatures, including arguments, so any implementing classes must respect them.
// but, including arguments here leads to unused-vars warnings. Is that expected?
// eslint-disable-next-line no-unused-vars
export type GetPage = (workspaceId: string, entityType: string, pageNumber: number,
    // eslint-disable-next-line no-unused-vars
    itemsPerPage: number, sortField: string, sortDirection: EntityQuerySortDirection) => Promise<EntityQueryResponse> // TODO: what other arguments are needed?
// eslint-disable-next-line no-unused-vars
export type GetMetadata = (workspaceId: string) => Promise<EntityMetadata>// TODO: what other arguments are needed?

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
    getMetadata: GetMetadata
    // todos:
    // deleteType: function, see also enableTypeDeletion
    // downloadTsv: function, see also enableTsvDownload
    // updateAttribute: function, see also boolean
}

