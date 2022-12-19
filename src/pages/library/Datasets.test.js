import { render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { getEnabledBrand, isRadX } from 'src/libs/brand-utils'
import { brands } from 'src/libs/brands'
import * as Nav from 'src/libs/nav'
import { dataCatalogStore } from 'src/libs/state'
import { filterDatasetsAndApplyTags } from 'src/pages/library/dataBrowser-utils'
import { Datasets } from 'src/pages/library/Datasets'


jest.mock('src/libs/brand-utils', () => ({
  ...jest.requireActual('src/libs/brand-utils'),
  getEnabledBrand: jest.fn(),
  isRadX: jest.fn()
}))

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn()
}))

beforeEach(() => {
  dataCatalogStore.reset()
  Nav.useRoute.mockReturnValue({ title: 'Datasets', params: {}, query: {} })
})

describe('Datasets', () => {
  it('shows a toggle for the data catalog', () => {
    getEnabledBrand.mockReturnValue(brands.terra)
    const { getByLabelText, getByText } = render(h(Datasets))
    expect(getByText('Preview the new Data Catalog')).toBeTruthy()
    expect(getByLabelText('New Catalog OFF')).toBeTruthy()
  })

  it('does not show a toggle when viewed as RadX', () => {
    isRadX.mockReturnValue(true)

    const { queryByLabelText, queryByText } = render(h(Datasets))
    expect(queryByText('Preview the new Data Catalog')).toBeFalsy()
    expect(queryByLabelText('New Catalog OFF')).toBeFalsy()
    // We can test if the new catalog is shown by checking for filters on the page.
    expect(queryByText('Filters')).toBeTruthy()
  })

  it('only shows RadX datasets when in RadX', () => {
    getEnabledBrand.mockReturnValue(brands.radX)
    const displayedDatasets = filterDatasetsAndApplyTags(
      [{ 'dct:title': 'radx-up', 'TerraDCAT_ap:hasDataCollection': [{ 'dct:title': 'RADx-UP' }] }, { 'dct:title': 'not-radx' }],
      brands.radX.catalogDataCollectionsToInclude
    )
    expect(displayedDatasets.length).toBe(1)
    expect(displayedDatasets[0]['dct:title']).toBe('radx-up')
  })

  it('shows all datasets in terra', () => {
    getEnabledBrand.mockReturnValue(brands.terra)
    expect(filterDatasetsAndApplyTags(
      [{ 'dct:title': 'radx-up', 'TerraDCAT_ap:hasDataCollection': [{ 'dct:title': 'RADx-UP' }] }, { 'dct:title': 'not-radx' }],
      brands.terra.catalogDataCollectionsToInclude
    ).length).toBe(2)
  })
})
