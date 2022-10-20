// eslint-disable-next-line lodash-fp/use-fp
import { ValueKeyIteratee } from 'lodash'
import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataProvider, DataProviderFeatures, DeleteTableFn, EntityQueryOptions, GetMetadataFn, GetPageFn } from 'src/libs/datatableproviders/DataProvider'


export class EntityServiceDataProvider implements DataProvider {
  constructor(namespace: string, name: string) {
    this.namespace = namespace
    this.name = name
  }

  namespace: string

  name: string

  features: DataProviderFeatures = {
    supportsTsvDownload: true,
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
}
