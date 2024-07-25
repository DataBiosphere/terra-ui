import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-fetch';
import { appIdentifier, fetchAgora, fetchDrsHub, fetchGoogleForms, fetchOrchestration, fetchRawls } from 'src/libs/ajax/ajax-common';
import { AzureStorage } from 'src/libs/ajax/AzureStorage';
import { Billing } from 'src/libs/ajax/Billing';
import { Catalog } from 'src/libs/ajax/Catalog';
import { DataRepo } from 'src/libs/ajax/DataRepo';
import { Dockstore } from 'src/libs/ajax/Dockstore';
import { ExternalCredentials } from 'src/libs/ajax/ExternalCredentials';
import { fetchOk } from 'src/libs/ajax/fetch/fetch-core';
import { GoogleStorage } from 'src/libs/ajax/GoogleStorage';
import { Groups } from 'src/libs/ajax/Groups';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { Disks } from 'src/libs/ajax/leonardo/Disks';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { Metrics } from 'src/libs/ajax/Metrics';
import { OAuth2 } from 'src/libs/ajax/OAuth2';
import { SamResources } from 'src/libs/ajax/SamResources';
import { Support } from 'src/libs/ajax/Support';
import { TermsOfService } from 'src/libs/ajax/TermsOfService';
import { User } from 'src/libs/ajax/User';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import { CromwellApp } from 'src/libs/ajax/workflows-app/CromwellApp';
import { WorkflowScript } from 'src/libs/ajax/workflows-app/WorkflowScript';
import { WorkspaceData } from 'src/libs/ajax/WorkspaceDataService';
import { WorkspaceManagerResources } from 'src/libs/ajax/WorkspaceManagerResources';
import { getConfig } from 'src/libs/config';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

const getSnapshotEntityMetadata = Utils.memoizeAsync(
  async (token, workspaceNamespace, workspaceName, googleProject, dataReference) => {
    const res = await fetchRawls(
      `workspaces/${workspaceNamespace}/${workspaceName}/entities?billingProject=${googleProject}&dataReference=${dataReference}`,
      authOpts(token)
    );
    return res.json();
  },
  { keyFn: (...args) => JSON.stringify(args) }
);

const attributesUpdateOps = _.flow(
  _.toPairs,
  _.flatMap(([k, v]) => {
    return _.isArray(v)
      ? [
          { op: 'RemoveAttribute', attributeName: k },
          ...(_.isObject(v[0])
            ? [{ op: 'CreateAttributeEntityReferenceList', attributeListName: k }]
            : [{ op: 'CreateAttributeValueList', attributeName: k }]),
          ..._.map((x) => ({ op: 'AddListMember', attributeListName: k, newMember: x }), v),
        ]
      : [{ op: 'AddUpdateAttribute', attributeName: k, addUpdateAttribute: v }];
  })
);

