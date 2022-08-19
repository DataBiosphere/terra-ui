import _ from 'lodash/fp'
import { useState } from 'react'
import { parseGsUri } from 'src/components/data/data-utils'
import { Ajax } from 'src/libs/ajax'
import { notify } from 'src/libs/notifications'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


export const dataTableVersionsRoot = '.data-table-versions'

export const saveDataTableVersion = async (workspace, entityType, { description = null } = {}) => {
  const { workspace: { namespace, name, googleProject, bucketName } } = workspace

  const timestamp = (new Date()).getTime()
  const versionName = `${entityType}.v${timestamp}`

  const tsvContent = await Ajax().Workspaces.workspace(namespace, name).getEntitiesTsv(entityType)

  const tsvFile = new File([tsvContent], versionName, { type: 'text/tab-separated-values' })
  await Ajax().Buckets.upload(googleProject, bucketName, `${dataTableVersionsRoot}/${entityType}/`, tsvFile)

  const objectName = `${dataTableVersionsRoot}/${entityType}/${versionName}`
  await Ajax().Buckets.patch(googleProject, bucketName, objectName, {
    metadata: {
      entityType,
      timestamp,
      description
    }
  })

  return {
    url: `gs://${bucketName}/${objectName}`,
    entityType,
    timestamp,
    description
  }
}

export const listDataTableVersions = async (workspace, entityType, { signal } = {}) => {
  const { workspace: { googleProject, bucketName } } = workspace

  const prefix = `${dataTableVersionsRoot}/${entityType}/`
  const { items } = await Ajax(signal).Buckets.listAll(googleProject, bucketName, { prefix })

  return _.flow(
    _.filter(item => item.metadata?.entityType && item.metadata?.timestamp),
    _.map(item => ({
      url: `gs://${item.bucket}/${item.name}`,
      entityType,
      timestamp: parseInt(item.metadata.timestamp),
      description: item.metadata.description
    })),
    _.sortBy(version => -version.timestamp)
  )(items)
}

export const deleteDataTableVersion = async (workspace, version) => {
  const { workspace: { googleProject, bucketName } } = workspace

  const [, objectName] = parseGsUri(version.url)
  await Ajax().Buckets.delete(googleProject, bucketName, objectName)
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

    saveDataTableVersion: async (entityType, { description = null } = {}) => {
      setDataTableVersions(_.update(entityType, _.set('savingNewVersion', true)))
      try {
        const newVersion = await saveDataTableVersion(workspace, entityType, { description })
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
    }
  }
}
