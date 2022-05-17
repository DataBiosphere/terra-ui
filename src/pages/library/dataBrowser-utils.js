import _ from 'lodash/fp'
import qs from 'qs'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { getConfig, isDataBrowserVisible } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { dataCatalogStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const datasetAccessTypes = {
  CONTROLLED: 'Controlled',
  GRANTED: 'Granted',
  PENDING: 'Pending'
}

export const uiMessaging = {
  controlledFeature_tooltip: 'You do not have access to this dataset. Please request access to unlock this feature.'
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

  return {
    ...dataset,
    project: _.get(['TerraDCAT_ap:hasDataCollection', 0, 'dct:title'], dataset),
    lowerName: _.toLower(dataset['dct:title']), lowerDescription: _.toLower(dataset['dct:description']),
    lastUpdated: !!dataset['dct:modified'] && new Date(dataset['dct:modified']),
    dataReleasePolicy,
    contacts, curators, contributorNames,
    dataType, dataModality,
    access: _.intersection(_.map(_.toLower, dataset.roles), ['reader', 'writer', 'owner']).length > 0 ? datasetAccessTypes.GRANTED : datasetAccessTypes.CONTROLLED
  }
}

const extractTags = dataset => {
  return {
    itemsType: 'AttributeValue',
    items: _.flow(_.flatten, _.toLower)([
      dataset.access,
      dataset.project,
      dataset.samples?.genus,
      dataset.samples?.disease,
      dataset.dataType,
      dataset.dataModality,
      _.map('dcat:mediaType', dataset.files),
      dataset.dataReleasePolicy.policy
    ])
  }
}

export const useDataCatalog = () => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const dataCatalog = useStore(dataCatalogStore)

  const refresh = _.flow(
    withErrorReporting('Error loading data catalog'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const datasets = !isDataBrowserVisible() ? {} : await Ajax(signal).Catalog.getDatasets()
    const normList = _.map(dataset => {
      const normalizedDataset = normalizeDataset(dataset)
      return _.set(['tags'], extractTags(normalizedDataset), normalizedDataset)
    }, datasets.result || [])

    dataCatalogStore.set(normList)
  })
  useOnMount(() => {
    _.isEmpty(dataCatalog) && refresh()
  })
  return { dataCatalog, refresh, loading }
}

export const importDataToWorkspace = datasets => {
  // TODO (DC-284): Call data catalog to figure out what the format should be for importing to workspace
  const format = 'snapshot'
  Nav.history.push({
    pathname: Nav.getPath('import-data'),
    search: qs.stringify({
      url: getConfig().dataRepoUrlRoot, format, referrer: 'data-catalog',
      snapshotIds: _.map('dct:identifier', datasets)
    })
  })
}
