import _ from 'lodash/fp'
import { notifyDataImportProgress } from 'src/components/data/data-utils'
import { Ajax } from 'src/libs/ajax'
import {
  DataTableFeatures,
  DataTableProvider,
  EntityQueryOptions,
  EntityQueryResponse, InvalidTsvOptions, TSVFeatures, TsvUploadButtonDisabledOptions,
  TsvUploadButtonTooltipOptions,
  UploadParameters
} from 'src/libs/ajax/data-table-providers/DataTableProvider'
import { asyncImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


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

  tsvFeatures: TSVFeatures = {
    needsTypeInput: false,
    sampleTSVLink: 'https://storage.googleapis.com/terra-featured-workspaces/Table_templates/2-template_sample-table.tsv',
    invalidFormatWarning: 'Invalid format: Data does not start with entity or membership definition.',
    isInvalid: (options: InvalidTsvOptions): boolean => {
      return options.fileImportModeMatches && options.filePresent && options.match
    },
    disabled: (options: TsvUploadButtonDisabledOptions): boolean => {
      return !options.filePresent || options.isInvalid || options.uploading
    },
    tooltip: (options: TsvUploadButtonTooltipOptions): string => {
      return !options.filePresent || options.isInvalid ? 'Please select valid data to upload' : 'Upload selected data'
    }
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

  uploadTsv = async (uploadParams: UploadParameters): Promise<any> => {
    const workspace = Ajax().Workspaces.workspace(uploadParams.namespace, uploadParams.name)
    if (uploadParams.useFireCloudDataModel) {
      return workspace.importEntitiesFile(uploadParams.file, { deleteEmptyValues: uploadParams.deleteEmptyValues })
    } else {
      const filesize = uploadParams.file?.size || Number.MAX_SAFE_INTEGER
      if (filesize < 524288) { // 512k
        return workspace.importFlexibleEntitiesFileSynchronous(uploadParams.file, { deleteEmptyValues: uploadParams.deleteEmptyValues })
      } else {
        const { jobId } = await workspace.importFlexibleEntitiesFileAsync(uploadParams.file, { deleteEmptyValues: uploadParams.deleteEmptyValues })
        asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace: uploadParams.namespace, name: uploadParams.name }, jobId }))
        notifyDataImportProgress(jobId)
      }
    }
  }
}