const CromIAM = (signal) => ({
  callCacheDiff: async (thisWorkflow, thatWorkflow) => {
    const { workflowId: thisWorkflowId, callFqn: thisCallFqn, index: thisIndex } = thisWorkflow;
    const { workflowId: thatWorkflowId, callFqn: thatCallFqn, index: thatIndex } = thatWorkflow;

    const params = {
      workflowA: thisWorkflowId,
      callA: thisCallFqn,
      indexA: thisIndex !== -1 ? thisIndex : undefined,
      workflowB: thatWorkflowId,
      callB: thatCallFqn,
      indexB: thatIndex !== -1 ? thatIndex : undefined,
    };
    const res = await fetchOrchestration(`api/workflows/v1/callcaching/diff?${qs.stringify(params)}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  workflowMetadata: async (workflowId, includeKey, excludeKey) => {
    const res = await fetchOrchestration(
      `api/workflows/v1/${workflowId}/metadata?${qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' })}`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },
});

const Workspaces = (signal) => ({
  list: async (fields, stringAttributeMaxLength) => {
    const lenParam = _.isNil(stringAttributeMaxLength) ? '' : `stringAttributeMaxLength=${stringAttributeMaxLength}&`;
    const res = await fetchRawls(`workspaces?${lenParam}${qs.stringify({ fields }, { arrayFormat: 'comma' })}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  create: async (body) => {
    const res = await fetchRawls('workspaces', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
    return res.json();
  },

  getShareLog: async () => {
    const res = await fetchOrchestration('api/sharelog/sharees?shareType=workspace', _.merge(authOpts(), { signal }));
    return res.json();
  },

  getTags: async (tag, limit) => {
    const params = { q: tag };
    if (limit) {
      params.limit = limit;
    }
    const res = await fetchRawls(`workspaces/tags?${qs.stringify(params)}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  /**
   * @param {string} workspaceId
   * @param {string[]} [fields]
   */
  getById: async (workspaceId, fields = undefined) => {
    let url = `workspaces/id/${workspaceId}`;
    if (fields) {
      url += `?${qs.stringify({ fields }, { arrayFormat: 'comma' })}`;
    }
    const response = await fetchRawls(url, _.mergeAll([authOpts(), { signal }]));
    return response.json();
  },

  workspaceV2: (namespace, name) => {
    const root = `workspaces/v2/${namespace}/${name}`;

    return {
      clone: async (body) => {
        const res = await fetchRawls(`${root}/clone`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
        return res.json();
      },

      delete: () => {
        return fetchRawls(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
      },

      migrateWorkspace: async () => {
        const response = await fetchRawls(`${root}/bucketMigration`, _.merge(authOpts(), { signal, method: 'POST' }));
        return response.json();
      },
    };
  },

  bucketMigrationInfo: async () => {
    const response = await fetchRawls('workspaces/v2/bucketMigration', _.merge(authOpts(), { signal }));
    return response.json();
  },

  bucketMigrationProgress: async (body) => {
    const response = await fetchRawls(
      'workspaces/v2/bucketMigration/getProgress',
      _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }])
    );
    return response.json();
  },

  startBatchBucketMigration: async (body) => {
    const response = await fetchRawls('workspaces/v2/bucketMigration', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
    return response.json();
  },

  workspace: (namespace, name) => {
    const root = `workspaces/${namespace}/${name}`;
    const mcPath = `${root}/methodconfigs`;

    return {
      checkBucketReadAccess: () => {
        return fetchRawls(`${root}/checkBucketReadAccess`, _.merge(authOpts(), { signal }));
      },

      checkBucketAccess: GoogleStorage(signal).checkBucketAccess,

      checkBucketLocation: GoogleStorage(signal).checkBucketLocation,

      details: async (fields) => {
        const res = await fetchRawls(`${root}?${qs.stringify({ fields }, { arrayFormat: 'comma' })}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      getAcl: async () => {
        const res = await fetchRawls(`${root}/acl`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      updateAcl: async (aclUpdates, inviteNew = true) => {
        const res = await fetchOrchestration(
          `api/${root}/acl?inviteUsersNotFound=${inviteNew}`,
          _.mergeAll([authOpts(), jsonBody(aclUpdates), { signal, method: 'PATCH' }])
        );
        return res.json();
      },

      lock: async () => {
        return await fetchRawls(`${root}/lock`, _.merge(authOpts(), { signal, method: 'PUT' }));
      },

      unlock: async () => {
        return await fetchRawls(`${root}/unlock`, _.merge(authOpts(), { signal, method: 'PUT' }));
      },

      listMethodConfigs: async (allRepos = true) => {
        const res = await fetchRawls(`${mcPath}?allRepos=${allRepos}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      importMethodConfigFromDocker: (payload) => {
        return fetchRawls(mcPath, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
      },

      methodConfig: (configNamespace, configName) => {
        const path = `${mcPath}/${configNamespace}/${configName}`;

        return {
          get: async () => {
            const res = await fetchRawls(path, _.merge(authOpts(), { signal }));
            return res.json();
          },

          save: async (payload) => {
            const res = await fetchRawls(path, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
            return res.json();
          },

          copyTo: async ({ destConfigNamespace, destConfigName, workspaceName }) => {
            const payload = {
              source: { namespace: configNamespace, name: configName, workspaceName: { namespace, name } },
              destination: { namespace: destConfigNamespace, name: destConfigName, workspaceName },
            };
            const res = await fetchRawls('methodconfigs/copy', _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
            return res.json();
          },

          validate: async () => {
            const res = await fetchRawls(`${path}/validate`, _.merge(authOpts(), { signal }));
            return res.json();
          },

          launch: async (payload) => {
            const res = await fetchRawls(
              `${root}/submissions`,
              _.mergeAll([
                authOpts(),
                jsonBody({
                  ...payload,
                  methodConfigurationNamespace: configNamespace,
                  methodConfigurationName: configName,
                }),
                { signal, method: 'POST' },
              ])
            );
            return res.json();
          },

          delete: () => {
            return fetchRawls(path, _.merge(authOpts(), { signal, method: 'DELETE' }));
          },
        };
      },

      listSubmissions: async () => {
        const res = await fetchRawls(`${root}/submissions`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      listSnapshots: async (limit, offset) => {
        const res = await fetchRawls(`${root}/snapshots/v2?offset=${offset}&limit=${limit}`, _.merge(authOpts(), { signal }));
        // The list snapshots endpoint returns a "snapshot" field that should really be named "snapshotId". Ideally, this should be fixed in the
        // backend, but we've sequestered it here for now.
        return _.update('gcpDataRepoSnapshots', _.map(_.update('attributes', (a) => ({ ...a, snapshotId: a.snapshot }))), await res.json());
      },

      snapshot: (snapshotId) => {
        const snapshotPath = `${root}/snapshots/v2/${snapshotId}`;

        return {
          details: async () => {
            const res = await fetchRawls(snapshotPath, _.merge(authOpts(), { signal }));
            return res.json();
          },

          update: (updateInfo) => {
            return fetchRawls(snapshotPath, _.mergeAll([authOpts(), jsonBody(updateInfo), { signal, method: 'PATCH' }]));
          },

          delete: () => {
            return fetchRawls(snapshotPath, _.merge(authOpts(), { signal, method: 'DELETE' }));
          },
        };
      },

      submission: (submissionId) => {
        const submissionPath = `${root}/submissions/${submissionId}`;

        return {
          get: async () => {
            const res = await fetchRawls(submissionPath, _.merge(authOpts(), { signal }));
            return res.json();
          },

          getConfiguration: async () => {
            const res = await fetchRawls(`${submissionPath}/configuration`, _.merge(authOpts(), { signal }));
            return res.json();
          },

          abort: () => {
            return fetchRawls(submissionPath, _.merge(authOpts(), { signal, method: 'DELETE' }));
          },

          updateUserComment: (userComment) => {
            const payload = { userComment };
            return fetchRawls(submissionPath, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]));
          },

          // NB: This could one day perhaps redirect to CromIAM's 'workflow' like:
          // workflow: workflowId => Ajax(signal).CromIAM.workflow(workflowId)
          // But: Because of the slowness of asking via CromIAM, that's probably a non-starter for right now.
          workflow: (workflowId) => {
            return {
              metadata: async ({ includeKey, excludeKey }) => {
                const res = await fetchRawls(
                  `${submissionPath}/workflows/${workflowId}?${qs.stringify(
                    {
                      includeKey,
                      excludeKey,
                    },
                    { arrayFormat: 'repeat' }
                  )}`,
                  _.merge(authOpts(), { signal })
                );
                return res.json();
              },

              outputs: () => fetchRawls(`${submissionPath}/workflows/${workflowId}/outputs`, _.merge(authOpts(), { signal })).then((r) => r.json()),
            };
          },
        };
      },

      delete: () => {
        return fetchRawls(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
      },

      shallowMergeNewAttributes: (attributesObject) => {
        const payload = attributesUpdateOps(attributesObject);
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]));
      },

      deleteAttributes: (attributeNames) => {
        const payload = _.map((attributeName) => ({ op: 'RemoveAttribute', attributeName }), attributeNames);
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]));
      },

      entityMetadata: async () => {
        const res = await fetchRawls(`${root}/entities`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      snapshotEntityMetadata: (googleProject, dataReference) => {
        return getSnapshotEntityMetadata(getTerraUser().token, namespace, name, googleProject, dataReference);
      },

      createEntity: async (payload) => {
        const res = await fetchRawls(`${root}/entities`, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
        return res.json();
      },

      renameEntity: (type, name, newName) => {
        return fetchRawls(
          `${root}/entities/${type}/${name}/rename`,
          _.mergeAll([authOpts(), jsonBody({ name: newName }), { signal, method: 'POST' }])
        );
      },

      renameEntityType: (oldName, newName) => {
        const payload = { newName };

        return fetchRawls(`${root}/entityTypes/${oldName}`, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]));
      },

      deleteEntitiesOfType: (entityType) => {
        return fetchRawls(`${root}/entityTypes/${entityType}`, _.merge(authOpts(), { signal, method: 'DELETE' }));
      },

      deleteEntityAttribute: (type, name, attributeName) => {
        return fetchRawls(
          `${root}/entities/${type}/${name}`,
          _.mergeAll([authOpts(), jsonBody([{ op: 'RemoveAttribute', attributeName }]), { signal, method: 'PATCH' }])
        );
      },

      deleteAttributeFromEntities: (entityType, attributeName, entityNames) => {
        const body = _.map(
          (name) => ({
            entityType,
            name,
            operations: [{ op: 'RemoveAttribute', attributeName }],
          }),
          entityNames
        );

        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
      },

      deleteEntityColumn: (type, attributeName) => {
        return fetchRawls(`${root}/entities/${type}?attributeNames=${attributeName}`, _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
      },

      renameEntityColumn: (type, attributeName, newAttributeName) => {
        const payload = { newAttributeName };
        return fetchRawls(
          `${root}/entityTypes/${type}/attributes/${attributeName}`,
          _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }])
        );
      },

      upsertEntities: (entityUpdates) => {
        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(entityUpdates), { signal, method: 'POST' }]));
      },

      paginatedEntitiesOfType: async (type, parameters) => {
        const res = await fetchRawls(`${root}/entityQuery/${type}?${qs.stringify(parameters)}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      deleteEntities: (entities) => {
        return fetchRawls(`${root}/entities/delete`, _.mergeAll([authOpts(), jsonBody(entities), { signal, method: 'POST' }]));
      },

      getEntities: (entityType) => fetchRawls(`${root}/entities/${entityType}`, _.merge(authOpts(), { signal })).then((r) => r.json()),

      getEntitiesTsv: (entityType) =>
        fetchOrchestration(
          `api/workspaces/${namespace}/${name}/entities/${entityType}/tsv?model=flexible`,
          _.mergeAll([authOpts(), { signal }])
        ).then((r) => r.blob()),

      copyEntities: async (destNamespace, destName, entityType, entities, link) => {
        const payload = {
          sourceWorkspace: { namespace, name },
          destinationWorkspace: { namespace: destNamespace, name: destName },
          entityType,
          entityNames: entities,
        };
        const res = await fetchRawls(
          `workspaces/entities/copy?linkExistingEntities=${link}`,
          _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }])
        );
        return res.json();
      },

      importBagit: (bagitURL) => {
        return fetchOrchestration(
          `api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { signal, method: 'POST' }])
        );
      },

      importJSON: async (url) => {
        const res = await fetchOk(url);
        const payload = await res.json();

        const body = _.map(({ name, entityType, attributes }) => {
          return { name, entityType, operations: attributesUpdateOps(attributes) };
        }, payload);

        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
      },

      importEntitiesFile: (file, { deleteEmptyValues = false } = {}) => {
        const formData = new FormData();
        formData.set('entities', file);
        return fetchOrchestration(
          `api/${root}/importEntities?${qs.stringify({ deleteEmptyValues })}`,
          _.merge(authOpts(), { body: formData, signal, method: 'POST' })
        );
      },

      importFlexibleEntitiesFileSynchronous: async (file, { deleteEmptyValues = false } = {}) => {
        const formData = new FormData();
        formData.set('entities', file);
        const res = await fetchOrchestration(
          `api/${root}/flexibleImportEntities?${qs.stringify({ deleteEmptyValues, async: false })}`,
          _.merge(authOpts(), { body: formData, signal, method: 'POST' })
        );
        return res;
      },

      importFlexibleEntitiesFileAsync: async (file, { deleteEmptyValues = false } = {}) => {
        const formData = new FormData();
        formData.set('entities', file);
        const res = await fetchOrchestration(
          `api/${root}/flexibleImportEntities?${qs.stringify({ deleteEmptyValues, async: true })}`,
          _.merge(authOpts(), { body: formData, signal, method: 'POST' })
        );
        return res.json();
      },

      importJob: async (url, filetype, options) => {
        const res = await fetchOrchestration(
          `api/${root}/importJob`,
          _.mergeAll([authOpts(), jsonBody({ url, filetype, options }), { signal, method: 'POST' }])
        );
        return res.json();
      },

      getImportJobStatus: async (jobId) => {
        const res = await fetchOrchestration(`api/${root}/importJob/${jobId}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      listImportJobs: async (isRunning) => {
        const res = await fetchOrchestration(`api/${root}/importJob?running_only=${isRunning}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      importSnapshot: async (snapshotId, name, description) => {
        const res = await fetchRawls(
          `${root}/snapshots/v2`,
          _.mergeAll([authOpts(), jsonBody({ snapshotId, name, description }), { signal, method: 'POST' }])
        );
        return res.json();
      },

      importAttributes: (file) => {
        const formData = new FormData();
        formData.set('attributes', file);
        return fetchOrchestration(`api/${root}/importAttributesTSV`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }));
      },

      exportAttributes: async () => {
        const res = await fetchOrchestration(`api/${root}/exportAttributesTSV`, _.merge(authOpts(), { signal }));
        return res.blob();
      },

      storageCostEstimate: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/storageCostEstimate`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      getTags: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/tags`, _.merge(authOpts(), { signal, method: 'GET' }));
        return res.json();
      },

      addTag: async (tag) => {
        const res = await fetchOrchestration(
          `api/workspaces/${namespace}/${name}/tags`,
          _.mergeAll([authOpts(), jsonBody([tag]), { signal, method: 'PATCH' }])
        );
        return res.json();
      },

      deleteTag: async (tag) => {
        const res = await fetchOrchestration(
          `api/workspaces/${namespace}/${name}/tags`,
          _.mergeAll([authOpts(), jsonBody([tag]), { signal, method: 'DELETE' }])
        );
        return res.json();
      },

      bucketUsage: async () => {
        const res = await fetchRawls(`${root}/bucketUsage`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      listActiveFileTransfers: async () => {
        const res = await fetchRawls(`${root}/fileTransfers`, _.merge(authOpts(), { signal }));
        return res.json();
      },
    };
  },
});

