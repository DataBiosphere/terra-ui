import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataTableFeatures, DataTableProvider, DeleteTableFn, DownloadTsvFn, EntityQueryOptions, GetMetadataFn, GetPageFn } from 'src/libs/ajax/data-table-providers/DataTableProvider'

// interface definitions for WDS payload responses
interface AttributeSchema {
    name: string,
    datatype: string,
    relatesTo?: string
}

interface RecordTypeSchema {
    name: string,
    count: number,
    attributes: AttributeSchema[]
}

export class WDSDataProvider implements DataTableProvider {
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

  getPage: GetPageFn = async (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => {
    const wdsPage = await Ajax(signal).WorkspaceDataService
      .getRecords(this.workspaceId, entityType,
        _.merge({
          offset: (queryOptions.pageNumber - 1) * queryOptions.itemsPerPage,
          limit: queryOptions.itemsPerPage,
          sort: queryOptions.sortDirection
        },
        queryOptions.sortField === 'name' ? {} : { sortAttribute: queryOptions.sortField }
        ))

    // translate WDS to Entity Service
    const filteredCount = wdsPage.totalRecords
    const unfilteredCount = wdsPage.totalRecords
    const results = _.map(rec => {
      return {
        entityType,
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

  getMetadata: GetMetadataFn = async (signal: AbortSignal) => {
    const wdsSchema: RecordTypeSchema[] = await Ajax(signal).WorkspaceDataService.getSchema(this.workspaceId)
    const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy(x => x.name, wdsSchema)
    return _.mapValues(typeDef => {
      return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
    }, keyedSchema)
  }

  deleteTable: DeleteTableFn = async (entityType: string) => {
    return await Ajax().WorkspaceDataService.deleteTable(this.workspaceId, entityType)
  }

  downloadTsv: DownloadTsvFn = async (signal: AbortSignal, entityType: string) => {
    return await Ajax(signal).WorkspaceDataService.downloadTsv(this.workspaceId, entityType).then(r => r.blob())
  }
}
