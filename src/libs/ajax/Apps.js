import _ from 'lodash/fp'
import * as qs from 'qs'
import { appIdentifier, authOpts, fetchLeo, jsonBody } from 'src/libs/ajax/ajax-common'


export const Apps = signal => ({
  list: async (project, labels = {}) => {
    const res = await fetchLeo(`api/google/v1/apps/${project}?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },
  listWithoutProject: async (labels = {}) => {
    const res = await fetchLeo(`api/google/v1/apps?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },
  app: (project, name) => {
    const root = `api/google/v1/apps/${project}/${name}`
    return {
      delete: deleteDisk => {
        return fetchLeo(`${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier]))
      },
      create: ({ kubernetesRuntimeConfig, diskName, diskSize, diskType, appType, namespace, bucketName, workspaceName }) => {
        const body = {
          labels: {
            saturnWorkspaceNamespace: namespace,
            saturnWorkspaceName: workspaceName,
            saturnAutoCreated: 'true'
          },
          kubernetesRuntimeConfig,
          diskConfig: {
            name: diskName,
            size: diskSize,
            diskType,
            labels: {
              saturnApplication: appType,
              saturnWorkspaceNamespace: namespace,
              saturnWorkspaceName: workspaceName
            }
          },
          customEnvironmentVariables: {
            WORKSPACE_NAME: workspaceName,
            WORKSPACE_NAMESPACE: namespace,
            WORKSPACE_BUCKET: `gs://${bucketName}`,
            GOOGLE_PROJECT: project
          },
          appType
        }
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }, appIdentifier]))
      },
      pause: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },
      resume: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },
      details: async () => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]))
        return res.json()
      }
    }
  },
  createV2App: async (appName, workspaceId) => {
    const body = {
      'appType': 'CROMWELL'
    }
    console.log(appName)
    console.log(body)
    const res = await fetchLeo(`api/apps/v2/${workspaceId}/${appName}`,
      _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
    return res.json()
  },
  getV2AppInfo: async workspaceId => {
    const res = await fetchLeo(`api/apps/v2/${workspaceId}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  }
})
