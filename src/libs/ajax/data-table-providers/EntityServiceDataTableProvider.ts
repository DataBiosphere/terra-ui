import _ from 'lodash/fp'
import { notifyDataImportProgress } from 'src/components/data/data-utils'
import { Ajax } from 'src/libs/ajax'
import {
  DataTableFeatures,
  DataTableProvider,
  DeleteTableFn, disabledFn,
  DownloadTsvFn,
  EntityQueryOptions,
  GetMetadataFn,
  GetPageFn,
  isInvalidFn,
  tooltipFn,
  uploadFn
} from 'src/libs/ajax/data-table-providers/DataTableProvider'
import { asyncImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


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
    supportsFiltering: true,
    supportsTabBar: true,
    needsTypeInput: false,
    uploadInstructions: 'Choose the data import option below. ',
    sampleTSVLink: 'https://storage.googleapis.com/terra-featured-workspaces/Table_templates/2-template_sample-table.tsv',
    invalidFormatWarning: 'Invalid format: Data does not start with entity or membership definition.'
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

  isInvalid: isInvalidFn = (modeMatches: boolean, filePresent: boolean, match: boolean, _: boolean) => {
    return modeMatches && filePresent && match
  }

  disabled: disabledFn = (filePresent: boolean, isInvalid: boolean, uploading: boolean, _: boolean) => {
    return !filePresent || isInvalid || uploading
  }

  tooltip: tooltipFn = (filePresent: boolean, isInvalid: boolean, _: boolean) => {
    return !filePresent || isInvalid ? 'Please select valid data to upload' : 'Upload selected data'
  }

  doUpload: uploadFn = async (_0: string, _1: string, file: File, useFireCloudDataModel: boolean, deleteEmptyValues: boolean, namespace: string, name: string) => {
    const workspace = Ajax().Workspaces.workspace(namespace, name)
    if (useFireCloudDataModel) {
      await workspace.importEntitiesFile(file, { deleteEmptyValues })
    } else {
      const filesize = file?.size || Number.MAX_SAFE_INTEGER
      if (filesize < 524288) { // 512k
        await workspace.importFlexibleEntitiesFileSynchronous(file, { deleteEmptyValues })
      } else {
        const { jobId } = await workspace.importFlexibleEntitiesFileAsync(file, { deleteEmptyValues })
        asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
        notifyDataImportProgress(jobId)
      }
    }
  }
}
