import { brands } from 'src/libs/brands'
import { dataCatalogStore } from 'src/libs/state'
import {
  datarepoSnapshotUrlFragment, datasetAccessTypes, filterAndNormalizeDatasets, workspaceUrlFragment
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
})
