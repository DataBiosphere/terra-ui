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
  'TerraCore:NoRestriction': { label: 'NRES', desc: 'No restrictions' },
  'TerraCore:GeneralResearchUse': { label: 'GRU', desc: 'General research use' },
  'TerraCore:NPOA': { label: 'NPOA', desc: 'No population origins or ancestry research' },
  'TerraCore:NMDS': { label: 'NMDS', desc: 'No general methods research' },
  'TerraCore:GSO': { label: 'GSO', desc: 'Genetic studies only' },
  'TerraCore:CC': { label: 'CC', desc: 'Clinical care use' },
  'TerraCore:PUB': { label: 'PUB', desc: 'Publication required' },
  'TerraCore:COL': { label: 'COL', desc: 'Collaboration required' },
  'TerraCore:IRB': { label: 'IRB', desc: 'Ethics approval required' },
  'TerraCore:GS': { label: 'GS', desc: 'Geographical restriction' },
  'TerraCore:MOR': { label: 'MOR', desc: 'Publication moratorium' },
  'TerraCore:RT': { label: 'RT', desc: 'Return to database/resource' },
  'TerraCore:NCU': { label: 'NCU', desc: 'Non commercial use only' },
  'TerraCore:NPC': { label: 'NPC', desc: 'Not-for-profit use only' },
  'TerraCore:NPC2': { label: 'NPC2', desc: 'Not-for-profit, non-commercial use only' },
  releasepolicy_other: { policy: 'SnapshotReleasePolicy_Other', label: 'Other', desc: 'Misc release policies' }
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

export const getConsortiumsFromDataset = dataset => _.map(dataCollection => dataCollection['dct:title'], dataset['TerraDCAT_ap:hasDataCollection'])


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

  const dataReleasePolicy = _.has(dataset['TerraDCAT_ap:hasDataUsePermission'], datasetReleasePolicies) ?
    { ...datasetReleasePolicies[dataset['TerraDCAT_ap:hasDataUsePermission']], policy: dataset['TerraDCAT_ap:hasDataUsePermission'] } :
    {
      ...datasetReleasePolicies.releasepolicy_other,
      desc: _.flow(
        _.replace('TerraCore:', ''),
        _.startCase
      )(dataset['TerraDCAT_ap:hasDataUsePermission'])
    }

  const access = Utils.cond(
    [isExternal(dataset), () => datasetAccessTypes.EXTERNAL],
    [dataset.accessLevel === 'reader' || dataset.accessLevel === 'owner', () => datasetAccessTypes.GRANTED],
    () => datasetAccessTypes.CONTROLLED)
  return {
    ...dataset,
    lastUpdated: !!dataset['dct:modified'] && new Date(dataset['dct:modified']),
    dataReleasePolicy,
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
      _.map('dct:title', dataset['TerraDCAT_ap:hasDataCollection']),
      dataset.samples?.genus,
      dataset.samples?.disease,
      dataset.dataType,
      dataset.dataModality,
      _.map('dcat:mediaType', dataset.files),
      dataset.dataReleasePolicy.policy
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
