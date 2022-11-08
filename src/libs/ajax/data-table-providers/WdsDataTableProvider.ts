import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import {
  DataTableFeatures,
  DataTableProvider,
  EntityMetadata,
  EntityQueryOptions,
  EntityQueryResponse,
  TSVFeatures,
  UploadParameters, uploadTsvFn
} from 'src/libs/ajax/data-table-providers/DataTableProvider'

// interface definitions for WDS payload responses
interface AttributeSchema {
  name: string
  datatype: string
  relatesTo?: string
}

export interface RecordTypeSchema {
  name: string
  count: number
  attributes: AttributeSchema[]
}

export interface SearchRequest {
  offset: number
  limit: number
  sort: 'asc' | 'desc'
  sortAttribute?: string
}

interface RecordResponse {
  id: string
  type: string
  attributes: Record<string, unknown> // truly "unknown" here; the backend Java representation is Map<String, Object>
}

export interface RecordQueryResponse {
  searchRequest: SearchRequest
  totalRecords: number
  records: RecordResponse[]
}


export const wdsToEntityServiceMetadata = (wdsSchema: RecordTypeSchema[]): EntityMetadata => {
  const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy(x => x.name, wdsSchema)
  return _.mapValues(typeDef => {
    return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
  }, keyedSchema)
}

export class WdsDataTableProvider implements DataTableProvider {
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
    supportsFiltering: false,
    supportsTabBar: false
  }

  tsvFeatures: TSVFeatures = {
    needsTypeInput: true,
    uploadInstructions: 'Choose the data to import below. ',
    sampleTSVLink: 'src/../wds_template.tsv', //TODO: placeholder, does not currently work
    invalidFormatWarning: 'Invalid format: Data does not include sys_name column.',
    isInvalid: (_0: boolean, filePresent: boolean, _2: boolean, sysNamePresent: boolean) => {
      return !sysNamePresent && filePresent
    },
    disabled: (filePresent: boolean, isInvalid: boolean, uploading: boolean, recordTypePresent: boolean) => {
      return !filePresent || isInvalid || uploading || !recordTypePresent
    },
    tooltip: (filePresent: boolean, isInvalid: boolean, recordTypePresent: boolean) => {
      return !recordTypePresent ? 'Please enter record type' : !filePresent || isInvalid ? 'Please select valid data to upload' : 'Upload selected data'
    }
  }

  protected transformPage = (wdsPage: RecordQueryResponse, recordType: string, queryOptions: EntityQueryOptions): EntityQueryResponse => {
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
    // TODO: AJ-661 map WDS arrays to Entity Service array format

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

  getPage = async (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions): Promise<EntityQueryResponse> => {
    const wdsPage: RecordQueryResponse = await Ajax(signal).WorkspaceData
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

  deleteTable = (entityType: string): Promise<Response> => {
    return Ajax().WorkspaceData.deleteTable(this.workspaceId, entityType)
  }

  downloadTsv = (signal: AbortSignal, entityType: string): Promise<Blob> => {
    return Ajax(signal).WorkspaceData.downloadTsv(this.workspaceId, entityType)
  }

  uploadTsv: uploadTsvFn = (uploadParams: UploadParameters) => {
    return Ajax().WorkspaceData.uploadTsv(uploadParams.workspaceId, uploadParams.recordType, uploadParams.file)
  }
}
