import _ from 'lodash/fp'
import qs from 'qs'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { dataCatalogStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const snapshotAccessTypes = {
  CONTROLLED: 'Controlled',
  OPEN: 'Open',
  PENDING: 'Pending'
}

/*
  It's necessary to add the release policy prefix because of how the filters work.
  Filters will grab from an array of values without differentiating which filter it belongs to

  For example:
  if the user decides to filter by "data release policy = 'other'", it will filter the data
  based off "{any filter field} = 'other'". Adding the prefix forces the filtering to recognize
  which field is being filtered on.
*/
const releasePolicyPrefix = 'releasepolicytag_'
export const snapshotReleasePolicies = {
  'TerraCore:NoRestriction': { tag: `${releasePolicyPrefix}NRES`, label: 'NRES', desc: 'No restrictions' },
  'TerraCore:GeneralResearchUse': { tag: `${releasePolicyPrefix}GRU`, label: 'GRU', desc: 'General research use' },
  'TerraCore:NPOA': { tag: `${releasePolicyPrefix}NPOA`, label: 'NPOA', desc: 'No population origins or ancestry research' },
  'TerraCore:NMDS': { tag: `${releasePolicyPrefix}NMDS`, label: 'NMDS', desc: 'No general methods research' },
  'TerraCore:GSO': { tag: `${releasePolicyPrefix}GSO`, label: 'GSO', desc: 'Genetic studies only' },
  'TerraCore:CC': { tag: `${releasePolicyPrefix}CC`, label: 'CC', desc: 'Clinical care use' },
  'TerraCore:PUB': { tag: `${releasePolicyPrefix}PUB`, label: 'PUB', desc: 'Publication required' },
  'TerraCore:COL': { tag: `${releasePolicyPrefix}COL`, label: 'COL', desc: 'Collaboration required' },
  'TerraCore:IRB': { tag: `${releasePolicyPrefix}IRB`, label: 'IRB', desc: 'Ethics approval required' },
  'TerraCore:GS': { tag: `${releasePolicyPrefix}GS`, label: 'GS', desc: 'Geographical restriction' },
  'TerraCore:MOR': { tag: `${releasePolicyPrefix}MOR`, label: 'MOR', desc: 'Publication moratorium' },
  'TerraCore:RT': { tag: `${releasePolicyPrefix}RT`, label: 'RT', desc: 'Return to database/resource' },
  'TerraCore:NCU': { tag: `${releasePolicyPrefix}NCU`, label: 'NCU', desc: 'Non commercial use only' },
  'TerraCore:NPC': { tag: `${releasePolicyPrefix}NPC`, label: 'NPC', desc: 'Not-for-profit use only' },
  'TerraCore:NPC2': { tag: `${releasePolicyPrefix}NPC2`, label: 'NPC2', desc: 'Not-for-profit, non-commercial use only' },
  releasepolicy_other: { tag: `${releasePolicyPrefix}OTHER`, label: 'Other', desc: 'Misc release policies' }
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

  const dataReleasePolicy = _.getOr(
    {
      ...snapshotReleasePolicies.releasepolicy_other,
      desc: _.flow(
        _.replace('TerraCore:', ''),
        _.startCase
      )(snapshot['TerraDCAT_ap:hasDataUsePermission'])
    }, snapshot['TerraDCAT_ap:hasDataUsePermission'], snapshotReleasePolicies)

  return {
    ...snapshot,
    project: _.get(['TerraDCAT_ap:hasDataCollection', 0, 'dct:title'], snapshot),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: !!snapshot['dct:modified'] && new Date(snapshot['dct:modified']),
    dataReleasePolicy,
    contacts, curators, contributorNames,
    dataType, dataModality,
    access: snapshot.access || snapshotAccessTypes.OPEN
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
      snapshot.dataReleasePolicy.tag
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
    const metadata = await Ajax(signal).DataRepo.getMetadata()
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
