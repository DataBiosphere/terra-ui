import _ from 'lodash/fp';
import * as qs from 'qs';
import { version } from 'src/analysis/utils/gce-machines';
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
import { RawRuntimeConfig } from 'src/libs/ajax/leonardo/models/api-runtime-config';
import {
  getRegionFromZone,
  isAzureConfig,
  isDataprocConfig,
  isGceConfig,
  isGceWithPdConfig,
  NormalizedComputeRegion,
  RuntimeConfig,
} from 'src/libs/ajax/leonardo/models/runtime-config-models';
import {
  GetRuntimeItem,
  ListRuntimeItem,
  RawGetRuntimeItem,
  RawListRuntimeItem,
} from 'src/libs/ajax/leonardo/models/runtime-models';
import { getConfig } from 'src/libs/config';
import { CloudProvider } from 'src/workspaces/utils';

export interface GoogleRuntimeWrapper {
  googleProject: string;
  runtimeName: string;
}
export interface AzureRuntimeWrapper {
  workspaceId: string;
  runtimeName: string;
}

export type RuntimeWrapper = GoogleRuntimeWrapper | AzureRuntimeWrapper;

const isAzureRuntimeWrapper = (obj: any): obj is AzureRuntimeWrapper => {
  const castObj = obj as AzureRuntimeWrapper;
  return castObj && !!castObj.workspaceId && !!castObj.runtimeName;
};

const getNormalizedComputeConfig = (config: RawRuntimeConfig): RuntimeConfig => ({
  ...config,
  normalizedRegion: getNormalizedComputeRegion(config),
});

const getNormalizedComputeRegion = (config: RawRuntimeConfig): NormalizedComputeRegion => {
  const regionNotFoundPlaceholder = 'Unknown';
  if (isGceConfig(config) || isGceWithPdConfig(config)) {
    return getRegionFromZone(config.zone).toUpperCase() as NormalizedComputeRegion;
  }
  if (isDataprocConfig(config)) {
    return config.region.toUpperCase() as NormalizedComputeRegion;
  }
  if (isAzureConfig(config)) {
    return (config.region || regionNotFoundPlaceholder).toUpperCase() as NormalizedComputeRegion;
  }
  return regionNotFoundPlaceholder as NormalizedComputeRegion;
};

export const Runtimes = (signal: AbortSignal) => {
  const v1Func = (project: string, name: string) => {
    const root = `api/google/v1/runtimes/${project}/${name}`;

    return {
      details: async (): Promise<GetRuntimeItem> => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]));
        const getItem: RawGetRuntimeItem = await res.json();
        return { ...getItem, runtimeConfig: getNormalizedComputeConfig(getItem.runtimeConfig) };
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

  const v2Func = (workspaceId: string, name: string, cloudPlatform: CloudProvider = 'AZURE') => {
    const root = `api/v2/runtimes/${workspaceId}/${_.toLower(cloudPlatform)}/${name}`;
    const noCloudProviderRoot = `api/v2/runtimes/${workspaceId}/${name}`;

    return {
      details: async (): Promise<GetRuntimeItem> => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]));
        const getItem: RawGetRuntimeItem = await res.json();
        return { ...getItem, runtimeConfig: getNormalizedComputeConfig(getItem.runtimeConfig) };
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
    list: async (labels: Record<string, string> = {}): Promise<ListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/google/v1/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const runtimes: RawListRuntimeItem[] = await res.json();
      const normalizedRuntimes: ListRuntimeItem[] = _.map(getNormalizedListRuntime, runtimes);
      return normalizedRuntimes;
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

    listV2: async (labels: Record<string, string> = {}): Promise<ListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/v2/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );

      // [IA-3710] In order to keep the front-end backwards compatible, any Azure tool labels
      // will be changed to JupyterLab.
      const runtimeList = await res.json();
      const runtimesWithToolLabelDecorated: RawListRuntimeItem[] = _.map((runtime) => {
        if (runtime.labels.tool === 'Azure') {
          runtime.labels.tool = 'JupyterLab';
        }
        return runtime;
      }, runtimeList);
      const normalizedRuntimes = _.map(getNormalizedListRuntime, runtimesWithToolLabelDecorated);
      return normalizedRuntimes;
    },

    listV2WithWorkspace: async (
      workspaceId: string,
      labels: Record<string, string> = {}
    ): Promise<ListRuntimeItem[]> => {
      const res = await fetchLeo(
        `api/v2/runtimes/${workspaceId}?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const runtimes = await res.json();
      const normalizedRuntimes = _.map(getNormalizedListRuntime, runtimes);
      return normalizedRuntimes;
    },

    runtimeV2: v2Func,

    // TODO: Consider refactoring to not use this wrapper
    runtimeWrapper: (props: RuntimeWrapper) => {
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

const getNormalizedListRuntime = (runtime: RawListRuntimeItem): ListRuntimeItem => ({
  ...runtime,
  runtimeConfig: getNormalizedComputeConfig(runtime.runtimeConfig),
});

export type RuntimesAjaxContract = ReturnType<typeof Runtimes>;
export type RuntimeAjaxContractV1 = ReturnType<RuntimesAjaxContract['runtime']>;
export type RuntimeAjaxContractV2 = ReturnType<RuntimesAjaxContract['runtimeV2']>;
export type RuntimeWrapperAjaxContract = ReturnType<RuntimesAjaxContract['runtimeWrapper']>;
