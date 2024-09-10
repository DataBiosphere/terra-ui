import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-session';
import { fetchAgora, fetchRawls } from 'src/libs/ajax/ajax-common';

export const Methods = (signal?: AbortSignal) => ({
  list: async (params) => {
    const res = await fetchAgora(`methods?${qs.stringify(params)}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  definitions: async () => {
    const res = await fetchAgora('methods/definitions', _.merge(authOpts(), { signal }));
    return res.json();
  },

  configInputsOutputs: async (loadedConfig) => {
    const res = await fetchRawls(
      'methodconfigs/inputsOutputs',
      _.mergeAll([authOpts(), jsonBody(loadedConfig.methodRepoMethod), { signal, method: 'POST' }])
    );
    return res.json();
  },

  template: async (modifiedConfigMethod) => {
    const res = await fetchRawls(
      'methodconfigs/template',
      _.mergeAll([authOpts(), jsonBody(modifiedConfigMethod), { signal, method: 'POST' }])
    );
    return res.json();
  },

  method: (namespace, name, snapshotId) => {
    const root = `methods/${namespace}/${name}/${snapshotId}`;

    return {
      get: async () => {
        const res = await fetchAgora(root, _.merge(authOpts(), { signal }));
        return res.json();
      },

      configs: async () => {
        const res = await fetchAgora(`${root}/configurations`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      allConfigs: async () => {
        const res = await fetchAgora(`methods/${namespace}/${name}/configurations`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      toWorkspace: async (workspace, config: any = {}) => {
        const res = await fetchRawls(
          `workspaces/${workspace.namespace}/${workspace.name}/methodconfigs`,
          _.mergeAll([
            authOpts(),
            jsonBody(
              _.merge(
                {
                  methodRepoMethod: {
                    methodUri: `agora://${namespace}/${name}/${snapshotId}`,
                  },
                  name,
                  namespace,
                  rootEntityType: '',
                  prerequisites: {},
                  inputs: {},
                  outputs: {},
                  methodConfigVersion: 1,
                  deleted: false,
                },
                config.payloadObject
              )
            ),
            { signal, method: 'POST' },
          ])
        );
        return res.json();
      },
    };
  },
});

export type MethodsAjaxContract = ReturnType<typeof Methods>;