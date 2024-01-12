import _ from 'lodash/fp';
import { authOpts, fetchWDS, jsonBody } from 'src/libs/ajax/ajax-common';
import {
  RecordQueryResponse,
  RecordResponseBody,
  RecordTypeSchema,
  SearchRequest,
  TsvUploadResponse,
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';

export type WDSVersionResponse = {
  // Older versions of WDS may not have the "app" field.
  app?: {
    'chart-version': string;
    image: string;
  };
  build: {
    artifact: string;
    name: string;
    time: string;
    version: string;
    group: string;
  };
  git: {
    branch: string;
    commit: {
      id: string;
      time: string;
    };
  };
};

export type WDSCloneStatusResponse = {
  created: string;
  errorMessage?: string;
  exception?: string;
  jobId: string;
  result: {
    sourceWorkspaceId: string;
    status: string;
  };
  status: string;
  updated: string;
};

export interface WDSJob {
  created: string;
  errorMessage: string | null;
  input: null;
  jobId: string;
  jobType: 'DATA_IMPORT' | 'UNKNOWN';
  result: null;
  status: 'CREATED' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'ERROR' | 'CANCELLED' | 'UNKNOWN';
  updated: string;
}

export const WorkspaceData = (signal) => ({
  getSchema: async (root: string, instanceId: string): Promise<RecordTypeSchema[]> => {
    const res = await fetchWDS(root)(`${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }));
    return res.json();
  },
  getRecords: async (
    root: string,
    instanceId: string,
    recordType: string,
    parameters: SearchRequest
  ): Promise<RecordQueryResponse> => {
    const res = await fetchWDS(root)(
      `${instanceId}/search/v0.2/${recordType}`,
      _.mergeAll([authOpts(), jsonBody(parameters), { signal, method: 'POST' }])
    );
    return res.json();
  },
  deleteTable: async (root: string, instanceId: string, recordType: string): Promise<Response> => {
    const res = await fetchWDS(root)(
      `${instanceId}/types/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { signal, method: 'DELETE' }])
    );
    return res;
  },
  downloadTsv: async (root: string, instanceId: string, recordType: string): Promise<Blob> => {
    const res = await fetchWDS(root)(`${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }));
    const blob = await res.blob();
    return blob;
  },
  uploadTsv: async (root: string, instanceId: string, recordType: string, file: File): Promise<TsvUploadResponse> => {
    const formData = new FormData();
    formData.set('records', file);
    const res = await fetchWDS(root)(
      `${instanceId}/tsv/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }])
    );
    return res.json();
  },
  updateRecord: async (
    root: string,
    instanceId: string,
    recordType: string,
    recordId: string,
    attributes: object
  ): Promise<RecordResponseBody> => {
    const res = await fetchWDS(root)(
      `${instanceId}/records/v0.2/${recordType}/${recordId}`,
      _.mergeAll([authOpts(), jsonBody(attributes), { signal, method: 'PATCH' }])
    );
    return res.json();
  },
  getVersion: async (root: string): Promise<WDSVersionResponse> => {
    const res = await fetchWDS(root)('version', _.merge(authOpts(), { signal }));
    return res.json();
  },
  getStatus: async (root: string): Promise<any> => {
    const res = await fetchWDS(root)('status', _.merge(authOpts(), { signal }));
    return res.json();
  },
  listInstances: async (root: string): Promise<any> => {
    const res = await fetchWDS(root)('instances/v0.2', _.merge(authOpts(), { signal }));
    return res.json();
  },
  getCloneStatus: async (root: string): Promise<WDSCloneStatusResponse> => {
    const res = await fetchWDS(root)('clone/v0.2', _.merge(authOpts(), { signal }));
    return res.json();
  },
  startImportJob: async (
    root: string,
    instanceId: string,
    file: { url: string; type: 'PFB' | 'TDRMANIFEST' }
  ): Promise<WDSJob> => {
    const res = await fetchWDS(root)(
      `${instanceId}/import/v1`,
      _.mergeAll([authOpts(), { method: 'POST' }, jsonBody(file)])
    );
    return await res.json();
  },
  queryRecords: async (root: string, instanceId: string, wdsType: string): Promise<any> => {
    const searchPayload = { limit: 100 };
    const res = await fetchWDS(root)(
      `${instanceId}/search/v0.2/${wdsType}`,
      _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody(searchPayload)])
    );
    const resultJson = await res.json();
    resultJson.records = _.map(_.unset('attributes.sys_name'), resultJson.records);
    return resultJson;
  },
  describeAllRecordTypes: async (root: string, instanceId: string): Promise<any> => {
    const res = await fetchWDS(root)(`${instanceId}/types/v0.2`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
    return _.map(
      (type) =>
        _.set(
          'attributes',
          _.filter((attr) => attr.name !== 'sys_name', type.attributes),
          type
        ),
      await res.json()
    );
  },
  getJobStatus: async (root: string, jobId: string): Promise<WDSJob> => {
    const res = await fetchWDS(root)(`job/v1/${jobId}`, _.merge(authOpts(), { signal }));
    return res.json();
  },
});
