import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataTableFeatures, DataTableProvider, DeleteTableFn, DownloadTsvFn, EntityQueryOptions, GetMetadataFn, GetPageFn } from 'src/libs/ajax/data-table-providers/DataTableProvider'


export class EntityServiceDataTableProvider implements DataTableProvider {
  constructor(namespace: string, name: string) {
    this.namespace = namespace
    this.name = name
  }

  namespace: string

  name: string

  features: DataTableFeatures = {
    supportsTsvDownload: true,
    supportsTsvAjaxDownload: false,
    supportsTypeDeletion: true,
    supportsTypeRenaming: true,
    supportsExport: true,
    supportsPointCorrection: true,
    supportsFiltering: true
  }

  getPage: GetPageFn = async (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions) => {
    return await Ajax(signal).Workspaces.workspace(this.namespace, this.name)
      .paginatedEntitiesOfType(entityType, _.pickBy(v => _.trim(v?.toString()), {
        page: queryOptions.pageNumber, pageSize: queryOptions.itemsPerPage,
        sortField: queryOptions.sortField, sortDirection: queryOptions.sortDirection,
        ...(!!queryOptions.snapshotName ?
          { billingProject: queryOptions.googleProject, dataReference: queryOptions.snapshotName } :
          { filterTerms: queryOptions.activeTextFilter, filterOperator: queryOptions.filterOperator })
      }))
  }

  getMetadata: GetMetadataFn = async (signal: AbortSignal) => {
    return await Ajax(signal).Workspaces.workspace(this.namespace, this.name).entityMetadata()
  }

  deleteTable: DeleteTableFn = async (entityType: string) => {
    return await Ajax().Workspaces.workspace(this.namespace, this.name).deleteEntitiesOfType(entityType)
  }

  downloadTsv: DownloadTsvFn = async (signal: AbortSignal, entityType: string) => {
    return await Ajax(signal).Workspaces.workspace(this.namespace, this.name).getEntitiesTsv(entityType)
  }
}
