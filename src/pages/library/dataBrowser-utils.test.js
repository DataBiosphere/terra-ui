import { render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { brands } from 'src/libs/brands'
import { dataCatalogStore } from 'src/libs/state'
import {
  datarepoSnapshotUrlFragment, datasetAccessTypes, DatasetReleasePolicyDisplayInformation, filterAndNormalizeDatasets,
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

  it('finds the correct data use policy to display if it exists', () => {
    const { getByText } = render(h(DatasetReleasePolicyDisplayInformation, { dataUsePermission: 'DUO:0000007' }))
    expect(getByText('Disease specific research')).toBeTruthy()
  })

  it('uses unspecified as the data use policy if undefined', () => {
    const { getByText } = render(h(DatasetReleasePolicyDisplayInformation, { dataUsePermission: undefined }))
    expect(getByText('Unspecified')).toBeTruthy()
  })

  it('uses given data use policy as the data use policy if unknown', () => {
    const { getByText } = render(h(DatasetReleasePolicyDisplayInformation, { dataUsePermission: 'Something else' }))
    expect(getByText('Something else')).toBeTruthy()
  })
})
