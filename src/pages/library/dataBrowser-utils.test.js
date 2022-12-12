import { brands } from 'src/libs/brands'
import { dataCatalogStore } from 'src/libs/state'
import {
  datarepoSnapshotUrlFragment, datasetAccessTypes, datasetReleasePolicies, filterAndNormalizeDatasets, getDataReleasePolicyFromDataset,
  workspaceUrlFragment
} from 'src/pages/library/dataBrowser-utils'


beforeEach(() => {
  dataCatalogStore.reset()
})

describe('dataBrowser-utils', () => {
  it('sets external datasets to accessLevel external', () => {
    const normalizedDatasets = filterAndNormalizeDatasets(
      [{ 'dcat:accessURL': 'any-url.com' }],
      brands.terra.catalogDataCollectionsToInclude
    )
    expect(normalizedDatasets[0].access).toBe(datasetAccessTypes.EXTERNAL)
  })

  it('doesn\'t set non external datasets to accessLevel external', () => {
    const normalizedDatasets = filterAndNormalizeDatasets(
      [{ 'dcat:accessURL': `any-url.com${workspaceUrlFragment}a/b` }, { 'dcat:accessURL': `any-url.com${datarepoSnapshotUrlFragment}` }],
      brands.terra.catalogDataCollectionsToInclude
    )
    expect(normalizedDatasets[0].access).not.toBe(datasetAccessTypes.EXTERNAL)
    expect(normalizedDatasets[1].access).not.toBe(datasetAccessTypes.EXTERNAL)
  })

  it('finds the correct data use policy if it exists', () => {
    const normalizedDatasets = filterAndNormalizeDatasets([{ 'TerraDCAT_ap:hasDataUsePermission': 'DUO:0000007' }])
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).desc).toBe(datasetReleasePolicies['DUO:0000007'].desc)
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).label).toBe(datasetReleasePolicies['DUO:0000007'].label)
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).policy).toBe('DUO:0000007')
  })

  it('uses other as the data use policy if our map doesn\'t contain it or is undefined', () => {
    const normalizedDatasets = filterAndNormalizeDatasets([{ 'TerraDCAT_ap:hasDataUsePermission': undefined }, { 'TerraDCAT_ap:hasDataUsePermission': 'DUO:1234567' }])
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).desc).toBe(datasetReleasePolicies.unknownReleasePolicy.desc)
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).label).toBe(datasetReleasePolicies.unknownReleasePolicy.label)
    expect(getDataReleasePolicyFromDataset(normalizedDatasets[0]).policy).toBe(datasetReleasePolicies.unknownReleasePolicy.policy)
  })
})
