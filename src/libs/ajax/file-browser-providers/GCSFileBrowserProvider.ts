import { Ajax } from 'src/libs/ajax'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import { GCSItem } from 'src/libs/ajax/GoogleStorage'
import IncrementalResponse from 'src/libs/ajax/incremental-response/IncrementalResponse'


export interface GCSFileBrowserProviderParams {
  bucket: string
  project: string
  pageSize?: number
}

type GCSFileBrowserProviderGetPageParams<T> = {
  isFirstPage: boolean
  pageToken?: string
  pendingItems?: T[]
  prefix: string
  previousItems?: T[]
  signal: any
} & ({
  itemsOrPrefixes: 'items'
  mapItemOrPrefix: (item: GCSItem) => T
} | {
  itemsOrPrefixes: 'prefixes'
  mapItemOrPrefix: (prefix: string) => T
})

interface BucketListRequestOptions {
  maxResults: number
  pageToken?: string
}

const GCSFileBrowserProvider = ({ bucket, project, pageSize = 1000 }: GCSFileBrowserProviderParams): FileBrowserProvider => {
  const getNextPage = async <T>(params: GCSFileBrowserProviderGetPageParams<T>): Promise<IncrementalResponse<T>> => {
    const { isFirstPage, itemsOrPrefixes, mapItemOrPrefix, pageToken, pendingItems = [], prefix, previousItems = [], signal } = params

    let buffer = pendingItems
    let nextPageToken = pageToken

    if (nextPageToken || isFirstPage) {
      do {
        const requestOptions: BucketListRequestOptions = {
          maxResults: pageSize
        }
        if (nextPageToken) {
          requestOptions.pageToken = nextPageToken
        }

        const response = await Ajax(signal).Buckets.list(project, bucket, prefix, requestOptions)

        buffer = buffer.concat((response[itemsOrPrefixes] || []).map(itemOrPrefix => mapItemOrPrefix(itemOrPrefix)))
        nextPageToken = response.nextPageToken
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
          itemsOrPrefixes,
          mapItemOrPrefix,
          pageToken: nextPageToken,
          pendingItems: nextPendingItems,
          prefix,
          previousItems: items,
          signal
        } as GCSFileBrowserProviderGetPageParams<T>) :
        () => {
          throw new Error('No next page')
        },
      hasNextPage
    }
  }

  return {
    getFilesInDirectory: (path, { signal } = {}) => getNextPage({
      isFirstPage: true,
      itemsOrPrefixes: 'items',
      mapItemOrPrefix: item => ({
        path: item.name,
        url: `gs://${item.bucket}/${item.name}`,
        size: parseInt(item.size),
        createdAt: new Date(item.timeCreated).getTime(),
        updatedAt: new Date(item.updated).getTime()
      }),
      prefix: path,
      signal
    }),
    getDirectoriesInDirectory: (path, { signal } = {}) => getNextPage({
      isFirstPage: true,
      itemsOrPrefixes: 'prefixes',
      mapItemOrPrefix: prefix => ({
        path: `${prefix}`
      }),
      prefix: path,
      signal
    }),
    uploadFileToDirectory: (directoryPath, file) => {
      return Ajax().Buckets.upload(project, bucket, directoryPath, file)
    },
    deleteFile: async (path: string): Promise<void> => {
      await Ajax().Buckets.delete(project, bucket, path)
    },
  }
}

export default GCSFileBrowserProvider
