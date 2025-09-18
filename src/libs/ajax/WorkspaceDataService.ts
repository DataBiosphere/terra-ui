import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchWDS } from 'src/libs/ajax/ajax-common';

export const WorkspaceData = (signal?: AbortSignal) => ({
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
});

export type WorkspaceDataAjaxContract = ReturnType<typeof WorkspaceData>;
