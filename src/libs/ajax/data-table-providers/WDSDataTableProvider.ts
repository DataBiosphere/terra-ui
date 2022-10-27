import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataTableFeatures, DataTableProvider, DeleteTableFn, DownloadTsvFn, EntityMetadata, EntityQueryOptions, EntityQueryResponse, GetMetadataFn, GetPageFn } from 'src/libs/ajax/data-table-providers/DataTableProvider'

// interface definitions for WDS payload responses
interface AttributeSchema {
  name: string,
  datatype: string,
  relatesTo?: string
}

export interface RecordTypeSchema {
  name: string,
  count: number,
  attributes: AttributeSchema[]
}

interface SearchRequest {
  offset: number,
  limit: number,
  sort: 'asc' | 'ASC' | 'desc' | 'DESC',
  sortAttribute: string
}

interface RecordResponse {
  id: string,
  type: string,
  attributes: { [index: string]: any } // truly "any" here; the backend Java representation is Map<String, Object>
}

export interface RecordQueryResponse {
  searchRequest: SearchRequest,
  totalRecords: number,
  records: RecordResponse[]
}


export class WDSDataTableProvider implements DataTableProvider {
  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  workspaceId: string

  features: DataTableFeatures = {
    supportsTsvDownload: false,
    supportsTsvAjaxDownload: true,
    supportsTypeDeletion: true,
    supportsTypeRenaming: false,
    supportsExport: false,
    supportsPointCorrection: false,
    supportsFiltering: false
  }

  transformPage: (arg0: RecordQueryResponse, arg1: string, arg2: EntityQueryOptions) => EntityQueryResponse = (wdsPage: RecordQueryResponse, recordType: string, queryOptions: EntityQueryOptions) => {
    // translate WDS to Entity Service
    const filteredCount = wdsPage.totalRecords
    const unfilteredCount = wdsPage.totalRecords
    const results = _.map(rec => {
      return {
        entityType: recordType,
        attributes: rec.attributes,
        name: rec.id
      }
    }, wdsPage.records)

    return {
      results,
      parameters: {
        page: queryOptions.pageNumber,
        pageSize: queryOptions.itemsPerPage,
        sortField: queryOptions.sortField,
        sortDirection: queryOptions.sortDirection,
        filterTerms: '', // unused so it doesn't matter
        filterOperator: 'and' // unused so it doesn't matter
      },
      resultMetadata: {
        filteredCount,
        unfilteredCount,
        filteredPageCount: -1 // unused so it doesn't matter
      }
    }
  }

  getPage: GetPageFn = async (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => {
    const wdsPage: RecordQueryResponse = await Ajax(signal).WorkspaceDataService
      .getRecords(this.workspaceId, entityType,
        _.merge({
          offset: (queryOptions.pageNumber - 1) * queryOptions.itemsPerPage,
          limit: queryOptions.itemsPerPage,
          sort: queryOptions.sortDirection
        },
        queryOptions.sortField === 'name' ? {} : { sortAttribute: queryOptions.sortField }
        ))
    return this.transformPage(wdsPage, entityType, queryOptions)
  }

  transformMetadata: (arg0: RecordTypeSchema[]) => EntityMetadata = (wdsSchema: RecordTypeSchema[]) => {
    const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy(x => x.name, wdsSchema)
    return _.mapValues(typeDef => {
      return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
    }, keyedSchema)
  }

  getMetadata: GetMetadataFn = async (signal: AbortSignal) => {
    const wdsSchema: RecordTypeSchema[] = await Ajax(signal).WorkspaceDataService.getSchema(this.workspaceId)
    return this.transformMetadata(wdsSchema)
  }

  deleteTable: DeleteTableFn = async (entityType: string) => {
    return await Ajax().WorkspaceDataService.deleteTable(this.workspaceId, entityType)
  }

  downloadTsv: DownloadTsvFn = async (signal: AbortSignal, entityType: string) => {
    return await Ajax(signal).WorkspaceDataService.downloadTsv(this.workspaceId, entityType).then(r => r.blob())
  }
}
