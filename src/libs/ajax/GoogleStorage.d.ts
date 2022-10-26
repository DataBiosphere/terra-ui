// https://cloud.google.com/storage/docs/json_api/v1/objects/list
type ListOptions = {
  delimiter?: string
  endOffset?: string
  includeTrailingDelimiter?: string
  maxResults?: number
  pageToken?: string
  projection?: 'full' | 'noAcl'
  startOffset?: string
  versions?: boolean
}

export type GCSItem = {
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

type ListResponse = {
  kind: 'storage#objects'
  nextPageToken?: string
  prefixes?: string[]
  objects?: GCSItem[]
}

type ListFn = (googleProject: string, bucket: string, prefix: string, options?: ListOptions) => Promise<ListResponse>

export type GoogleStorageMethods = {
  list: ListFn
}

export const GoogleStorage: (signal?: AbortSignal) => GoogleStorageMethods
