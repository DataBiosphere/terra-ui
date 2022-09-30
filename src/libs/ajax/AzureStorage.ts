import _ from 'lodash/fp'
import { authOpts, fetchOk, fetchWorkspaceManager } from 'src/libs/ajax/ajax-common'
import { getConfig } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import {
  AbsolutePath,
  AnalysisFile,
  FileMetadata,
  getDisplayName,
  getExtension, getFileName
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { toolLabelTypes, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { cloudProviderTypes } from 'src/pages/workspaces/workspace/workspace-utils'


interface AzureFileRaw {
  name: string,
  lastModified: string,
  metadata?: FileMetadata
}

const encodeAzureAnalysisName = (name: string): string => encodeURIComponent(`analyses/${name}`)

export const AzureStorage = signal => ({
  sasToken: async (workspaceId, containerId) => {
    const tokenResponse = await fetchWorkspaceManager(`workspaces/v1/${workspaceId}/resources/controlled/azure/storageContainer/${containerId}/getSasToken`,
      _.merge(authOpts(), { signal, method: 'POST' }))

    return tokenResponse.json()
  },

  details: async (workspaceId = {}) => {
    const res = await fetchWorkspaceManager(`workspaces/v1/${workspaceId}/resources?stewardship=CONTROLLED&limit=1000`,
      _.merge(authOpts(), { signal })
    )
    const data = await res.json()
    const storageAccount = _.find({ metadata: { resourceType: 'AZURE_STORAGE_ACCOUNT' } }, data.resources)

    if (storageAccount === undefined) { // Internal users may have early workspaces with no storage account.
      return {
        location: undefined,
        storageContainerName: undefined,
        sas: { url: undefined, token: undefined }
      }
    } else {
      const container = _.find(
        {
          metadata: { resourceType: 'AZURE_STORAGE_CONTAINER', controlledResourceMetadata: { accessScope: 'SHARED_ACCESS' } },
          resourceAttributes: { azureStorageContainer: { storageAccountId: storageAccount.metadata.resourceId } }
        },
        data.resources
      )
      const sas = await AzureStorage(signal).sasToken(workspaceId, container.metadata.resourceId)

      return {
        location: storageAccount.resourceAttributes.azureStorage.region,
        storageContainerName: container.resourceAttributes.azureStorageContainer.storageContainerName,
        sas
      }
    }
  },

  listFiles: async (workspaceId: string, suffixFilter: string = ''): Promise<AzureFileRaw[]> => {
    if (!workspaceId) {
      return []
    }

    const { sas: { url, token } } = await AzureStorage(signal).details(workspaceId)
    const azureContainerUrl = _.flow(
      _.split('?'),
      _.head,
      Utils.append(`?restype=container&comp=list&${token}`),
      _.join('')
    )(url)

    const res = await fetchOk(azureContainerUrl)
    const text = await res.text()
    const xml = new window.DOMParser().parseFromString(text, 'text/xml')
    const blobs = _.map(
      blob => ({
        name: _.head(blob.getElementsByTagName('Name'))?.textContent,
        lastModified: _.head(blob.getElementsByTagName('Last-Modified'))?.textContent
      }),
      xml.getElementsByTagName('Blob')
    ) as AzureFileRaw[]

    const filteredBlobs = _.filter(blob => _.endsWith(suffixFilter, blob.name), blobs)
    return filteredBlobs
  },

  listNotebooks: async (workspaceId: string): Promise<AnalysisFile[]> => {
    const notebooks = await AzureStorage(signal).listFiles(workspaceId, '.ipynb')
    return _.map(notebook => ({
      lastModified: new Date(notebook.lastModified).getTime(),
      name: notebook.name as AbsolutePath,
      ext: getExtension(notebook.name),
      displayName: getDisplayName(notebook.name),
      fileName: getFileName(notebook.name),
      tool: toolLabelTypes[tools.Jupyter.label],
      cloudProvider: cloudProviderTypes.AZURE
    }), notebooks)
  },

  blob: (workspaceId, blobName) => {
    const calhounPath = 'api/convert'

    const getObject = async () => {
      const azureStorageUrl = await getBlobUrl(workspaceId, blobName)

      const res = await fetchOk(azureStorageUrl)
      const text = await res.text()
      return text
    }

    const getBlobUrl = async (workspaceId, blobName) => {
      const { sas: { url, token } } = await AzureStorage(signal).details(workspaceId)
      const encodedBlobName = encodeAzureAnalysisName(blobName)

      const azureStorageUrl = _.flow(
        _.split('?'),
        _.head,
        Utils.append(`/${encodedBlobName}?&${token}`),
        _.join('')
      )(url)

      return azureStorageUrl
    }

    // https://docs.microsoft.com/en-us/rest/api/storageservices/copy-blob#request
    const copy = async (destBlob, destWorkspaceId = workspaceId) => {
      const destStorageUrl = await getBlobUrl(destWorkspaceId, `${destBlob}.${getExtension(blobName)}`)
      const srcStorageUrl = await getBlobUrl(workspaceId, blobName)

      return fetchOk(destStorageUrl, { method: 'PUT', headers: { 'x-ms-copy-source': srcStorageUrl } })
    }

    const doDelete = async () => {
      const storageUrl = await getBlobUrl(workspaceId, blobName)

      return fetchOk(storageUrl, { method: 'DELETE' })
    }

    return {
      get: getObject,

      preview: async () => {
        const textFileContents = await getObject()
        return fetchOk(`${getConfig().calhounUrlRoot}/${calhounPath}`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: textFileContents }])
        ).then(res => res.text())
      },

      create: async contents => {
        const azureStorageUrl = await getBlobUrl(workspaceId, blobName)

        return fetchOk(azureStorageUrl, {
          method: 'PUT', body: contents,
          headers: { 'Content-Type': 'application/x-ipynb+json', 'x-ms-blob-type': 'BlockBlob' }
        })
      },

      copy,

      rename: async destBlob => {
        await copy(destBlob)
        return doDelete()
      },

      delete: doDelete
    }
  }
})

export type AzureStorageContract = ReturnType<typeof AzureStorage>
