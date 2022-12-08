import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import {
  AttributeArray,
  DataTableFeatures,
  DataTableProvider,
  EntityMetadata,
  EntityQueryOptions,
  EntityQueryResponse, InvalidTsvOptions, TSVFeatures, TsvUploadButtonDisabledOptions,
  TsvUploadButtonTooltipOptions,
  UploadParameters
} from 'src/libs/ajax/data-table-providers/DataTableProvider'
import * as Utils from 'src/libs/utils'

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
  primaryKey: string
}

export interface SearchRequest {
  offset: number
  limit: number
  sort: 'asc' | 'desc'
  sortAttribute?: string
}

export type RecordAttributes = Record<string, unknown> // truly "unknown" here; the backend Java representation is Map<String, Object>

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

export interface TsvUploadResponse {
  message: string
  recordsModified: number
}


export const wdsToEntityServiceMetadata = (wdsSchema: RecordTypeSchema[]): EntityMetadata => {
  const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy(x => x.name, wdsSchema)
  return _.mapValues(typeDef => {
    // exclude the primary-key attribute from the list of attributes. The data table reads
    // the primary-key attribute from the "idName" property.
    const attrs = _.filter(attr => attr.name !== typeDef.primaryKey, typeDef.attributes)
    return { count: typeDef.count, attributeNames: _.map(attr => attr.name, attrs), idName: typeDef.primaryKey }
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
  constructor(workspaceId: string, appName: string, proxyUrl: string) {
    this.workspaceId = workspaceId
    this.appName = appName
    this.proxyUrl = proxyUrl
  }

  appName: string

  providerName: string = 'WDS'

  proxyUrl: string

  workspaceId: string


  features: DataTableFeatures = {
    supportsTsvDownload: false,
    supportsTsvAjaxDownload: true,
    supportsTypeDeletion: true,
    supportsTypeRenaming: false,
    supportsExport: false,
    supportsPointCorrection: false,
    supportsFiltering: false,
    supportsRowSelection: false
  }

  tsvFeatures: TSVFeatures = {
    needsTypeInput: true,
    sampleTSVLink: 'https://storage.googleapis.com/terra-featured-workspaces/Table_templates/template_sample-wds-table.tsv', //TODO: This location may need to change
    invalidFormatWarning: 'Invalid format: Data does not include sys_name column.',
    isInvalid: (options: InvalidTsvOptions): boolean => {
      return options.fileImportModeMatches && !options.sysNamePresent && options.filePresent
    },
    disabled: (options: TsvUploadButtonDisabledOptions): boolean => {
      return !options.filePresent || options.isInvalid || options.uploading || !options.recordTypePresent
    },
    tooltip: (options: TsvUploadButtonTooltipOptions): string => {
      return Utils.cond(
        [!options.recordTypePresent, () => 'Please enter record type'],
        [!options.filePresent || options.isInvalid, () => 'Please select valid data to upload'],
        () => 'Upload selected data'
      )
    }
  }

  //TODO: define a type, fix date type and comparison
  // TODO: Do we have the appName here yet? If so, we could just call /api/apps/v2/{workspaceId}/{appName}? -- see similar comment in constructor
  // private getWdsUrl = (apps: { cloudProvider: string; status: string; proxyUrls: { wds: string}; appName: string; appType: string; auditInfo: {createdDate: number} }[]): string => {
  //   //TODO better logic
  //   let candidates = apps.filter(app => app.appType === 'CROMWELL' && app.status === 'RUNNING')
  //   if (candidates.length === 0) {
  //     //panic
  //   }
  //   if (candidates.length > 1) {
  //     candidates = candidates.filter(app => app.appName === 'wdsApp')
  //   }
  //   if (candidates.length > 1) {
  //     candidates.sort((a, b) => a.auditInfo.createdDate - b.auditInfo.createdDate)
  //   }
  //   return candidates[0].proxyUrls.wds
  // }

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
  protected transformAttributes = (attributes: RecordAttributes, primaryKey: string): RecordAttributes => {
    // the pickBy here excludes the primary-key attribute from the attribute map. The data table reads
    // the primary-key attribute name from the idName of entity metadata, and its value from the entity name.
    // if we included the primary-key attribute in the attribute map, the data table would show a duplicate column.
    return _.pickBy((_v, k) => k !== primaryKey, _.mapValues(val => {
      return _.isArray(val) ? this.toEntityServiceArray(val) : this.maybeTransformRelation(val)
    }, attributes))
  }

  protected transformPage = (wdsPage: RecordQueryResponse, recordType: string, queryOptions: EntityQueryOptions, metadata: EntityMetadata): EntityQueryResponse => {
    // translate WDS to Entity Service
    const filteredCount = wdsPage.totalRecords
    const unfilteredCount = wdsPage.totalRecords
    const primaryKey = !!metadata[recordType] ? metadata[recordType].idName : '(unknown column)' // for safety; recordType should always be present
    const results = _.map(rec => {
      return {
        entityType: recordType,
        attributes: this.transformAttributes(rec.attributes, primaryKey),
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

  getPage = async (signal: AbortSignal, entityType: string, queryOptions: EntityQueryOptions, metadata: EntityMetadata): Promise<EntityQueryResponse> => {
    const wdsPage: RecordQueryResponse = await Ajax(signal).WorkspaceData
      .getRecords(this.proxyUrl, this.workspaceId, entityType,
        _.merge({
          offset: (queryOptions.pageNumber - 1) * queryOptions.itemsPerPage,
          limit: queryOptions.itemsPerPage,
          sort: queryOptions.sortDirection
        },
        queryOptions.sortField === 'name' ? {} : { sortAttribute: queryOptions.sortField }
        ))
    return this.transformPage(wdsPage, entityType, queryOptions, metadata)
  }

  deleteTable = (entityType: string): Promise<Response> => {
    return Ajax().WorkspaceData.deleteTable(this.proxyUrl, this.workspaceId, entityType)
  }

  downloadTsv = (signal: AbortSignal, entityType: string): Promise<Blob> => {
    return Ajax(signal).WorkspaceData.downloadTsv(this.proxyUrl, this.workspaceId, entityType)
  }

  uploadTsv = (uploadParams: UploadParameters): Promise<TsvUploadResponse> => {
    return Ajax().WorkspaceData.uploadTsv(this.proxyUrl, uploadParams.workspaceId, uploadParams.recordType, uploadParams.file)
  }
}
