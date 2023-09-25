import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DataRepo, DataRepoContract, DatasetModel } from 'src/libs/ajax/DataRepo';
import { DatasetBuilderDetails } from 'src/pages/library/datasetBuilder/DatasetBuilderDetails';
import { dummyDatasetDetails } from 'src/pages/library/datasetBuilder/TestConstants';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('DatasetBuilderDetails', () => {
  const mockWithValues = (datasetDetailsResponse: DatasetModel, datasetRolesResponse: string[]) => {
    const datasetDetailsMock = jest.fn((_include) => Promise.resolve(datasetDetailsResponse));
    const datasetRolesMock = jest.fn(() => Promise.resolve(datasetRolesResponse));
    asMockedFn(DataRepo).mockImplementation(
      () =>
        ({
          dataset: (_datasetId) =>
            ({
              details: datasetDetailsMock,
              roles: datasetRolesMock,
            } as Partial<DataRepoContract['dataset']>),
        } as Partial<DataRepoContract> as DataRepoContract)
    );
  };

  it('renders', async () => {
    // Arrange
    mockWithValues(dummyDatasetDetails('id'), ['Steward']);
    render(h(DatasetBuilderDetails, { datasetId: 'id' }));
    // Assert
    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
    expect(await screen.findByText('Start creating datasets')).toBeTruthy();
  });

  it("renders the 'how to get access' button if discoverer", async () => {
    // Arrange
    mockWithValues(dummyDatasetDetails('id'), ['Discoverer']);
    render(h(DatasetBuilderDetails, { datasetId: 'id' }));
    // Assert
    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
    expect(await screen.findByText('Learn how to gain access')).toBeTruthy();
  });
});
