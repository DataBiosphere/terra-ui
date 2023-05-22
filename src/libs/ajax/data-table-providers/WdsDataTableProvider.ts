import _ from 'lodash/fp';
import { notifyDataImportProgress } from 'src/components/data/data-utils';
import { Ajax } from 'src/libs/ajax';
import {
  AttributeArray,
  DataTableFeatures,
  DataTableProvider,
  EntityMetadata,
  EntityQueryOptions,
  EntityQueryResponse,
  TSVFeatures,
  TsvUploadButtonDisabledOptions,
  TsvUploadButtonTooltipOptions,
  UploadParameters,
} from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { notificationStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

// interface definitions for WDS payload responses
interface AttributeSchema {
  name: string;
  datatype: string;
  relatesTo?: string;
}

export interface RecordTypeSchema {
  name: string;
  count: number;
  attributes: AttributeSchema[];
  primaryKey: string;
}

export interface SearchRequest {
  offset: number;
  limit: number;
  sort: 'asc' | 'desc';
  sortAttribute?: string;
}

export type RecordAttributes = Record<string, unknown>; // truly "unknown" here; the backend Java representation is Map<String, Object>

interface RecordResponse {
  id: string;
  type: string;
  attributes: RecordAttributes;
}

export interface RecordQueryResponse {
  searchRequest: SearchRequest;
  totalRecords: number;
  records: RecordResponse[];
}

export interface TsvUploadResponse {
  message: string;
  recordsModified: number;
}

export const wdsToEntityServiceMetadata = (wdsSchema: RecordTypeSchema[]): EntityMetadata => {
  const keyedSchema: Record<string, RecordTypeSchema> = _.keyBy((x) => x.name, wdsSchema);
  return _.mapValues((typeDef) => {
    // exclude the primary-key attribute from the list of attributes. The data table reads
    // the primary-key attribute from the "idName" property.
    const attrs = _.filter((attr) => attr.name !== typeDef.primaryKey, typeDef.attributes);
    return { count: typeDef.count, attributeNames: _.map((attr) => attr.name, attrs), idName: typeDef.primaryKey };
  }, keyedSchema);
};

export const relationUriScheme = 'terra-wds';

// Callers outside this module should not call this function. It returns a string array of size 2
// iff it looks like a valid relation URI; else it returns an empty array.
// Returning the array prevents callers from string-parsing the URI multiple times.
// This function does not verify that the record type and record id are syntactically
// valid according to WDS - for instance, do they contain special characters?
// WDS should own that logic. Here, we only check if the type and id are nonempty.
const getRelationParts = (val: unknown): string[] => {
  if (_.isString(val) && val.startsWith(`${relationUriScheme}:/`)) {
    const parts: string[] = val.substring(relationUriScheme.length + 2).split('/');
    if (parts.length === 2 && _.every((part) => !!part, parts)) {
      return parts;
    }
    return [];
  }
  return [];
};

// Invokes logic to determine the appropriate app for WDS
// If WDS is not running, a URL will not be present -- in some cases, this function may invoke
// a new call to Leo to instantiate a WDS being available, thus having a valid URL
export const resolveWdsApp = (apps) => {
  // WDS looks for Kubernetes deployment statuses (such as RUNNING or PROVISIONING), expressed by Leo
  // See here for specific enumerations -- https://github.com/DataBiosphere/leonardo/blob/develop/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
  // look explicitly for a RUNNING app named 'wds-${app.workspaceId}' -- if WDS is healthy and running, there should only be one app RUNNING
  // an app may be in the 'PROVISIONING', 'STOPPED', 'STOPPING', which can still be deemed as an OK state for WDS
  const healthyStates = ['RUNNING', 'PROVISIONING', 'STOPPED', 'STOPPING'];

  // WDS appType is checked first and takes precedence over CROMWELL apps in the workspace
  const wdsAppTypes = ['WDS', 'CROMWELL'];
  for (const wdsAppType of wdsAppTypes) {
    const namedApp = apps.filter(
      (app) =>
        app.appType === wdsAppType && app.appName === `wds-${app.workspaceId}` && healthyStates.includes(app.status)
    );
    if (namedApp.length === 1) {
      return namedApp[0];
    }

    // Failed to find an app with the proper name, look for a RUNNING WDS or CROMWELL app
    const runningWdsApps = apps.filter((app) => app.appType === wdsAppType && app.status === 'RUNNING');
    if (runningWdsApps.length > 0) {
      // Evaluate the earliest-created WDS app
      runningWdsApps.sort(
        (a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf()
      );
      return runningWdsApps[0];
    }

    // If we reach this logic, we have more than one Leo app with the associated workspace Id...
    const allWdsApps = apps.filter(
      (app) => app.appType === wdsAppType && ['PROVISIONING', 'STOPPED', 'STOPPING'].includes(app.status)
    );
    if (allWdsApps.length > 0) {
      // Evaluate the earliest-created WDS app
      allWdsApps.sort(
        (a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf()
      );
      return allWdsApps[0];
    }
  }

  return '';
};

// Extract wds URL from Leo response. exported for testing
export const resolveWdsUrl = (apps) => {
  const foundApp = resolveWdsApp(apps);
  if (foundApp?.status === 'RUNNING') {
    return foundApp.proxyUrls.wds;
  }
  return '';
};

export const wdsProviderName = 'WDS';

export class WdsDataTableProvider implements DataTableProvider {
  constructor(workspaceId: string, proxyUrl: string) {
    this.workspaceId = workspaceId;
    this.proxyUrl = proxyUrl;
  }

  providerName: string = wdsProviderName;

  proxyUrl: string;

  workspaceId: string;

  features: DataTableFeatures = {
    supportsTsvDownload: false,
    supportsTsvAjaxDownload: true,
    supportsTypeDeletion: true,
    supportsTypeRenaming: false,
    supportsExport: false,
    supportsPointCorrection: false,
    supportsFiltering: false,
    supportsRowSelection: false,
  };

  tsvFeatures: TSVFeatures = {
    needsTypeInput: true,
    sampleTSVLink:
      'https://azurefeaturedworkspace.blob.core.windows.net/featuredworkspacedata/template_data_table_Azure.txt',
    dataImportSupportLink: '',
    dataTableSupportLink: '',
    textImportPlaceholder: 'idcolumn(tab)column1(tab)column2...',
    invalidFormatWarning: 'Invalid format: Data does not include sys_name column.',
    isInvalid: (): boolean => {
      // WDS does not have any restrictions on what can be uploaded, as entity_id
      // is not required like in Entity Service for GCP.
      return false;
    },
    disabled: (options: TsvUploadButtonDisabledOptions): boolean => {
      return !options.filePresent || options.uploading || !options.recordTypePresent;
    },
    tooltip: (options: TsvUploadButtonTooltipOptions): string => {
      return Utils.cond(
        [!options.recordTypePresent, () => 'Please enter table name'],
        [!options.filePresent, () => 'Please select valid data to upload'],
        () => 'Upload selected data'
      );
    },
  };

  private maybeTransformRelation = (val: unknown): unknown => {
    const relationParts = getRelationParts(val);
    return relationParts.length ? { entityType: relationParts[0], entityName: relationParts[1] } : val;
  };

  private toEntityServiceArray = (val: unknown[]): AttributeArray => {
    if (val.length && getRelationParts(val[0]).length) {
      // first element of the array looks like a relation. Now, check all elements.
      const translated: string[][] = val.map(getRelationParts);
      if (_.every((parts) => parts.length, translated)) {
        const references = translated.map((parts) => {
          return { entityType: parts[0], entityName: parts[1] };
        });
        return { itemsType: 'EntityReference', items: references };
      }
    }
    // empty array, or the first element isn't a relation; return as attribute values.
    return { itemsType: 'AttributeValue', items: val };
  };

  // transforms a WDS array to Entity Service array format
  protected transformAttributes = (attributes: RecordAttributes, primaryKey: string): RecordAttributes => {
    // the pickBy here excludes the primary-key attribute from the attribute map. The data table reads
    // the primary-key attribute name from the idName of entity metadata, and its value from the entity name.
    // if we included the primary-key attribute in the attribute map, the data table would show a duplicate column.
    return _.pickBy(
      (_v, k) => k !== primaryKey,
      _.mapValues((val) => {
        return _.isArray(val) ? this.toEntityServiceArray(val) : this.maybeTransformRelation(val);
      }, attributes)
    );
  };

  protected transformPage = (
    wdsPage: RecordQueryResponse,
    recordType: string,
    queryOptions: EntityQueryOptions,
    metadata: EntityMetadata
  ): EntityQueryResponse => {
    // translate WDS to Entity Service
    const filteredCount = wdsPage.totalRecords;
    const unfilteredCount = wdsPage.totalRecords;
    const primaryKey = metadata[recordType] ? metadata[recordType].idName : '(unknown column)'; // for safety; recordType should always be present
    const results = _.map((rec) => {
      return {
        entityType: recordType,
        attributes: this.transformAttributes(rec.attributes, primaryKey),
        name: rec.id,
      };
    }, wdsPage.records);

    return {
      results,
      parameters: {
        page: queryOptions.pageNumber,
        pageSize: queryOptions.itemsPerPage,
        sortField: queryOptions.sortField,
        sortDirection: queryOptions.sortDirection,
        filterTerms: '', // unused so it doesn't matter
        filterOperator: 'and', // unused so it doesn't matter
      },
      resultMetadata: {
        filteredCount,
        unfilteredCount,
        filteredPageCount: -1, // unused so it doesn't matter
      },
    };
  };

  getPage = async (
    signal: AbortSignal,
    entityType: string,
    queryOptions: EntityQueryOptions,
    metadata: EntityMetadata
  ): Promise<EntityQueryResponse> => {
    if (!this.proxyUrl) return Promise.reject('Proxy Url not loaded');
    const wdsPage: RecordQueryResponse = await Ajax(signal).WorkspaceData.getRecords(
      this.proxyUrl,
      this.workspaceId,
      entityType,
      _.merge(
        {
          offset: (queryOptions.pageNumber - 1) * queryOptions.itemsPerPage,
          limit: queryOptions.itemsPerPage,
          sort: queryOptions.sortDirection,
        },
        queryOptions.sortField === 'name' ? {} : { sortAttribute: queryOptions.sortField }
      )
    );
    return this.transformPage(wdsPage, entityType, queryOptions, metadata);
  };

  deleteTable = (entityType: string): Promise<Response> => {
    if (!this.proxyUrl) return Promise.reject('Proxy Url not loaded');
    return Ajax().WorkspaceData.deleteTable(this.proxyUrl, this.workspaceId, entityType);
  };

  downloadTsv = (signal: AbortSignal, entityType: string): Promise<Blob> => {
    if (!this.proxyUrl) return Promise.reject('Proxy Url not loaded');
    return Ajax(signal).WorkspaceData.downloadTsv(this.proxyUrl, this.workspaceId, entityType);
  };

  uploadTsv = (uploadParams: UploadParameters): Promise<TsvUploadResponse> => {
    if (!this.proxyUrl) return Promise.reject('Proxy Url not loaded');
    setTimeout(() => {
      if (
        notificationStore.get().length === 0 ||
        !notificationStore
          .get()
          .some((notif: { id: string }) =>
            [uploadParams.recordType, `${uploadParams.recordType}_success`].includes(notif.id)
          )
      ) {
        notifyDataImportProgress(
          uploadParams.recordType,
          'Your data will show up under Tables once import is complete.'
        );
      }
    }, 1000);
    return Ajax().WorkspaceData.uploadTsv(
      this.proxyUrl,
      uploadParams.workspaceId,
      uploadParams.recordType,
      uploadParams.file
    );
  };
}