const FirecloudBucket = (signal) => ({
  getServiceAlerts: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/alerts.json`, { signal });
    return res.json();
  },

  getFeaturedWorkspaces: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/featured-workspaces.json`, { signal });
    return res.json();
  },

  getShowcaseWorkspaces: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/showcase.json`, { signal });
    return res.json();
  },

  getFeaturedMethods: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/featured-methods.json`, { signal });
    return res.json();
  },

  getTemplateWorkspaces: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/template-workspaces.json`, { signal });
    return res.json();
  },

  getBadVersions: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/bad-versions.txt`, { signal });
    return res.text();
  },
});

const Methods = (signal) => ({
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
    const res = await fetchRawls('methodconfigs/template', _.mergeAll([authOpts(), jsonBody(modifiedConfigMethod), { signal, method: 'POST' }]));
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

      toWorkspace: async (workspace, config = {}) => {
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

const Submissions = (signal) => ({
  queueStatus: async () => {
    const res = await fetchRawls('submissions/queueStatus', _.merge(authOpts(), { signal }));
    return res.json();
  },
});

const DrsUriResolver = (signal) => ({
  // DRSHub now gets a signed URL instead of Martha
  getSignedUrl: async ({ bucket, object, dataObjectUri, googleProject }) => {
    const res = await fetchDrsHub(
      '/api/v4/gcs/getSignedUrl',
      _.mergeAll([jsonBody({ bucket, object, dataObjectUri, googleProject }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },

  getDataObjectMetadata: async (url, fields) => {
    const res = await fetchDrsHub(
      '/api/v4/drs/resolve',
      _.mergeAll([jsonBody({ url, fields }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },
});

const Surveys = (signal) => ({
  submitForm: (formId, data) => fetchGoogleForms(`${formId}/formResponse?${qs.stringify(data)}`, { signal }),
});

export const Ajax = (signal) => {
  return {
    Apps: Apps(signal),
    AzureStorage: AzureStorage(signal),
    Billing: Billing(signal),
    Buckets: GoogleStorage(signal),
    Catalog: Catalog(signal),
    Cbas: Cbas(signal),
    CromIAM: CromIAM(signal),
    CromwellApp: CromwellApp(signal),
    DataRepo: DataRepo(signal),
    Disks: Disks(signal),
    Dockstore: Dockstore(signal),
    DrsUriResolver: DrsUriResolver(signal),
    ExternalCredentials: ExternalCredentials(signal),
    FirecloudBucket: FirecloudBucket(signal),
    Groups: Groups(signal),
    Methods: Methods(signal),
    Metrics: Metrics(signal),
    OAuth2: OAuth2(signal),
    Runtimes: Runtimes(signal),
    SamResources: SamResources(signal),
    Submissions: Submissions(signal),
    Support: Support(signal),
    Surveys: Surveys(signal),
    TermsOfService: TermsOfService(signal),
    User: User(signal),
    WorkflowScript: WorkflowScript(signal),
    WorkspaceData: WorkspaceData(signal),
    WorkspaceManagerResources: WorkspaceManagerResources(signal),
    Workspaces: Workspaces(signal),
  };
};

// Exposing Ajax for use by integration tests (and debugging, or whatever)
window.Ajax = Ajax;
