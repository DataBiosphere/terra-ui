import _ from 'lodash/fp';
import { authOpts, fetchWDS, jsonBody } from 'src/libs/ajax/ajax-common';
import {
  RecordQueryResponse,
  RecordTypeSchema,
  SearchRequest,
  TsvUploadResponse,
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';

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
  getVersion: async (root: string): Promise<any> => {
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
  importTdr: async (root: string, instanceId: string, snapshotId: string): Promise<Response> => {
    const res = await fetchWDS(root)(
      `${instanceId}/snapshots/v0.2/${snapshotId}`,
      _.mergeAll([authOpts(), { method: 'POST' }])
    );
    return res;
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
});
