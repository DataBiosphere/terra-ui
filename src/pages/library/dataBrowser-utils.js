import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
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

// This list is generated from the schema enum
export const getDatasetReleasePoliciesDisplayInformation = dataUsePermission => {
  return Utils.switchCase(
    dataUsePermission,
    ['DUO:0000007', () => ({ label: 'DS', description: 'Disease specific research' })],
    ['DUO:0000042', () => ({ label: 'GRU', description: 'General research use' })],
    ['DUO:0000006', () => ({ label: 'HMB', description: 'Health or medical or biomedical research' })],
    ['DUO:0000011', () => ({ label: 'POA', description: 'Population origins or ancestry research only' })],
    ['DUO:0000004', () => ({ label: 'NRES', description: 'No restriction' })],
    [undefined, () => ({ label: 'Unspecified', description: 'No specified dataset release policy' })],
    [Utils.DEFAULT, () => ({ label: dataUsePermission })]
  )
}

export const DatasetReleasePolicyDisplayInformation = ({ dataUsePermission }) => {
  const { label, description } = getDatasetReleasePoliciesDisplayInformation(dataUsePermission)
  return h(Fragment, [
    label,
    description && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [description])
  ])
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

export const getDataModalityListFromDataset = dataset => _.flow(
  _.flatMap('TerraCore:hasDataModality'),
  _.sortBy(_.toLower),
  _.compact,
  _.map(_.replace('TerraCoreValueSets:', '')),
  _.uniqBy(_.toLower)
)(dataset['prov:wasGeneratedBy'])


export const getAssayCategoryListFromDataset = dataset => _.flow(
  _.flatMap('TerraCore:hasAssayCategory'),
  _.sortBy(_.toLower),
  _.compact,
  _.uniqBy(_.toLower)
)(dataset['prov:wasGeneratedBy'])

export const formatDatasetTime = time => !!time ? Utils.makeStandardDate(new Date(time)) : null


export const getDatasetAccessType = dataset => Utils.cond(
  [isExternal(dataset), () => datasetAccessTypes.EXTERNAL],
  [dataset.accessLevel === 'reader' || dataset.accessLevel === 'owner', () => datasetAccessTypes.GRANTED],
  () => datasetAccessTypes.CONTROLLED)

// These are used to match against by the filter
const extractTags = dataset => {
  return {
    itemsType: 'AttributeValue',
    items: _.flow(_.flatten, _.toLower)([
      getDatasetAccessType(dataset),
      getConsortiumsFromDataset(dataset),
      dataset.samples?.genus,
      dataset.samples?.disease,
      getAssayCategoryListFromDataset(dataset),
      getDataModalityListFromDataset(dataset),
      _.map('dcat:mediaType', dataset.files),
      dataset['TerraDCAT_ap:hasDataUsePermission']
    ])
  }
}

export const prepareDatasetsForDisplay = (datasets, dataCollectionsToInclude) => {
  const filteredDatasets = _.filter(dataCollectionsToInclude ?
    dataset => _.intersection(dataCollectionsToInclude, _.map('dct:title', dataset['TerraDCAT_ap:hasDataCollection'])).length > 0 :
    _.constant(true),
  datasets)
  return _.map(dataset => {
    return _.set(['tags'], extractTags(dataset), dataset)
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
    const normList = prepareDatasetsForDisplay(datasets, dataCollectionsToInclude)

    dataCatalogStore.set(normList)
  })
  useOnMount(() => {
    _.isEmpty(dataCatalog) && refresh()
  })
  return { dataCatalog, refresh, loading }
}
