import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { brands } from 'src/libs/brands';
import * as Nav from 'src/libs/nav';
import { dataCatalogStore } from 'src/libs/state';
import { prepareDatasetsForDisplay } from 'src/pages/library/dataBrowser-utils';
import { Datasets } from 'src/pages/library/Datasets';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/libs/brand-utils', () => ({
  ...vi.importActual('src/libs/brand-utils'),
  getEnabledBrand: vi.fn(),
}));

vi.mock('src/libs/nav', () => ({
  ...vi.importActual('src/libs/nav'),
  getLink: vi.fn(),
  useRoute: vi.fn(),
}));

beforeEach(() => {
  dataCatalogStore.reset();
  Nav.useRoute.mockReturnValue({ title: 'Datasets', params: {}, query: {} });
});

describe('Datasets', () => {
  it('shows a toggle for the data catalog', () => {
    getEnabledBrand.mockReturnValue(brands.terra);
    const { getByLabelText, getByText } = render(h(Datasets));
    expect(getByText('Preview the new Data Catalog')).toBeTruthy();
    expect(getByLabelText('New Catalog OFF')).toBeTruthy();
  });

  it('shows all datasets in terra', () => {
    getEnabledBrand.mockReturnValue(brands.terra);
    expect(
      prepareDatasetsForDisplay(
        [{ 'dct:title': 'radx-up', 'TerraDCAT_ap:hasDataCollection': [{ 'dct:title': 'RADx-UP' }] }, { 'dct:title': 'not-radx' }],
        brands.terra.catalogDataCollectionsToInclude
      ).length
    ).toBe(2);
  });
});
