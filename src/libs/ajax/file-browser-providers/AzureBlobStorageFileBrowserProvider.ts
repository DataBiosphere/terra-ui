import { fetchOk } from 'src/libs/ajax/ajax-common'
import { AzureStorage } from 'src/libs/ajax/AzureStorage'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import IncrementalResponse from 'src/libs/ajax/incremental-response/IncrementalResponse'
import * as Utils from 'src/libs/utils'


export interface AzureBlobStorageFileBrowserProviderParams {
  workspaceId: string
  pageSize?: number
}

type AzureBlobStorageFileBrowserProviderGetPageParams<T> = {
  isFirstPage?: boolean
  pageToken?: string
  pendingItems?: T[]
  prefix: string
  previousItems?: T[]
  sasUrl: string
  signal: any
  tagName: 'Blob' | 'BlobPrefix'
  mapBlobOrBlobPrefix: (blobOrBlobPrefix: Element) => T
}

interface BlobListRequestOptions {
  maxResults: number
  marker?: string
}

const AzureBlobStorageFileBrowserProvider = ({ workspaceId, pageSize = 1000 }: AzureBlobStorageFileBrowserProviderParams): FileBrowserProvider => {
  const storageDetailsPromise = AzureStorage().details(workspaceId)
  const getNextPage = async <T>(params: AzureBlobStorageFileBrowserProviderGetPageParams<T>): Promise<IncrementalResponse<T>> => {
    const {
      isFirstPage,
      tagName,
      mapBlobOrBlobPrefix,
      pageToken,
      pendingItems = [],
      prefix,
      previousItems = [],
      sasUrl,
      signal,
    } = params

    let buffer = pendingItems
    let nextPageToken = pageToken

    if (nextPageToken || isFirstPage) {
      do {
        const requestOptions: BlobListRequestOptions = {
          maxResults: pageSize
        }
        if (nextPageToken) {
          requestOptions.marker = nextPageToken
        }

        const url = Utils.mergeQueryParams({
          restype: 'container',
          comp: 'list',
          delimiter: '/',
          prefix,
          ...requestOptions,
        }, sasUrl)

        const response = await fetchOk(url, { signal })
        const responseText = await response.text()
        const responseXML = new window.DOMParser().parseFromString(responseText, 'text/xml')

        const blobOrBlobPrefixElements = Array.from(responseXML.getElementsByTagName(tagName))
        buffer = buffer.concat(blobOrBlobPrefixElements.map(mapBlobOrBlobPrefix))

        nextPageToken = responseXML.getElementsByTagName('NextMarker').item(0)?.textContent || undefined
      } while (buffer.length < pageSize && nextPageToken)
    }

    const items = previousItems.concat(buffer.slice(0, pageSize))
    const nextPendingItems = buffer.slice(pageSize)
    const hasNextPage = nextPendingItems.length > 0 || !!nextPageToken

    return {
      items,
      getNextPage: hasNextPage ?
        ({ signal } = {}) => getNextPage({
          isFirstPage: false,
          tagName,
          mapBlobOrBlobPrefix,
          pageToken: nextPageToken,
          pendingItems: nextPendingItems,
          prefix,
          previousItems: items,
          sasUrl,
          signal
        } as AzureBlobStorageFileBrowserProviderGetPageParams<T>) :
        () => {
          throw new Error('No next page')
        },
      hasNextPage
    }
  }

  return {
    supportsEmptyDirectories: false,
    getFilesInDirectory: async (path, { signal } = {}) => {
      const { sas: { url: sasUrl } } = await storageDetailsPromise
      return getNextPage({
        isFirstPage: true,
        tagName: 'Blob',
        mapBlobOrBlobPrefix: blob => {
          const name = blob.getElementsByTagName('Name').item(0)!.textContent!
          const blobProperties = blob.getElementsByTagName('Properties').item(0)!
          const creationTime = blobProperties.getElementsByTagName('Creation-Time').item(0)!.textContent!
          const lastModified = blobProperties.getElementsByTagName('Last-Modified').item(0)!.textContent!
          const contentLength = blobProperties.getElementsByTagName('Content-Length').item(0)!.textContent!

          const blobUrl = new URL(sasUrl)
          blobUrl.pathname += `/${name}`
          blobUrl.search = ''
          return {
            path: name,
            url: blobUrl.href,
            size: parseInt(contentLength),
            createdAt: new Date(creationTime).getTime(),
            updatedAt: new Date(lastModified).getTime()
          }
        },
        prefix: path,
        sasUrl,
        signal
      })
    },
    getDirectoriesInDirectory: async (path, { signal } = {}) => {
      const { sas: { url: sasUrl } } = await storageDetailsPromise
      return getNextPage({
        isFirstPage: true,
        tagName: 'BlobPrefix',
        mapBlobOrBlobPrefix: blobPrefix => {
          const name = blobPrefix.getElementsByTagName('Name').item(0)!.textContent!

          return {
            path: name,
          }
        },
        prefix: path,
        sasUrl,
        signal
      })
    },
    getDownloadUrlForFile: async path => {
      const { sas: { url: originalSasUrl } } = await storageDetailsPromise
      const blobUrl = new URL(originalSasUrl)
      blobUrl.pathname += `/${path}`
      return blobUrl.href
    },
    getDownloadCommandForFile: async path => {
      const { sas: { url: originalSasUrl } } = await storageDetailsPromise
      const blobUrl = new URL(originalSasUrl)
      blobUrl.pathname += `/${path}`
      return `azcopy copy '${blobUrl.href}' .`
    },
    uploadFileToDirectory: async (directoryPath, file) => {
      const { sas: { url: originalSasUrl } } = await storageDetailsPromise
      const blobUrl = new URL(originalSasUrl)
      blobUrl.pathname += `/${directoryPath}${encodeURIComponent(file.name)}`

      await fetchOk(
        blobUrl.href,
        {
          body: file,
          headers: {
            'Content-Length': file.size,
            'Content-Type': file.type,
            'x-ms-blob-type': 'BlockBlob',
          },
          method: 'PUT',
        }
      )
    },
    deleteFile: async (path: string) => {
      const { sas: { url: originalSasUrl } } = await storageDetailsPromise

      const blobUrl = new URL(originalSasUrl)
      blobUrl.pathname += `/${path}`

      await fetchOk(
        blobUrl.href,
        {
          method: 'DELETE',
        }
      )
    },
    createEmptyDirectory: (_directoryPath: string) => {
      return Promise.reject(new Error('Empty directories not supported in Azure workspaces'))
    },
    deleteEmptyDirectory: (_directoryPath: string) => {
      return Promise.reject(new Error('Empty directories not supported in Azure workspaces'))
    },
  }
}

export default AzureBlobStorageFileBrowserProvider
