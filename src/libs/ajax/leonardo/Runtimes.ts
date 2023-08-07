import _ from 'lodash/fp';
import * as qs from 'qs';
import { version } from 'src/data/gce-machines';
import {
  appIdentifier,
  authOpts,
  DEFAULT_RETRY_COUNT,
  DEFAULT_TIMEOUT_DURATION,
  fetchLeo,
  fetchOk,
  jsonBody,
  makeRequestRetry,
} from 'src/libs/ajax/ajax-common';
import {
  SanitizedGetRuntimeItem,
  SanitizedListRuntimeItem,
  sanitizeGetRuntime,
  sanitizeListRuntime,
} from 'src/libs/ajax/leonardo/models/runtime-models';
import { getConfig } from 'src/libs/config';
import { CloudPlatform } from 'src/pages/billing/models/BillingProject';

export interface GoogleRuntimeWrapper {
  googleProject: string;
  runtimeName: string;
}
export interface AzureRuntimeWrapper {
  workspaceId: string;
  runtimeName: string;
}

const isAzureRuntimeWrapper = (obj: any): obj is AzureRuntimeWrapper => {
  const castObj = obj as AzureRuntimeWrapper;
  return castObj && !!castObj.workspaceId && !!castObj.runtimeName;
};

export const Runtimes = (signal) => {
  const v1Func = (project: string, name: string) => {
    const root = `api/google/v1/runtimes/${project}/${name}`;

    return {
      details: async (): Promise<SanitizedGetRuntimeItem> => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]));
        return sanitizeGetRuntime(res.json());
      },

      create: (options): Promise<void> => {
        const body = _.merge(options, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version },
          defaultClientId: getConfig().googleClientId,
          userJupyterExtensionConfig: {
            nbExtensions: {
              'saturn-iframe-extension': `${
                window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin
              }/jupyter-iframe-extension.js`,
            },
            labExtensions: {},
            serverExtensions: {},
            combinedExtensions: {},
          },
          scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
          enableWelder: true,
        });
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }, appIdentifier]));
      },

      update: (options): Promise<void> => {
        const body = { ...options, allowStop: true };
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'PATCH' }, appIdentifier]));
      },

      start: (): Promise<void> => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]));
      },

      stop: (): Promise<void> => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]));
      },

      delete: (deleteDisk: boolean): Promise<void> => {
        return fetchLeo(
          `${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier])
        );
      },
    };
  };

  const v2Func = (workspaceId: string, name: string, cloudPlatform: CloudPlatform = 'AZURE') => {
    const root = `api/v2/runtimes/${workspaceId}/${_.toLower(cloudPlatform)}/${name}`;
    const noCloudProviderRoot = `api/v2/runtimes/${workspaceId}/${name}`;

    return {
      details: async (): Promise<SanitizedGetRuntimeItem> => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]));
        return sanitizeGetRuntime(res.json());
      },

      create: (options, useExistingDisk = false): Promise<void> => {
        const body = _.merge(options, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version },
        });
        return fetchLeo(
          `${root}${qs.stringify({ useExistingDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }, appIdentifier])
        );
      },

      delete: (deleteDisk = true): Promise<void> => {
        return fetchLeo(
          `${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier])
        );
      },

      start: (): Promise<void> => {
        return fetchLeo(
          `${noCloudProviderRoot}/start`,
          _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier])
        );
      },

      stop: (): Promise<void> => {
        return fetchLeo(
          `${noCloudProviderRoot}/stop`,
          _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier])
        );
      },
    };
  };

  return {
    list: async (labels: Record<string, string> = {}): Promise<SanitizedListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/google/v1/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const runtimeList = await res.json();
      const sanitizedRuntimeList = _.map((runtime) => {
        return sanitizeListRuntime(runtime);
      }, runtimeList);
      return sanitizedRuntimeList;
    },

    invalidateCookie: () => {
      return fetchLeo('proxy/invalidateToken', _.merge(authOpts(), { signal }));
    },

    setCookie: () => {
      return fetchLeo('proxy/setCookie', _.merge(authOpts(), { signal, credentials: 'include' }));
    },

    runtime: v1Func,

    azureProxy: (proxyUrl) => {
      return {
        setAzureCookie: () => {
          return fetchOk(`${proxyUrl}/setCookie`, _.merge(authOpts(), { signal, credentials: 'include' }));
        },

        setStorageLinks: (localBaseDirectory, cloudStorageDirectory, pattern) => {
          return makeRequestRetry(
            () =>
              fetchOk(
                `${proxyUrl}/welder/storageLinks`,
                _.mergeAll([
                  authOpts(),
                  jsonBody({
                    localBaseDirectory,
                    cloudStorageDirectory,
                    pattern,
                  }),
                  { signal, method: 'POST' },
                ])
              ),
            DEFAULT_RETRY_COUNT,
            DEFAULT_TIMEOUT_DURATION
          );
        },
      };
    },

    listV2: async (labels: Record<string, string> = {}): Promise<SanitizedListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/v2/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );

      // [IA-3710] In order to keep the front-end backwards compatible, any Azure tool labels
      // will be changed to JupyterLab.
      const runtimeList = await res.json();
      const runtimesWithToolLabelDecorated = _.map((runtime) => {
        if (runtime.labels.tool === 'Azure') {
          runtime.labels.tool = 'JupyterLab';
        }
        return sanitizeListRuntime(runtime);
      }, runtimeList);
      return runtimesWithToolLabelDecorated;
    },

    listV2WithWorkspace: async (
      workspaceId: string,
      labels: Record<string, string> = {}
    ): Promise<SanitizedListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/v2/runtimes/${workspaceId}?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const runtimeList = await res.json();
      const sanitizedRuntimeList = _.map((runtime) => {
        return sanitizeListRuntime(runtime);
      }, runtimeList);
      return sanitizedRuntimeList;
    },

    deleteAll: (workspaceId: string, deleteDisk = true): Promise<void> => {
      return fetchLeo(
        `api/v2/runtimes/${workspaceId}/deleteAll${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
        _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier])
      );
    },

    runtimeV2: v2Func,

    // TODO: Consider refactoring to not use this wrapper
    runtimeWrapper: (props: GoogleRuntimeWrapper | AzureRuntimeWrapper) => {
      return {
        stop: () => {
          const stopFunc = isAzureRuntimeWrapper(props)
            ? () => v2Func(props.workspaceId, props.runtimeName).stop()
            : () => v1Func(props.googleProject, props.runtimeName).stop();
          return stopFunc();
        },

        start: () => {
          const startFunc = isAzureRuntimeWrapper(props)
            ? () => v2Func(props.workspaceId, props.runtimeName).start()
            : () => v1Func(props.googleProject, props.runtimeName).start();
          return startFunc();
        },
      };
    },

    fileSyncing: (project, name) => {
      const root = `proxy/${project}/${name}`;

      return {
        oldLocalize: (files) => {
          return fetchLeo(
            `notebooks/${project}/${name}/api/localize`, // this is the old root url
            _.mergeAll([authOpts(), jsonBody(files), { signal, method: 'POST' }])
          );
        },

        localize: (entries) => {
          const body = { action: 'localize', entries };
          return fetchLeo(
            `${root}/welder/objects`,
            _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }])
          );
        },

        setStorageLinks: (localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, pattern) => {
          return fetchLeo(
            `${root}/welder/storageLinks`,
            _.mergeAll([
              authOpts(),
              jsonBody({
                localBaseDirectory,
                localSafeModeBaseDirectory,
                cloudStorageDirectory,
                pattern,
              }),
              { signal, method: 'POST' },
            ])
          );
        },

        lock: async (localPath) => {
          try {
            await fetchLeo(
              `${root}/welder/objects/lock`,
              _.mergeAll([authOpts(), jsonBody({ localPath }), { signal, method: 'POST' }])
            );
            return true;
          } catch (error: any) {
            if ('status' in error && error.status === 409) {
              return false;
            }
            throw error;
          }
        },
      };
    },
  };
};
