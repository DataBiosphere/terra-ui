// eslint-disable-next-line lodash-fp/use-fp
import { ValueKeyIteratee } from 'lodash'
import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataProvider, DataProviderFeatures, DeleteTable, EntityQuerySortDirection, GetMetadata, GetPage } from 'src/libs/datatableproviders/DataProvider'


export class EntityServiceDataProvider implements DataProvider {
  features: DataProviderFeatures = {
    enableTsvDownload: true,
    enableTypeDeletion: true,
    enableTypeRenaming: true,
    enableExport: true,
    enablePointCorrection: true,
    enableFiltering: true
  }

  getPage: GetPage = async (_workspaceId: string, entityType: string, pageNumber: number,
    itemsPerPage: number, sortField: string, sortDirection: EntityQuerySortDirection,
    namespace: string, name: string, snapshotName: string, googleProject: string, activeTextFilter: string, filterOperator: string) => {
    return await Ajax().Workspaces.workspace(namespace, name)
      .paginatedEntitiesOfType(entityType, _.pickBy(_.trim as ValueKeyIteratee<string | number>, {
        page: pageNumber, pageSize: itemsPerPage, sortField, sortDirection,
        ...(!!snapshotName ?
          { billingProject: googleProject, dataReference: snapshotName } :
          { filterTerms: activeTextFilter, filterOperator })
      }))
  }

  getMetadata: GetMetadata = async (_workspaceId: string, namespace: string, name: string) => {
    return await Ajax().Workspaces.workspace(namespace, name).entityMetadata()
  }

  deleteTable: DeleteTable = async (_workspaceId: string, namespace: string, name: string, entityType: string) => {
    return await Ajax().Workspaces.workspace(namespace, name).deleteEntitiesOfType(entityType)
  }
}
