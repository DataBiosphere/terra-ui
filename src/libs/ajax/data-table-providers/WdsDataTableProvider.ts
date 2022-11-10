import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import {
  AttributeArray,
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

type RecordAttributes = Record<string, unknown> // truly "unknown" here; the backend Java representation is Map<String, Object>

interface RecordResponse {
  id: string
  type: string
  attributes: RecordAttributes
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

export const relationUriScheme = 'terra-wds'

// Callers outside this module should not call this function. It returns a string array of size 2
// iff it looks like a valid relation URI; else it returns an empty array.
// Returning the array prevents callers from string-parsing the URI multiple times.
// This function does not verify that the record type and record id are syntactically
// valid according to WDS - for instance, do they contain special characters?
// WDS should own that logic. Here, we only check if the type and id are nonempty.
const getRelationParts = (val: unknown): string[] => {
  if (_.isString(val) && val.startsWith(`${relationUriScheme}:/`)) {
    const parts: string[] = val.substring(relationUriScheme.length + 2).split('/')
    if (parts.length === 2 && _.every(part => !!part, parts)) {
      return parts
    }
    return []
  }
  return []
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
    //WdsDataTableProvider and EntityServiceDataTableProvider use different variables to determine whether a file is invalid, so some are ignored here
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

  private maybeTransformRelation = (val: unknown): unknown => {
    const relationParts = getRelationParts(val)
    return relationParts.length ? { entityType: relationParts[0], entityName: relationParts[1] } : val
  }

  private toEntityServiceArray = (val: unknown[]): AttributeArray => {
    if (val.length && getRelationParts(val[0]).length) {
      // first element of the array looks like a relation. Now, check all elements.
      const translated: string[][] = val.map(getRelationParts)
      if (_.every(parts => parts.length, translated)) {
        const references = translated.map(parts => { return { entityType: parts[0], entityName: parts[1] } })
        return { itemsType: 'EntityReference', items: references }
      }
    }
    // empty array, or the first element isn't a relation; return as attribute values.
    return { itemsType: 'AttributeValue', items: val }
  }

  // transforms a WDS array to Entity Service array format
  private transformAttributes = (attributes: RecordAttributes): RecordAttributes => {
    return _.mapValues(val => {
      return _.isArray(val) ? this.toEntityServiceArray(val) : this.maybeTransformRelation(val)
    }, attributes)
  }

  protected transformPage = (wdsPage: RecordQueryResponse, recordType: string, queryOptions: EntityQueryOptions): EntityQueryResponse => {
    // translate WDS to Entity Service
    const filteredCount = wdsPage.totalRecords
    const unfilteredCount = wdsPage.totalRecords
    const results = _.map(rec => {
      return {
        entityType: recordType,
        attributes: this.transformAttributes(rec.attributes),
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
