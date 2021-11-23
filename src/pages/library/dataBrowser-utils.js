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
  OPEN: 'Open',
  PENDING: 'Pending'
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

  const dataReleasePolicy = _.flow(
    _.replace('TerraCore:', ''),
    _.startCase
  )(snapshot['TerraDCAT_ap:hasDataUsePermission'])

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
      _.map('dcat:mediaType', snapshot.files)
    ])
  }
}

export const useDataCatalog = () => {
  const skip = !isDataBrowserVisible()
  const signal = Utils.useCancellation()
  const [loading, setLoading] = useState(false)
  const dataCatalog = Utils.useStore(dataCatalogStore)

  const refresh = _.flow(
    withErrorReporting('Error loading data catalog'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const metadata = skip ? {} : await Ajax(signal).DataRepo.getMetadata()
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
