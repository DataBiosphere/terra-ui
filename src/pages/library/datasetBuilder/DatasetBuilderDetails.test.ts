import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilderDetails } from 'src/pages/library/datasetBuilder/DatasetBuilderDetails';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

describe('DatasetBuilderDetails', () => {
  it('renders', async () => {
    // Arrange
    render(h(DatasetBuilderDetails, { datasetId: 'id' }));
    // Assert
    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
  });
});
