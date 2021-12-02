import _ from 'lodash/fp'
import qs from 'qs'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { getConfig, isDataBrowserVisible } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { dataCatalogStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const snapshotAccessTypes = {
  CONTROLLED: 'Controlled',
  OPEN: 'Granted',
  PENDING: 'Pending'
}

export const snapshotReleasePolicies = {
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

const normalizeSnapshot = snapshot => {
  const contributors = _.map(_.update('contactName', _.flow(
    _.replace(/,+/g, ' '),
    _.replace(/(^|\s)[A-Z](?=\s|$)/g, '$&.')
  )), snapshot.contributors)

  const [curators, rawContributors] = _.partition({ projectRole: 'data curator' }, contributors)
  const contacts = _.filter('correspondingContributor', contributors)
  const contributorNames = _.map('contactName', rawContributors)

  const dataType = _.flow(
    _.flatMap('TerraCore:hasAssayCategory'),
    _.compact,
    _.uniqBy(_.toLower)
  )(snapshot['prov:wasGeneratedBy'])

  const dataModality = _.flow(
    _.flatMap('TerraCore:hasDataModality'),
    _.compact,
    _.map(_.replace('TerraCoreValueSets:', '')),
    _.uniqBy(_.toLower)
  )(snapshot['prov:wasGeneratedBy'])

  const dataReleasePolicy = _.has(snapshot['TerraDCAT_ap:hasDataUsePermission'], snapshotReleasePolicies) ?
    { ...snapshotReleasePolicies[snapshot['TerraDCAT_ap:hasDataUsePermission']], policy: snapshot['TerraDCAT_ap:hasDataUsePermission'] } :
    {
      ...snapshotReleasePolicies.releasepolicy_other,
      desc: _.flow(
        _.replace('TerraCore:', ''),
        _.startCase
      )(snapshot['TerraDCAT_ap:hasDataUsePermission'])
    }

  return {
    ...snapshot,
    project: _.get(['TerraDCAT_ap:hasDataCollection', 0, 'dct:title'], snapshot),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: !!snapshot['dct:modified'] && new Date(snapshot['dct:modified']),
    dataReleasePolicy,
    contacts, curators, contributorNames,
    dataType, dataModality,
    access: _.intersection(snapshot.roles, ['reader', 'owner']).length > 0 ? snapshotAccessTypes.OPEN : snapshotAccessTypes.CONTROLLED
  }
}

const extractTags = snapshot => {
  return {
    itemsType: 'AttributeValue',
    items: _.flow(_.flatten, _.toLower)([
      snapshot.access,
      snapshot.project,
      snapshot.samples?.genus,
      snapshot.samples?.disease,
      snapshot.dataType,
      snapshot.dataModality,
      _.map('dcat:mediaType', snapshot.files),
      snapshot.dataReleasePolicy.policy
    ])
  }
}

export const useDataCatalog = () => {
  const signal = Utils.useCancellation()
  const [loading, setLoading] = useState(false)
  const dataCatalog = Utils.useStore(dataCatalogStore)

  const refresh = _.flow(
    withErrorReporting('Error loading data catalog'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const metadata = !isDataBrowserVisible() ? {} : await Ajax(signal).DataRepo.getMetadata()
    const normList = _.map(snapshot => {
      const normalizedSnapshot = normalizeSnapshot(snapshot)
      return _.set(['tags'], extractTags(normalizedSnapshot), normalizedSnapshot)
    }, metadata?.result)

    dataCatalogStore.set(normList)
  })
  Utils.useOnMount(() => {
    _.isEmpty(dataCatalog) && refresh()
  })
  return { dataCatalog, refresh, loading }
}

export const importDataToWorkspace = snapshots => {
  Nav.history.push({
    pathname: Nav.getPath('import-data'),
    search: qs.stringify({
      url: getConfig().dataRepoUrlRoot, format: 'snapshot', referrer: 'data-catalog',
      snapshotIds: _.map('dct:identifier', snapshots)
    })
  })
}
