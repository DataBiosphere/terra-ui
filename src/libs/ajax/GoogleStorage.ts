import _ from 'lodash/fp'
import * as qs from 'qs'
import { canUseWorkspaceProject } from 'src/libs/ajax'
import { authOpts, checkRequesterPaysError, fetchOk, fetchSam, jsonBody, withRetryOnError, withUrlPrefix } from 'src/libs/ajax/ajax-common'
import { getConfig } from 'src/libs/config'
import { getUser, knownBucketRequesterPaysStatuses, requesterPaysProjectStore, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { getExtension, getFileName, tools } from 'src/pages/workspaces/workspace/analysis/notebook-utils'


/*
 * Detects errors due to requester pays buckets, and adds the current workspace's billing
 * project if the user has access, retrying the request once if necessary.
 */
const withRequesterPays = wrappedFetch => (url, ...args) => {
  const bucket = /\/b\/([^/?]+)[/?]/.exec(url)![1]
  const workspace = workspaceStore.get()

  const getUserProject = async () => {
    if (!requesterPaysProjectStore.get() && workspace && await canUseWorkspaceProject(workspace)) {
      requesterPaysProjectStore.set(workspace.workspace.googleProject)
    }
    return requesterPaysProjectStore.get()
  }

  const tryRequest = async () => {
    const knownRequesterPays = knownBucketRequesterPaysStatuses.get()[bucket]
    try {
      const userProject = (knownRequesterPays && await getUserProject()) || undefined
      const res = await wrappedFetch(Utils.mergeQueryParams({ userProject }, url), ...args)
      !knownRequesterPays && knownBucketRequesterPaysStatuses.update(_.set(bucket, false))
      return res
    } catch (error) {
      if (knownRequesterPays === false) {
        throw error
      } else {
        const newResponse = await checkRequesterPaysError(error)
        if (newResponse.requesterPaysError && !knownRequesterPays) {
          knownBucketRequesterPaysStatuses.update(_.set(bucket, true))
          if (await getUserProject()) {
            return tryRequest()
          }
        }
        throw newResponse
      }
    }
  }
  return tryRequest()
}

// requesterPaysError may be set on responses from requests to the GCS API that are wrapped in withRequesterPays.
// requesterPaysError is true if the request requires a user project for billing the request to. Such errors
// are not transient and the request should not be retried.
export const fetchBuckets = _.flow(withRequesterPays, withRetryOnError(error => Boolean(error.requesterPaysError)), withUrlPrefix('https://storage.googleapis.com/'))(fetchOk)

/**
 * Only use this if the user has write access to the workspace to avoid proliferation of service accounts in projects containing public workspaces.
 * If we want to fetch a SA token for read access, we must use a "default" SA instead (api/google/user/petServiceAccount/token).
 */
const getServiceAccountToken = Utils.memoizeAsync(async (googleProject, token) => {
  const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
  const res = await fetchSam(
    `api/google/v1/user/petServiceAccount/${googleProject}/token`,
    _.mergeAll([authOpts(token), jsonBody(scopes), { method: 'POST' }])
  )
  return res.json()
}, {
  expires: 1000 * 60 * 30,
  // @ts-expect-error
  keyFn: (...args) => JSON.stringify(args)
})

export const saToken = googleProject => getServiceAccountToken(googleProject, getUser().token)

// https://cloud.google.com/storage/docs/json_api/v1/objects/list
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

export type GCSListObjectsOptions = {
  delimiter?: string
  endOffset?: string
  includeTrailingDelimiter?: string
  maxResults?: number
  pageToken?: string
  projection?: 'full' | 'noAcl'
  startOffset?: string
  versions?: boolean
}

export type GCSListObjectsResponse = {
  kind: 'storage#objects'
  nextPageToken?: string
  prefixes?: string[]
  items?: GCSItem[]
}

const encodeAnalysisName = name => encodeURIComponent(`notebooks/${name}`)

export const GoogleStorage = (signal?: AbortSignal) => ({
  getObject: async (googleProject, bucket, object, params = {}) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}${qs.stringify(params, { addQueryPrefix: true })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    ).then(
      res => res.json()
    )
  },

  getObjectPreview: async (googleProject, bucket, object, previewFull = false) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.mergeAll([
        authOpts(await saToken(googleProject)),
        { signal },
        previewFull ? {} : { headers: { Range: 'bytes=0-20000' } }
      ])
    )
  },

  listNotebooks: async (googleProject, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => _.includes(getExtension(name), tools.Jupyter.ext), items)
  },

  listAnalyses: async (googleProject, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => (_.includes(getExtension(name), tools.Jupyter.ext) || _.includes(getExtension(name), tools.RStudio.ext)), items)
  },

  list: async (googleProject: string, bucket: string, prefix: string, options: GCSListObjectsOptions = {}): Promise<GCSListObjectsResponse> => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ delimiter: '/', ...options, prefix })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    return res.json()
  },

  /**
   * Recursively returns all objects in the specified bucket, iterating through all pages until
   * results have been exhausted and all objects have been collected.
   *
   * @param googleProject
   * @param bucket Name of the bucket in which to look for objects.
   * @param {Object} options to pass into the GCS API. Accepted options are:
   *    prefix: Filter results to include only objects whose names begin with this prefix.
   *    pageToken: A previously-returned page token representing part of the larger set of results to view.
   *    delimiter: Returns results in a directory-like mode, with / being a common value for the delimiter.
   * @returns {Promise<*>}
   * See https://cloud.google.com/storage/docs/json_api/v1/objects/list for additional documentation for underlying GCS API
   */
  listAll: async (googleProject, bucket, { prefix = null, pageToken = null, delimiter = null } = {}) => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ prefix, delimiter, pageToken })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const body = await res.json()
    const items = body.items || []
    const prefixes = body.prefixes || []

    // Get the next page recursively if there is one
    if (body.nextPageToken) {
      const next = await GoogleStorage(signal).listAll(googleProject, bucket, { prefix, pageToken: body.nextPageToken, delimiter })
      return { items: _.concat(items, next.items), prefixes: _.concat(prefixes, next.prefixes) }
    }
    return { items, prefixes }
  },

  delete: async (googleProject, bucket, name) => {
    return fetchBuckets(
      `storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`,
      _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
    )
  },

  upload: async (googleProject, bucket, prefix, file) => {
    return fetchBuckets(
      `upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(prefix + file.name)}`,
      _.merge(authOpts(await saToken(googleProject)), {
        signal, method: 'POST', body: file,
        headers: { 'Content-Type': file.type, 'Content-Length': file.size }
      })
    )
  },

  patch: async (googleProject, bucket, name, metadata) => {
    return fetchBuckets(
      `storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`,
      _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(metadata), { signal, method: 'PATCH' }])
    )
  },

  //TODO: this should be deprecated in favor of the smarter `analysis` set of functions
  notebook: (googleProject, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async (newName, newBucket, clearMetadata) => {
      const body = clearMetadata ? { metadata: { lastLockedBy: '' } } : {}
      return fetchBuckets(
        `${bucketUrl}/${encodeAnalysisName(name)}/copyTo/b/${newBucket}/o/${encodeAnalysisName(newName)}`,
        _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(body), { signal, method: 'POST' }])
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${encodeAnalysisName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
      )
    }

    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${encodeAnalysisName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'GET' })
      )
      return await res.json()
    }

    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeURIComponent(`notebooks/${name}`)}?alt=media`,
          _.merge(authOpts(await saToken(googleProject)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/api/convert`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${encodeAnalysisName(name)}`,
          _.merge(authOpts(await saToken(googleProject)), {
            signal, method: 'POST', body: JSON.stringify(contents),
            headers: { 'Content-Type': 'application/x-ipynb+json' }
          })
        )
      },

      delete: doDelete,

      getObject,

      rename: async newName => {
        await copy(newName, bucket, false)
        return doDelete()
      }
    }
  },

  //TODO: this should take a type `file`, instead of (name, toolLabel), and then we can remove `toolLabel` param
  analysis: (googleProject, bucket, name, toolLabel) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const calhounPath = Utils.switchCase(toolLabel,
      [tools.Jupyter.label, () => 'api/convert'], [tools.RStudio.label, () => 'api/convert/rmd'])

    const mimeType = Utils.switchCase(toolLabel,
      [tools.Jupyter.label, () => 'application/x-ipynb+json'], [tools.RStudio.label, () => 'application/octet-stream'])

    const encodeFileName = name => encodeAnalysisName(getFileName(name))

    const doCopy = async (newName, newBucket, body) => {
      return fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}/copyTo/b/${newBucket}/o/${encodeFileName(newName)}`,
        _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(body), { signal, method: 'POST' }])
      )
    }

    const copy = (newName, newBucket, clearMetadata) => {
      const body = clearMetadata ? { metadata: { lastLockedBy: '' } } : {}
      return doCopy(newName, newBucket, body)
    }

    const copyWithMetadata = (newName, newBucket, copyMetadata) => {
      const body = { metadata: copyMetadata }
      return doCopy(newName, newBucket, body)
    }

    const updateMetadata = async (fileName, newMetadata) => {
      const body = { metadata: newMetadata }
      return fetchBuckets(
        `${bucketUrl}/${encodeFileName(fileName)}`,
        _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(body), { signal, method: 'PATCH' }])
      )
    }

    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
      )
    }


    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'GET' })
      )
      return await res.json()
    }

    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeFileName(name)}?alt=media`,
          _.merge(authOpts(await saToken(googleProject)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/${calhounPath}`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      copyWithMetadata,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${encodeFileName(name)}`,
          _.merge(authOpts(await saToken(googleProject)), {
            signal, method: 'POST', body: contents,
            headers: { 'Content-Type': mimeType }
          })
        )
      },

      delete: doDelete,

      getObject,

      rename: async newName => {
        await copy(`${newName}.${getExtension(name)}`, bucket, false)
        return doDelete()
      },

      updateMetadata
    }
  }
})

export type GoogleStorageContract = ReturnType<typeof GoogleStorage>
