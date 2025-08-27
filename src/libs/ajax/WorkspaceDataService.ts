import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchWDS } from 'src/libs/ajax/ajax-common';

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

export const WorkspaceData = (signal?: AbortSignal) => ({
  listCollections: async (root: string, workspaceId: string): Promise<any> => {
    try {
      const response = await fetchWDS(root)(`collections/v1/${workspaceId}`, _.merge(authOpts(), { signal }));
      const data = await response.json();
      return data.map((collection) => collection.id);
    } catch (error) {
      if (error instanceof Response && error.status === 404) {
        return await fetchWDS(root)('instances/v0.2', _.merge(authOpts(), { signal })).then((response) =>
          response.json()
        );
      }
      throw error;
    }
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
  // used by workflows-app
  queryRecords: async (root: string, instanceId: string, wdsType: string, searchLimit: number): Promise<any> => {
    const searchPayload = { limit: searchLimit };
    const res = await fetchWDS(root)(
      `${instanceId}/search/v0.2/${wdsType}`,
      _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody(searchPayload)])
    );
    const resultJson = await res.json();
    resultJson.records = _.map(_.unset('attributes.sys_name'), resultJson.records);
    return resultJson;
  },
  // used by workflows-app
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
  // used by ImportStatus
  getJobStatus: async (root: string, jobId: string): Promise<WDSJob> => {
    const res = await fetchWDS(root)(`job/v1/${jobId}`, _.merge(authOpts(), { signal }));
    return res.json();
  },
});

export type WorkspaceDataAjaxContract = ReturnType<typeof WorkspaceData>;
