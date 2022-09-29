import { addMinutes, format } from 'date-fns/fp'
import _ from 'lodash/fp'
import { useState } from 'react'
import { notifyDataImportProgress, parseGsUri } from 'src/components/data/data-utils'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { notify } from 'src/libs/notifications'
import { useCancellation } from 'src/libs/react-utils'
import { asyncImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const dataTableVersionsPathRoot = '.data-table-versions'

export const saveDataTableVersion = async (workspace, entityType, { description = null, includedSetEntityTypes = [] } = {}) => {
  Ajax().Metrics.captureEvent(Events.dataTableVersioningSaveVersion, {
    ...extractWorkspaceDetails(workspace.workspace),
    tableName: entityType
  })

  const { workspace: { namespace, name, googleProject, bucketName } } = workspace

  const timestamp = (new Date()).getTime()
  const versionName = `${entityType}.v${timestamp}`

  const tsvContent = await Ajax().Workspaces.workspace(namespace, name).getEntitiesTsv(entityType)

  const tsvFile = new File([tsvContent], versionName, { type: 'text/tab-separated-values' })
  await Ajax().Buckets.upload(googleProject, bucketName, `${dataTableVersionsPathRoot}/${entityType}/`, tsvFile)

  const objectName = `${dataTableVersionsPathRoot}/${entityType}/${versionName}`
  const createdBy = getUser().email
  await Ajax().Buckets.patch(googleProject, bucketName, objectName, {
    metadata: { createdBy, entityType, timestamp, description }
  })

  return {
    url: `gs://${bucketName}/${objectName}`,
    createdBy,
    entityType,
    timestamp,
    description
  }
}

export const listDataTableVersions = async (workspace, entityType, { signal } = {}) => {
  const { workspace: { googleProject, bucketName } } = workspace

  const prefix = `${dataTableVersionsPathRoot}/${entityType}/`
  const { items } = await Ajax(signal).Buckets.listAll(googleProject, bucketName, { prefix })

  return _.flow(
    _.filter(item => item.metadata?.entityType && item.metadata?.timestamp),
    _.map(item => ({
      url: `gs://${item.bucket}/${item.name}`,
      createdBy: item.metadata.createdBy,
      entityType,
      timestamp: parseInt(item.metadata.timestamp),
      description: item.metadata.description
    })),
    _.sortBy(version => -version.timestamp)
  )(items)
}

export const deleteDataTableVersion = async (workspace, version) => {
  Ajax().Metrics.captureEvent(Events.dataTableVersioningDeleteVersion, {
    ...extractWorkspaceDetails(workspace.workspace),
    tableName: version.entityType
  })

  const { workspace: { googleProject, bucketName } } = workspace

  const [, objectName] = parseGsUri(version.url)
  await Ajax().Buckets.delete(googleProject, bucketName, objectName)
}

export const tableNameForRestore = version => {
  const timestamp = new Date(version.timestamp)
  return `${version.entityType}_${format('yyyy-MM-dd_HH-mm-ss', addMinutes(timestamp.getTimezoneOffset(), timestamp))}`
}

export const restoreDataTableVersion = async (workspace, version) => {
  Ajax().Metrics.captureEvent(Events.dataTableVersioningRestoreVersion, {
    ...extractWorkspaceDetails(workspace.workspace),
    tableName: version.entityType
  })

  const { workspace: { namespace, name, googleProject, bucketName } } = workspace

  const [, objectName] = parseGsUri(version.url)
  const content = await Ajax().Buckets.getObjectPreview(googleProject, bucketName, objectName, true).then(r => r.text())

  const tableName = tableNameForRestore(version)
  const file = new File(
    [_.replace(/^entity:\S+/, `entity:${tableName}_id`, content)],
    _.last(_.split('/', objectName)),
    { type: 'text/tab-separated-values' }
  )

  const filesize = file?.size || Number.MAX_SAFE_INTEGER
  if (filesize < 524288) { // 512k
    await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileSynchronous(file, { deleteEmptyValues: false })
    return { tableName, ready: true }
  } else {
    const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileAsync(file, { deleteEmptyValues: false })
    asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
    notifyDataImportProgress(jobId)
    return { tableName, ready: false }
  }
}

export const useDataTableVersions = workspace => {
  const signal = useCancellation()
  // { [entityType: string]: { loading: boolean, error: boolean, versions: Version[], savingNewVersion: boolean }
  const [dataTableVersions, setDataTableVersions] = useState({})

  return {
    dataTableVersions,

    loadDataTableVersions: async entityType => {
      setDataTableVersions(_.update(entityType, _.flow(_.set('loading', true), _.set('error', false))))
      try {
        const versions = await listDataTableVersions(workspace, entityType, { signal })
        setDataTableVersions(_.update(entityType, _.set('versions', versions)))
      } catch (err) {
        setDataTableVersions(_.update(entityType, _.set('error', true)))
        throw err
      } finally {
        setDataTableVersions(_.update(entityType, _.set('loading', false)))
      }
    },

    saveDataTableVersion: async (entityType, options = {}) => {
      setDataTableVersions(_.update(entityType, _.set('savingNewVersion', true)))
      try {
        const newVersion = await saveDataTableVersion(workspace, entityType, options)
        notify('success', `Saved version of ${entityType}`, { timeout: 3000 })
        setDataTableVersions(_.update([entityType, 'versions'],
          _.flow(_.defaultTo([]), Utils.append(newVersion), _.sortBy(version => -version.timestamp))
        ))
      } finally {
        setDataTableVersions(_.update(entityType, _.set('savingNewVersion', false)))
      }
    },

    deleteDataTableVersion: async version => {
      await deleteDataTableVersion(workspace, version)
      setDataTableVersions(_.update([version.entityType, 'versions'], _.remove({ timestamp: version.timestamp })))
    },

    restoreDataTableVersion: version => {
      return restoreDataTableVersion(workspace, version)
    }
  }
}
