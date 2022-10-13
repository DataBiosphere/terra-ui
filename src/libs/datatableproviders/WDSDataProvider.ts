import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataProvider, DataProviderFeatures, EntityQueryFilterOperator, EntityQuerySortDirection, GetMetadata, GetPage } from 'src/libs/datatableproviders/DataProvider'

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

export class WDSDataProvider implements DataProvider {
  features: DataProviderFeatures = {
    enableTsvDownload: true,
    enableTypeDeletion: true,
    enableTypeRenaming: false,
    enableExport: false,
    enablePointCorrection: false,
    enableFiltering: false
  }

  getPage: GetPage = async (workspaceId: string, entityType: string, pageNumber: number,
    itemsPerPage: number, sortField: string, sortDirection: EntityQuerySortDirection,
    _namespace: string, _name: string, _snapshotName: string, _googleProject: string, _activeTextFilter: string, _filterOperator: string) => {
    const wdsPage = await Ajax().WorkspaceDataService
      .getRecords(workspaceId, entityType,
        _.merge({
          offset: (pageNumber - 1) * itemsPerPage,
          limit: itemsPerPage,
          sort: sortDirection
        },
        sortField === 'name' ? {} : { sortAttribute: sortField }
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
        page: pageNumber,
        pageSize: itemsPerPage,
        sortField,
        sortDirection,
        filterTerms: '', // unused so it doesn't matter
        filterOperator: EntityQueryFilterOperator.And // unused so it doesn't matter
      },
      resultMetadata: {
        filteredCount,
        unfilteredCount,
        filteredPageCount: -1 // unused so it doesn't matter
      }
    }
  }

  getMetadata: GetMetadata = async (workspaceId: string, _namespace: string, _name: string) => {
    const wdsSchema: RecordTypeSchema[] = await Ajax().WorkspaceDataService.getSchema(workspaceId)
    const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy(x => x.name, wdsSchema)
    return _.mapValues(typeDef => {
      return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
    }, keyedSchema)
  }
}
