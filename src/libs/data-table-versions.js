import { addMinutes, format } from 'date-fns/fp'
import JSZip from 'jszip'
import _ from 'lodash/fp'
import { useState } from 'react'
import { entityAttributeText, notifyDataImportProgress, parseGsUri } from 'src/components/data/data-utils'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { notify } from 'src/libs/notifications'
import { useCancellation } from 'src/libs/react-utils'
import { asyncImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const dataTableVersionsPathRoot = '.data-table-versions'

const getTsvs = async (workspace, entityMetadata, entityType) => {
  const { workspace: { namespace, name } } = workspace
  const entities = await Ajax().Workspaces.workspace(namespace, name).getEntities(entityType)
  const { attributeNames } = entityMetadata[entityType]
  const isSet = entityType.endsWith('_set')

  if (isSet) {
    const setMemberType = entityType.slice(0, -4)

    const entityTsv = Utils.makeTSV([
      [`entity:${entityType}_id`, ..._.without([`${setMemberType}s`], attributeNames)],
      ..._.map(
        ({ name, attributes }) => [name, ..._.map(attribute => entityAttributeText(attributes[attribute], true), _.without([`${setMemberType}s`], attributeNames))],
        entities
      )
    ])

    const membershipTsv = Utils.makeTSV([
      [`membership:${entityType}_id`, setMemberType],
      ..._.flatMap(
        ({ attributes, name }) => _.map(({ entityName }) => [name, entityName], attributes[`${setMemberType}s`].items),
        entities
      )
    ])

    return [
      { name: `${entityType}.tsv`, content: entityTsv },
      { name: `${entityType}.membership.tsv`, content: membershipTsv }
    ]
  } else {
    const entityTsv = Utils.makeTSV([
      [`entity:${entityType}_id`, ...attributeNames],
      ..._.map(
        ({ name, attributes }) => [name, ..._.map(attribute => entityAttributeText(attributes[attribute], true), attributeNames)],
        entities
      )
    ])

    return [{ name: `${entityType}.tsv`, content: entityTsv }]
  }
}

export const saveDataTableVersion = async (workspace, entityType, { description = null, includedSetEntityTypes = [] } = {}) => {
  Ajax().Metrics.captureEvent(Events.dataTableVersioningSaveVersion, {
    ...extractWorkspaceDetails(workspace.workspace),
    tableName: entityType
  })

  const { workspace: { namespace, name, googleProject, bucketName } } = workspace

  const timestamp = (new Date()).getTime()
  const versionName = `${entityType}.v${timestamp}`

  const entityMetadata = await Ajax().Workspaces.workspace(namespace, name).entityMetadata()
  const tsvs = _.flatten(await Promise.all(_.map(type => getTsvs(workspace, entityMetadata, type), [entityType, ...includedSetEntityTypes])))

  const zip = new JSZip()
  _.forEach(({ name, content }) => { zip.file(name, content) }, tsvs)
  const zipContent = await zip.generateAsync({ type: 'blob' })

  const tsvFile = new File([zipContent], `${versionName}.zip`, { type: 'application/zip' })
  await Ajax().Buckets.upload(googleProject, bucketName, `${dataTableVersionsPathRoot}/${entityType}/`, tsvFile)

  const objectName = `${dataTableVersionsPathRoot}/${entityType}/${versionName}.zip`
  const createdBy = getUser().email
  await Ajax().Buckets.patch(googleProject, bucketName, objectName, {
    metadata: {
      createdBy,
      entityType,
      includedSetEntityTypes: _.join(',', includedSetEntityTypes),
      timestamp,
      description
    }
  })

  return {
    url: `gs://${bucketName}/${objectName}`,
    createdBy,
    entityType,
    includedSetEntityTypes,
    timestamp,
    description
  }
}

export const listDataTableVersions = async (workspace, entityType, { signal } = {}) => {
  const { workspace: { googleProject, bucketName } } = workspace

  const prefix = `${dataTableVersionsPathRoot}/${entityType}/`
  const { items } = await Ajax(signal).Buckets.listAll(googleProject, bucketName, { prefix })

  return _.flow(
    _.filter(item => item.name.endsWith('.zip') && item.metadata?.entityType && item.metadata?.timestamp),
    _.map(item => ({
      url: `gs://${item.bucket}/${item.name}`,
      createdBy: item.metadata.createdBy,
      entityType,
      includedSetEntityTypes: _.compact(_.split(',', item.metadata.includedSetEntityTypes)),
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
  const zipData = await Ajax().Buckets.getObjectPreview(googleProject, bucketName, objectName, true).then(r => r.blob())

  const zip = await JSZip.loadAsync(zipData)

  const restoredTableName = tableNameForRestore(version)
  const tableFile = new File(
    [_.replace(
      /^entity:\S+/, `entity:${restoredTableName}_id`,
      await zip.file(`${version.entityType}.tsv`).async('text')
    )],
    `${restoredTableName}.tsv`,
    { type: 'text/tab-separated-values' }
  )

  const tableFileSize = tableFile?.size || Number.MAX_SAFE_INTEGER
  if (tableFileSize >= 524288 && _.size(version.includedSetEntityTypes) === 0) {
    const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileAsync(tableFile, { deleteEmptyValues: false })
    asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
    notifyDataImportProgress(jobId)
    return { tableName: restoredTableName, ready: false }
  }

  await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileSynchronous(tableFile, { deleteEmptyValues: false })

  for (const setTableName of _.sortBy(_.identity, version.includedSetEntityTypes)) {
    const restoredSetTableName = _.replace(version.entityType, restoredTableName, setTableName)
    const restoredSetTableMemberType = restoredSetTableName.slice(0, -4)

    const setTableFile = new File(
      [_.replace(
        /^entity:\S+/, `entity:${restoredSetTableName}_id`,
        await zip.file(`${setTableName}.tsv`).async('text')
      )],
      `${restoredSetTableName}.tsv`,
      { type: 'text/tab-separated-values' }
    )
    await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileSynchronous(setTableFile, { deleteEmptyValues: false })

    const setMembershipFile = new File(
      [_.replace(
        /^membership:.*/, `membership:${restoredSetTableName}_id\t${restoredSetTableMemberType}`,
        await zip.file(`${setTableName}.membership.tsv`).async('text')
      )],
      `${restoredSetTableName}.membership.tsv`,
      { type: 'text/tab-separated-values' }
    )
    await Ajax().Workspaces.workspace(namespace, name).importFlexibleEntitiesFileSynchronous(setMembershipFile, { deleteEmptyValues: false })
  }

  return { tableName: restoredTableName, ready: true }
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
