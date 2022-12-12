import _ from 'lodash/fp'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { getEnabledBrand } from 'src/libs/brand-utils'
import { withErrorReporting } from 'src/libs/error'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { dataCatalogStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const datasetAccessTypes = {
  CONTROLLED: 'Controlled',
  GRANTED: 'Granted',
  PENDING: 'Pending',
  EXTERNAL: 'External'
}

export const uiMessaging = {
  controlledFeatureTooltip: 'You do not have access to this dataset. Please request access to unlock this feature.',
  unsupportedDatasetTypeTooltip: action => `The Data Catalog currently does not support ${action} for this dataset.`
}

export const datasetReleasePolicies = {
  'DUO:0000007': { label: 'DS', desc: 'disease specific research' },
  'DUO:0000042': { label: 'GRU', desc: 'General research use' },
  'DUO:0000006': { label: 'HMB', desc: 'Health or medical or biomedical research' },
  'DUO:0000011': { label: 'POA', desc: 'Population origins or ancestry research only' },
  'DUO:0000004': { label: 'NRES', desc: 'No restriction' },
  // This case can handle null policies, or one that has been added to the schema enum that we don't yet handle
  unknownReleasePolicy: { policy: 'Unknown', label: 'Unknown', desc: 'No provided dataset release policy or not yet handled in the web interface' }
}

export const isExternal = dataset => Utils.cond(
  [isWorkspace(dataset), () => false],
  [isDatarepoSnapshot(dataset), () => false],
  () => true)

export const workspaceUrlFragment = '/#workspaces/'

export const isWorkspace = dataset => {
  return _.toLower(dataset['dcat:accessURL']).includes(workspaceUrlFragment)
}

export const datarepoSnapshotUrlFragment = '/snapshots/details/'

export const isDatarepoSnapshot = dataset => {
  return _.toLower(dataset['dcat:accessURL']).includes(datarepoSnapshotUrlFragment)
}

export const getConsortiumsFromDataset = dataset => _.map('dct:title', dataset['TerraDCAT_ap:hasDataCollection'])


export const getDataReleasePolicyFromDataset = dataset => _.has(dataset['TerraDCAT_ap:hasDataUsePermission'], datasetReleasePolicies) ?
  {
    ...datasetReleasePolicies[dataset['TerraDCAT_ap:hasDataUsePermission']],
    policy: dataset['TerraDCAT_ap:hasDataUsePermission']
  } :
  datasetReleasePolicies.unknownReleasePolicy

const normalizeDataset = dataset => {
  const contributors = _.map(_.update('contactName', _.flow(
    _.replace(/,+/g, ' '),
    _.replace(/(^|\s)[A-Z](?=\s|$)/g, '$&.')
  )), dataset.contributors)

  const [curators, rawContributors] = _.partition({ projectRole: 'data curator' }, contributors)
  const contacts = _.filter('correspondingContributor', contributors)
  const contributorNames = _.map('contactName', rawContributors)

  const dataType = _.flow(
    _.flatMap('TerraCore:hasAssayCategory'),
    _.compact,
    _.uniqBy(_.toLower)
  )(dataset['prov:wasGeneratedBy'])

  const dataModality = _.flow(
    _.flatMap('TerraCore:hasDataModality'),
    _.compact,
    _.map(_.replace('TerraCoreValueSets:', '')),
    _.uniqBy(_.toLower)
  )(dataset['prov:wasGeneratedBy'])

  const access = Utils.cond(
    [isExternal(dataset), () => datasetAccessTypes.EXTERNAL],
    [dataset.accessLevel === 'reader' || dataset.accessLevel === 'owner', () => datasetAccessTypes.GRANTED],
    () => datasetAccessTypes.CONTROLLED)
  return {
    ...dataset,
    lowerName: _.toLower(dataset['dct:title']),
    lowerDescription: _.toLower(dataset['dct:description']),
    lastUpdated: !!dataset['dct:modified'] && new Date(dataset['dct:modified']),
    contacts, curators, contributorNames,
    dataType, dataModality,
    access
  }
}

const extractTags = dataset => {
  return {
    itemsType: 'AttributeValue',
    items: _.flow(_.flatten, _.toLower)([
      dataset.access,
      getConsortiumsFromDataset(dataset),
      dataset.samples?.genus,
      dataset.samples?.disease,
      dataset.dataType,
      dataset.dataModality,
      _.map('dcat:mediaType', dataset.files),
      getDataReleasePolicyFromDataset(dataset).policy
    ])
  }
}

export const filterAndNormalizeDatasets = (datasets, dataCollectionsToInclude) => {
  const filteredDatasets = _.filter(dataCollectionsToInclude ?
    dataset => _.intersection(dataCollectionsToInclude, _.map('dct:title', dataset['TerraDCAT_ap:hasDataCollection'])).length > 0 :
    _.constant(true),
  datasets)
  return _.map(dataset => {
    const normalizedDataset = normalizeDataset(dataset)
    return _.set(['tags'], extractTags(normalizedDataset), normalizedDataset)
  }, filteredDatasets)
}

export const useDataCatalog = () => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const dataCatalog = useStore(dataCatalogStore)

  const refresh = _.flow(
    withErrorReporting('Error loading data catalog'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const { result: datasets } = await Ajax(signal).Catalog.getDatasets()
    const dataCollectionsToInclude = getEnabledBrand().catalogDataCollectionsToInclude
    const normList = filterAndNormalizeDatasets(datasets, dataCollectionsToInclude)

    dataCatalogStore.set(normList)
  })
  useOnMount(() => {
    _.isEmpty(dataCatalog) && refresh()
  })
  return { dataCatalog, refresh, loading }
}
