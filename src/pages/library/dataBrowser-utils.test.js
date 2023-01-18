import { render } from '@testing-library/react'
import { brands } from 'src/libs/brands'
import { dataCatalogStore } from 'src/libs/state'
import {
  datarepoSnapshotUrlFragment, datasetAccessTypes, getDatasetAccessType,
  makeDatasetReleasePolicyDisplayInformation, prepareDatasetsForDisplay, workspaceUrlFragment
} from 'src/pages/library/dataBrowser-utils'


beforeEach(() => {
  dataCatalogStore.reset()
})

describe('dataBrowser-utils', () => {
  it('sets external datasets to accessLevel external', () => {
    const normalizedDatasets = prepareDatasetsForDisplay(
      [{ 'dcat:accessURL': 'any-url.com' }],
      brands.terra.catalogDataCollectionsToInclude
    )
    expect(getDatasetAccessType(normalizedDatasets[0])).toBe(datasetAccessTypes.External)
  })

  it('doesn\'t set non external datasets to accessLevel external', () => {
    const normalizedDatasets = prepareDatasetsForDisplay(
      [{ 'dcat:accessURL': `any-url.com${workspaceUrlFragment}a/b` }, { 'dcat:accessURL': `any-url.com${datarepoSnapshotUrlFragment}` }],
      brands.terra.catalogDataCollectionsToInclude
    )
    expect(getDatasetAccessType(normalizedDatasets[0])).not.toBe(datasetAccessTypes.External)
    expect(getDatasetAccessType(normalizedDatasets[1])).not.toBe(datasetAccessTypes.External)
  })

  it('finds the correct data use policy to display if it exists', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation('DUO:0000007'))
    expect(getByText('Disease specific research')).toBeTruthy()
  })

  it('uses unspecified as the data use policy if undefined', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation(undefined))
    expect(getByText('Unspecified')).toBeTruthy()
  })

  it('uses given data use policy as the data use policy if unknown', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation('Something else'))
    expect(getByText('Something else')).toBeTruthy()
  })
})
