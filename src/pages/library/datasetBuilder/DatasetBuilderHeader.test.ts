import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilderHeader';
import { dummyDatasetDetails } from 'src/pages/library/datasetBuilder/TestConstants';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));
describe('DatasetBuilderHeader', () => {
  it('renders', () => {
    const { getByText } = render(
      h(DatasetBuilderHeader, {
        datasetDetails: dummyDatasetDetails('axin'),
      })
    );

    expect(getByText('Data Browser')).toBeTruthy();
  });
});