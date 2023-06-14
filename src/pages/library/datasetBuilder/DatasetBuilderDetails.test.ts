import { render, screen } from '@testing-library/react';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilder, DatasetBuilderContract, dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import { DatasetBuilderDetails } from 'src/pages/library/datasetBuilder/DatasetBuilderDetails';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

type DatasetBuilderExports = typeof import('src/libs/ajax/DatasetBuilder');
jest.mock('src/libs/ajax/DatasetBuilder', (): DatasetBuilderExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DatasetBuilder'),
    DatasetBuilder: jest.fn(),
  };
});

describe('DatasetBuilderDetails', () => {
  it('renders', async () => {
    // Arrange
    const mockDatasetResponse: Partial<DatasetBuilderContract> = {
      retrieveDataset: jest.fn(),
    };
    asMockedFn((mockDatasetResponse as DatasetBuilderContract).retrieveDataset).mockResolvedValue(
      dummyDatasetDetails('axin')
    );
    asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
    render(h(DatasetBuilderDetails, { datasetId: 'id' }));
    // Assert
    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
    expect(await screen.findByText('Start creating datasets')).toBeTruthy();
  });

  it("renders the 'how to get access' button if discoverer", async () => {
    // Arrange
    const mockDatasetResponse: Partial<DatasetBuilderContract> = {
      retrieveDataset: jest.fn(),
    };
    asMockedFn((mockDatasetResponse as DatasetBuilderContract).retrieveDataset).mockResolvedValue(
      _.set('accessLevel', 'Discoverer', dummyDatasetDetails('axin'))
    );
    asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
    render(h(DatasetBuilderDetails, { datasetId: 'axin' }));
    // Assert
    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
    expect(await screen.findByText('Learn how to gain access')).toBeTruthy();
  });
});
