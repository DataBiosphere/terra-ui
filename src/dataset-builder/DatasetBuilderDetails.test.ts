import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DataRepo, DataRepoContract, SnapshotBuilderSettings } from 'src/libs/ajax/DataRepo';
import { useRoute } from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { DatasetBuilderDetails } from './DatasetBuilderDetails';
import { testSnapshotBuilderSettings } from './TestConstants';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn().mockReturnValue({ query: {} }),
}));

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('DatasetBuilderDetails', () => {
  const mockWithValues = (snapshotBuilderSettings: SnapshotBuilderSettings, snapshotRolesResponse: string[]) => {
    const snapshotBuilderSettingsMock = jest.fn((_include) => Promise.resolve(snapshotBuilderSettings));
    const snapshotRolesMock = jest.fn(() => Promise.resolve(snapshotRolesResponse));
    asMockedFn(DataRepo).mockImplementation(
      () =>
        ({
          snapshot: (_snapshotId) =>
            ({
              roles: snapshotRolesMock,
              getSnapshotBuilderSettings: snapshotBuilderSettingsMock,
            } as Partial<DataRepoContract['snapshot']>),
        } as Partial<DataRepoContract> as DataRepoContract)
    );
  };

  it('renders', async () => {
    // Arrange
    mockWithValues(testSnapshotBuilderSettings(), ['aggregate_data_reader']);
    render(h(DatasetBuilderDetails, { snapshotId: 'id' }));
    // Assert
    expect(await screen.findByText(testSnapshotBuilderSettings().name)).toBeTruthy();
    expect(await screen.findByText('Create data snapshots')).toBeTruthy();
  });

  it("renders the 'how to get access' button if discoverer", async () => {
    // Arrange
    mockWithValues(testSnapshotBuilderSettings(), ['snapshot_creator']);
    render(h(DatasetBuilderDetails, { snapshotId: 'id' }));
    // Assert
    expect(await screen.findByText(testSnapshotBuilderSettings().name)).toBeTruthy();
    expect(await screen.findByText('Learn how to gain access')).toBeTruthy();
  });

  it('renders the categories and visualizations tabs', async () => {
    // Arrange
    mockWithValues(testSnapshotBuilderSettings(), ['aggregate_data_reader']);
    render(h(DatasetBuilderDetails, { snapshotId: 'id' }));
    // Assert
    expect(await screen.findByText('Data Categories')).toBeTruthy();
    expect(await screen.findByText('Participant Visualizations')).toBeTruthy();
  });

  it('defaults to the categories tab and renders the dataset summary stats', async () => {
    // Arrange
    mockWithValues(testSnapshotBuilderSettings(), ['aggregate_data_reader']);
    render(h(DatasetBuilderDetails, { snapshotId: 'id' }));
    asMockedFn(useRoute).mockImplementation(() => ({ query: {} }));
    // Assert
    expect(await screen.findByText('EHR Domains')).toBeTruthy();
  });

  it('renders the visualization graphs on the visualization tab', async () => {
    // Arrange
    mockWithValues(testSnapshotBuilderSettings(), ['aggregate_data_reader']);
    render(h(DatasetBuilderDetails, { snapshotId: 'id' }));
    asMockedFn(useRoute).mockImplementation(() => ({ query: { tab: 'visualizations' } }));
    // Assert
    expect(await screen.findAllByText('Age')).toBeTruthy();
    expect(await screen.findAllByText('Gender Identity')).toBeTruthy();
    expect(await screen.findAllByText('Race')).toBeTruthy();
    expect(await screen.findAllByText('Top 10 Conditions')).toBeTruthy();
    expect(await screen.findAllByText('Top 10 Drugs')).toBeTruthy();
    expect(await screen.findAllByText('Top 10 Procedures')).toBeTruthy();
  });
});
