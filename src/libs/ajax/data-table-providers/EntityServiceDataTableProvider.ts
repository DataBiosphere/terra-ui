import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { DataTableFeatures, DataTableProvider, EntityQueryOptions, EntityQueryResponse } from 'src/libs/ajax/data-table-providers/DataTableProvider'


export class EntityServiceDataTableProvider implements DataTableProvider {
  constructor(namespace: string, name: string) {
    this.namespace = namespace
    this.name = name
  }

  providerName: string = 'Entity Service'

  namespace: string

  name: string

  features: DataTableFeatures = {
    supportsTsvDownload: true,
    supportsTsvAjaxDownload: false,
    supportsTypeDeletion: true,
    supportsTypeRenaming: true,
    supportsExport: true,
    supportsPointCorrection: true,
    supportsFiltering: true,
    supportsRowSelection: true
  }

  getPage = (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions): Promise<EntityQueryResponse> => {
    return Ajax(signal).Workspaces.workspace(this.namespace, this.name)
      .paginatedEntitiesOfType(entityType, _.pickBy(v => _.trim(v?.toString()), {
        page: queryOptions.pageNumber, pageSize: queryOptions.itemsPerPage,
        sortField: queryOptions.sortField, sortDirection: queryOptions.sortDirection,
        ...(!!queryOptions.snapshotName ?
          { billingProject: queryOptions.googleProject, dataReference: queryOptions.snapshotName } :
          { filterTerms: queryOptions.activeTextFilter, filterOperator: queryOptions.filterOperator })
      }))
  }

  deleteTable = (entityType: string): Promise<Response> => {
    return Ajax().Workspaces.workspace(this.namespace, this.name).deleteEntitiesOfType(entityType)
  }

  downloadTsv = (signal: AbortSignal, entityType: string): Promise<Blob> => {
    return Ajax(signal).Workspaces.workspace(this.namespace, this.name).getEntitiesTsv(entityType)
  }
}
