import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonOutline } from 'src/components/common'
import { icon } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { DatasetResponse } from 'src/libs/ajax/Catalog'
import { getEnabledBrand } from 'src/libs/brand-utils'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { dataCatalogStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { commonStyles } from 'src/pages/library/common'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'

// This type should change when we fix tags to be specific to the type
interface Tags {
  itemsType: string
  items: string
}

export interface Dataset extends DatasetResponse {
  tags: Tags
}

// What do we want to do here?
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
export const getDatasetReleasePoliciesDisplayInformation = (dataUsePermission: string): { label: string; description?: string } => {
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

export const DatasetReleasePolicyDisplayInformation = ({ 'TerraDCAT_ap:hasDataUsePermission': dataUsePermission }: { 'TerraDCAT_ap:hasDataUsePermission': string }) => {
  const { label, description } = getDatasetReleasePoliciesDisplayInformation(dataUsePermission)
  return h(Fragment, [
    label,
    description && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [description])
  ])
}

export const isExternal = (dataset: DatasetResponse): boolean => Utils.cond(
  [isWorkspace(dataset), () => false],
  [isDatarepoSnapshot(dataset), () => false],
  () => true)

export const workspaceUrlFragment = '/#workspaces/'

export const isWorkspace = (dataset: DatasetResponse): boolean => {
  return _.toLower(dataset['dcat:accessURL']).includes(workspaceUrlFragment)
}

export const datarepoSnapshotUrlFragment = '/snapshots/details/'

export const isDatarepoSnapshot = (dataset: DatasetResponse): boolean => {
  return _.toLower(dataset['dcat:accessURL']).includes(datarepoSnapshotUrlFragment)
}

export const getConsortiumTitlesFromDataset = (dataset: DatasetResponse): string[] => _.flatMap('dct:title', dataset['TerraDCAT_ap:hasDataCollection'])

export const getDataModalityListFromDataset = (dataset: DatasetResponse): string[] => _.flow(
  _.flatMap('TerraCore:hasDataModality'),
  _.sortBy(_.toLower),
  _.compact,
  _.map(_.replace('TerraCoreValueSets:', '')),
  _.uniqBy(_.toLower)
)(dataset['prov:wasGeneratedBy'])


export const getAssayCategoryListFromDataset = (dataset: DatasetResponse): string[] => _.flow(
  _.flatMap('TerraCore:hasAssayCategory'),
  _.sortBy(_.toLower),
  _.compact,
  _.uniqBy(_.toLower)
)(dataset['prov:wasGeneratedBy'])

export const formatDatasetTime = (time: string | null): string | null => !!time ? Utils.makeStandardDate(new Date(time)) : null

// Return type should be decided by above
export const getDatasetAccessType = (dataset: DatasetResponse) => Utils.cond(
  [isExternal(dataset), () => datasetAccessTypes.EXTERNAL],
  [dataset.accessLevel === 'reader' || dataset.accessLevel === 'owner', () => datasetAccessTypes.GRANTED],
  () => datasetAccessTypes.CONTROLLED)

interface DatasetAccessProps {
  dataset: Dataset
}
export const DatasetAccess = ({ dataset }: DatasetAccessProps) => {
  const [requestingAccess, setRequestingAccess] = useState(false)
  const access = getDatasetAccessType(dataset)
  const { requestAccessURL } = dataset
  const buttonStyle = { height: 34, textTransform: 'none', padding: '.5rem' }
  const textStyle = { paddingLeft: 10, paddingTop: 4, fontSize: 12 }

  return h(Fragment, [
    Utils.cond(
      [!!requestAccessURL && access === datasetAccessTypes.CONTROLLED, () => {
        return h(ButtonOutline, {
          style: buttonStyle,
          href: requestAccessURL, target: '_blank'
        }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])
      }],
      [access === datasetAccessTypes.CONTROLLED, () => h(ButtonOutline, {
        style: buttonStyle,
        onClick: () => {
          setRequestingAccess(true)
          // @ts-expect-error
          Ajax().Metrics.captureEvent(`${Events.catalogRequestAccess}:popUp`, {
            id: dataset.id,
            title: dataset['dct:title']
          })
        }
      }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])],
      [access === datasetAccessTypes.PENDING, () => div({ style: { color: commonStyles.access.pending, display: 'flex', alignItems: 'center' } }, [
        icon('lock'),
        div({ style: textStyle }, ['Pending Access'])
      ])],
      [access === datasetAccessTypes.EXTERNAL, () => h(ButtonOutline, {
        style: buttonStyle,
        href: dataset['dcat:accessURL'], target: '_blank'
      }, [
        div({ style: { fontSize: 12 } }, ['Externally managed']),
        // @ts-expect-error
        icon('pop-out', { style: { marginLeft: 10 }, size: 16 })
      ])],
      [Utils.DEFAULT, () => div({ style: { color: commonStyles.access.granted, display: 'flex', alignItems: 'center' } }, [
        icon('unlock'),
        div({ style: textStyle }, ['Granted Access'])
      ])]),
    requestingAccess && h(RequestDatasetAccessModal, {
      datasets: [dataset],
      onDismiss: () => setRequestingAccess(false)
    })
  ])
}

// These are used to match against by the filter
const extractTags = (dataset: DatasetResponse): Tags => {
  return {
    itemsType: 'AttributeValue',
    items: _.flow(_.flatten, _.toLower)([
      getDatasetAccessType(dataset),
      getConsortiumTitlesFromDataset(dataset),
      dataset.samples?.species,
      dataset.samples?.disease,
      getAssayCategoryListFromDataset(dataset),
      getDataModalityListFromDataset(dataset),
      _.map('TerraCore:hasFileFormat', dataset.fileAggregate),
      dataset['TerraDCAT_ap:hasDataUsePermission']
    ]) as string
  }
}


export const prepareDatasetsForDisplay = (datasets: DatasetResponse[], dataCollectionsToInclude: string[]): Dataset[] => {
  const filteredDatasets = _.filter(dataCollectionsToInclude ?
    dataset => _.intersection(dataCollectionsToInclude, _.map('dct:title', dataset['TerraDCAT_ap:hasDataCollection'])).length > 0 :
    _.constant(true),
  datasets)
  return _.map(dataset => {
    return { ...dataset, tags: extractTags(dataset) } as Dataset
  }, filteredDatasets)
}

interface DataCatalog { dataCatalog: Dataset[]; refresh: () => void; loading: boolean }

export const useDataCatalog = (): DataCatalog => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const dataCatalog = useStore(dataCatalogStore) as Dataset[]

  const refresh: () => void = _.flow(
    // @ts-expect-error
    withErrorReporting('Error loading data catalog'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const { result: datasets } = await Ajax(signal).Catalog.getDatasets()
    const dataCollectionsToInclude = getEnabledBrand().catalogDataCollectionsToInclude
    const normList = prepareDatasetsForDisplay(datasets, dataCollectionsToInclude)

    dataCatalogStore.set(normList)
  }) as () => void
  useOnMount(() => {
    _.isEmpty(dataCatalog) && refresh()
  })
  return { dataCatalog, refresh, loading }
}
