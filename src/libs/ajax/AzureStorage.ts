import _ from 'lodash/fp';
import { AnalysisFile, AnalysisFileMetadata } from 'src/analysis/useAnalysisFiles';
import { AbsolutePath, getDisplayName, getExtension, getFileName } from 'src/analysis/utils/file-utils';
import { runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { authOpts, fetchOk, fetchWorkspaceManager } from 'src/libs/ajax/ajax-common';
import { getConfig } from 'src/libs/config';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/libs/workspace-utils';

type SasInfo = {
  url: string;
  token: string;
};

type StorageDetails = {
  location: string;
  storageContainerName: string;
  sas: SasInfo;
};

export interface AzureFileRaw {
  name: string;
  lastModified: string;
  metadata?: AnalysisFileMetadata;
}

const encodeAzureAnalysisName = (name: string): string => encodeURIComponent(`analyses/${name}`);

export const AzureStorage = (signal?: AbortSignal) => ({
  sasToken: async (workspaceId: string, containerId: string): Promise<SasInfo> => {
    // sas token expires after 8 hours
    const tokenResponse = await fetchWorkspaceManager(
      `workspaces/v1/${workspaceId}/resources/controlled/azure/storageContainer/${containerId}/getSasToken?sasExpirationDuration=28800`,
      _.merge(authOpts(), { signal, method: 'POST' })
    );

    return tokenResponse.json();
  },

  /**
   * Note that this method will throw an error if there is no shared access storage container available
   * (which is an expected transient state while a workspace is being cloned).
   */
  details: async (workspaceId: string): Promise<StorageDetails> => {
    const data = await Ajax(signal).WorkspaceManagerResources.controlledResources(workspaceId);
    const container = _.find(
      {
        metadata: {
          resourceType: 'AZURE_STORAGE_CONTAINER',
          controlledResourceMetadata: { accessScope: 'SHARED_ACCESS' },
        },
      },
      data.resources
    );
    // When a workspace is first cloned, it will not have a storage container, as the storage container and blob
    // cloning happens asynchronously. Ultimately we will change the `StorageDetails` variable types to reflect
    // that they may be null, but until all the consuming code changes to handle that we will just throw an error
    // (which is what was happening anyway when we tried to access container.metadata).
    if (!container) {
      throw new Error('The workspace does not have a shared access storage container.');
    }

    const sas = await AzureStorage(signal).sasToken(workspaceId, container.metadata.resourceId);

    return {
      location: container.metadata.controlledResourceMetadata.region,
      storageContainerName: container.resourceAttributes.azureStorageContainer.storageContainerName,
      sas,
    };
  },

  // A prefix filter is used to only include files from a parent directory and below. It is the path starting *after* the the container name (which generally looks like sc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  // So, in order to include only the files in the workspace-services/cbas directory you would include 'workspace-services/cbas' as the prefix filter.
  // Importantly, the prefix filter is handled by the Azure Backend, which makes it more efficient than the suffix filter, which is handled on the client frontend.
  // The suffix filter is used to filter the files returned by the Azure Backend. It can be used to filter the files by file extension or file name, for example. If the returned number of files is very large, this may be a slow operation.
  listFiles: async (workspaceId: string, prefixFilter = '', suffixFilter = ''): Promise<AzureFileRaw[]> => {
    if (!workspaceId) {
      return [];
    }

    const {
      sas: { url, token },
    } = await AzureStorage(signal).details(workspaceId);
    const azureContainerUrl = _.flow(
      _.split('?'),
      _.head,
      Utils.append(`?restype=container&comp=list&prefix=${prefixFilter}&${token}`),
      _.join('')
    )(url);
    const res = await fetchOk(azureContainerUrl);
    const text = await res.text();
    const xml = new window.DOMParser().parseFromString(text, 'text/xml');
    const blobs = _.map(
      (blob) => ({
        name: _.head(blob.getElementsByTagName('Name'))?.textContent,
        lastModified: _.head(blob.getElementsByTagName('Last-Modified'))?.textContent,
      }),
      xml.getElementsByTagName('Blob')
    ) as AzureFileRaw[];

    const filteredBlobs = _.filter((blob) => _.endsWith(suffixFilter, blob.name), blobs);
    return filteredBlobs;
  },

  listFilesInDirectory: async (workspaceId: string, blobPath: string): Promise<AzureFileRaw[]> => {
    if (!blobPath) {
      return [];
    }
    const {
      sas: { token },
    } = await AzureStorage(signal).details(workspaceId);
    const fullUri = `${blobPath}?restype=container&comp=list&${token}`;
    const res = await fetchOk(fullUri);
    const text = await res.text();
    const xml = new window.DOMParser().parseFromString(text, 'text/xml');
    const blobs = _.map(
      (blob) => ({
        name: _.head(blob.getElementsByTagName('Name'))?.textContent,
        lastModified: _.head(blob.getElementsByTagName('Last-Modified'))?.textContent,
      }),
      xml.getElementsByTagName('Blob')
    ) as AzureFileRaw[];
    return blobs;
  },

  listNotebooks: async (workspaceId: string): Promise<AnalysisFile[]> => {
    const notebooks = await AzureStorage(signal).listFiles(workspaceId, '.ipynb');
    return _.map(
      (notebook) => ({
        lastModified: new Date(notebook.lastModified).getTime(),
        name: notebook.name as AbsolutePath,
        ext: getExtension(notebook.name),
        displayName: getDisplayName(notebook.name),
        fileName: getFileName(notebook.name),
        tool: runtimeToolLabels.Jupyter,
        cloudProvider: cloudProviderTypes.AZURE,
      }),
      notebooks
    );
  },

  blobByUri: (azureStorageUrl: string) => {
    const getBlobByUri = async (method) => {
      const fileName = _.last(azureStorageUrl.split('/'))?.split('.').join('.');

      try {
        // assumption is made that container name guid in uri always matches the workspace Id guid it is present in
        const workspaceId = azureStorageUrl.split('/')[3].replace('sc-', '');
        const {
          sas: { token },
        } = await AzureStorage(signal).details(workspaceId);

        // instead of taking the url returned by azure storage, take it from the incoming url since there may be a folder path
        const urlwithFolder = new URL(azureStorageUrl);
        const azureSasStorageUrl = `https://${urlwithFolder.hostname}${urlwithFolder.pathname}?${token}`;

        const res = await fetchOk(azureSasStorageUrl, { method });
        const headerDict = Object.fromEntries(res.headers);

        const textContent = method === 'GET' ? await res.text().catch((_err) => undefined) : null;

        return {
          uri: azureStorageUrl,
          sasToken: token,
          lastModified: headerDict['last-modified'],
          size: headerDict['content-length'],
          azureSasStorageUrl,
          workspaceId,
          fileName,
          name: fileName,
          textContent,
        };
      } catch (e) {
        // check if file can just be fetched without sas token
        try {
          const res = await fetchOk(azureStorageUrl, { method: 'HEAD' });
          const headerDict = Object.fromEntries(res.headers);
          return {
            lastModified: headerDict['last-modified'],
            size: headerDict['content-length'],
            azureStorageUrl,
            fileName,
          };
        } catch (e) {}

        throw e;
      }
    };

    return {
      getMetadata: async () => getBlobByUri('HEAD'),
      getMetadataAndTextContent: async () => getBlobByUri('GET'),
    };
  },

  blob: (workspaceId: string, blobName: string) => {
    const calhounPath = 'api/convert';

    const getObject = async () => {
      const azureStorageUrl = await getBlobUrl(workspaceId, blobName);

      const res = await fetchOk(azureStorageUrl);
      const text = await res.text();
      return text;
    };

    const getBlobUrl = async (workspaceId, blobName) => {
      const {
        sas: { url, token },
      } = await AzureStorage(signal).details(workspaceId);
      const encodedBlobName = encodeAzureAnalysisName(blobName);

      const azureStorageUrl = _.flow(
        _.split('?'),
        _.head,
        Utils.append(`/${encodedBlobName}?&${token}`),
        _.join('')
      )(url);

      return azureStorageUrl;
    };

    // https://docs.microsoft.com/en-us/rest/api/storageservices/copy-blob#request
    const copy = async (destBlob, destWorkspaceId = workspaceId) => {
      const destStorageUrl = await getBlobUrl(destWorkspaceId, `${destBlob}.${getExtension(blobName)}`);
      const srcStorageUrl = await getBlobUrl(workspaceId, blobName);

      return fetchOk(destStorageUrl, { method: 'PUT', headers: { 'x-ms-copy-source': srcStorageUrl } });
    };

    const doDelete = async () => {
      const storageUrl = await getBlobUrl(workspaceId, blobName);

      return fetchOk(storageUrl, { method: 'DELETE' });
    };

    return {
      get: getObject,

      preview: async () => {
        const textFileContents = await getObject();
        return fetchOk(
          `${getConfig().calhounUrlRoot}/${calhounPath}`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: textFileContents }])
        ).then((res) => res);
      },

      create: async (contents) => {
        const azureStorageUrl = await getBlobUrl(workspaceId, blobName);

        return fetchOk(azureStorageUrl, {
          method: 'PUT',
          body: contents,
          headers: { 'Content-Type': 'application/x-ipynb+json', 'x-ms-blob-type': 'BlockBlob' },
        });
      },

      copy,

      rename: async (destBlob) => {
        await copy(destBlob);
        return doDelete();
      },

      delete: doDelete,
    };
  },
});

export type AzureStorageContract = ReturnType<typeof AzureStorage>;
