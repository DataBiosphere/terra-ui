import { FileBrowserDirectory, FileBrowserFile } from 'src/components/file-browser/file-browser-types'
import { Ajax } from 'src/libs/ajax'


interface RequestOptions {
  signal?: AbortSignal
}

export interface IncrementalResponse<T> {
  results: T[]
  getNextPage(options?: RequestOptions): Promise<IncrementalResponse<T>>
  hasNextPage: boolean
}

export interface FileBrowserBackend {
  getDirectoriesInDirectory(path: string, options?: RequestOptions): Promise<IncrementalResponse<FileBrowserDirectory>>
  getFilesInDirectory(path: string, options?: RequestOptions): Promise<IncrementalResponse<FileBrowserFile>>
}

interface GCSItem {
  bucket: string
  crc32c: string
  etag: string
  generation: string
  id: string
  kind: string
  md5Hash: string
  mediaLink: string
  metageneration: string
  name: string
  selfLink: string
  size: string
  storageClass: string
  timeCreated: string
  timeStorageClassUpdated: string
  updated: string
}

export interface GCSFileBrowserBackendParams {
  bucket: string
  project: string
  pageSize?: number
}

type GCSFileBrowserBackendGetPageParams<T> = {
  isFirstPage: boolean
  pageToken?: string
  pendingResults?: T[]
  prefix: string
  previousResults?: T[]
  signal: any
} & ({
  itemsOrPrefixes: 'items'
  mapItemOrPrefix: (item: GCSItem) => T
} | {
  itemsOrPrefixes: 'prefixes'
  mapItemOrPrefix: (prefix: string) => T
})

export const GCSFileBrowserBackend = ({ bucket, project, pageSize = 1000 }: GCSFileBrowserBackendParams): FileBrowserBackend => {
  const getNextPage = async <T>(params: GCSFileBrowserBackendGetPageParams<T>): Promise<IncrementalResponse<T>> => {
    const { isFirstPage, itemsOrPrefixes, mapItemOrPrefix, pageToken, pendingResults = [], prefix, previousResults = [], signal } = params

    let buffer = pendingResults
    let nextPageToken = pageToken

    if (nextPageToken || isFirstPage) {
      do {
        const requestOptions: { maxResults: number, pageToken?: string } = {
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

    const results = previousResults.concat(buffer.slice(0, pageSize))
    const nextPendingResults = buffer.slice(pageSize)
    const hasNextPage = nextPendingResults.length > 0 || !!nextPageToken

    return {
      results,
      getNextPage: hasNextPage ?
        ({ signal } = {}) => getNextPage({
          isFirstPage: false,
          itemsOrPrefixes,
          mapItemOrPrefix,
          pageToken: nextPageToken,
          pendingResults: nextPendingResults,
          prefix,
          previousResults: results,
          signal
        } as GCSFileBrowserBackendGetPageParams<T>) :
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
    })
  }
}
