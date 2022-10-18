// eslint-disable-next-line lodash-fp/use-fp
import { ValueKeyIteratee } from 'lodash'
import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataProvider, DataProviderFeatures, DeleteTable, EntityQuerySortDirection, GetMetadata, GetPage } from 'src/libs/datatableproviders/DataProvider'


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

  getPage: GetPage = async (signal: AbortSignal, _workspaceId: string, entityType: string, pageNumber: number,
    itemsPerPage: number, sortField: string, sortDirection: EntityQuerySortDirection,
    namespace: string, name: string, snapshotName: string, googleProject: string, activeTextFilter: string, filterOperator: string) => {
    return await Ajax(signal).Workspaces.workspace(namespace, name)
      .paginatedEntitiesOfType(entityType, _.pickBy(_.trim as ValueKeyIteratee<string | number>, {
        page: pageNumber, pageSize: itemsPerPage, sortField, sortDirection,
        ...(!!snapshotName ?
          { billingProject: googleProject, dataReference: snapshotName } :
          { filterTerms: activeTextFilter, filterOperator })
      }))
  }

  getMetadata: GetMetadata = async (signal: AbortSignal) => {
    return await Ajax(signal).Workspaces.workspace(this.namespace, this.name).entityMetadata()
  }

  deleteTable: DeleteTable = async (entityType: string) => {
    return await Ajax().Workspaces.workspace(this.namespace, this.name).deleteEntitiesOfType(entityType)
  }
}
