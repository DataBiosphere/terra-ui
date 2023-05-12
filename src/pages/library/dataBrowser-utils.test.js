import { render } from '@testing-library/react';
import * as _ from 'lodash/fp';
import { brands } from 'src/libs/brands';
import { dataCatalogStore } from 'src/libs/state';
import {
  datarepoSnapshotUrlFragment,
  datasetAccessTypes,
  getAssayCategoryListFromDataset,
  getConsortiumTitlesFromDataset,
  getDataModalityListFromDataset,
  getDatasetAccessType,
  getDatasetReleasePoliciesDisplayInformation,
  makeDatasetReleasePolicyDisplayInformation,
  prepareDatasetsForDisplay,
  workspaceUrlFragment,
} from 'src/pages/library/dataBrowser-utils';
import { TEST_DATASET_ONE } from 'src/pages/library/test-datasets';
import { beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => {
  dataCatalogStore.reset();
});

describe('dataBrowser-utils', () => {
  it('sets external datasets to accessLevel external', () => {
    const normalizedDatasets = prepareDatasetsForDisplay([{ 'dcat:accessURL': 'any-url.com' }], brands.terra.catalogDataCollectionsToInclude);
    expect(getDatasetAccessType(normalizedDatasets[0])).toBe(datasetAccessTypes.External);
  });

  it("doesn't set non external datasets to accessLevel external", () => {
    const normalizedDatasets = prepareDatasetsForDisplay(
      [{ 'dcat:accessURL': `any-url.com${workspaceUrlFragment}a/b` }, { 'dcat:accessURL': `any-url.com${datarepoSnapshotUrlFragment}` }],
      brands.terra.catalogDataCollectionsToInclude
    );
    expect(getDatasetAccessType(normalizedDatasets[0])).not.toBe(datasetAccessTypes.External);
    expect(getDatasetAccessType(normalizedDatasets[1])).not.toBe(datasetAccessTypes.External);
  });

  it('finds the correct data use policy to display if it exists', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation('DUO:0000007'));
    expect(getByText('Disease specific research')).toBeTruthy();
  });

  it('uses unspecified as the data use policy if undefined', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation(undefined));
    expect(getByText('Unspecified')).toBeTruthy();
  });

  it('uses given data use policy as the data use policy if unknown', () => {
    const { getByText } = render(makeDatasetReleasePolicyDisplayInformation('Something else'));
    expect(getByText('Something else')).toBeTruthy();
  });

  it('generates consortium titles properly', () => {
    const expectedValues = ['The Dog Land', 'Cats R Us'];
    const result = getConsortiumTitlesFromDataset(TEST_DATASET_ONE);
    _.forEach((expectedValue) => expect(result).toContain(expectedValue), expectedValues);
  });

  it('generates data use policy properly', () => {
    expect(getDatasetReleasePoliciesDisplayInformation(TEST_DATASET_ONE['TerraDCAT_ap:hasDataUsePermission'])).toMatchObject({
      label: 'GRU',
      description: 'General research use',
    });
  });

  it('generates data use policy in the case of an unknown policy correctly', () => {
    expect(getDatasetReleasePoliciesDisplayInformation('abcdef')).toMatchObject({ label: 'abcdef' });
  });

  it('generates data use policy in the case of an undefined policy correctly', () => {
    expect(getDatasetReleasePoliciesDisplayInformation(undefined)).toMatchObject({
      label: 'Unspecified',
      description: 'No specified dataset release policy',
    });
  });

  it('generates data modality list correctly', () => {
    const expectedValues = ['Epigenomic', 'Genomic', 'Transcriptomic'];
    const result = getDataModalityListFromDataset(TEST_DATASET_ONE);
    _.forEach((expectedValue) => expect(result).toContain(expectedValue), expectedValues);
  });

  it('generates data assay categories correctly', () => {
    const expectedValues = ['nuq-seq', 'RNA-seq'];
    const result = getAssayCategoryListFromDataset(TEST_DATASET_ONE);
    _.forEach((expectedValue) => expect(result).toContain(expectedValue), expectedValues);
  });
});
