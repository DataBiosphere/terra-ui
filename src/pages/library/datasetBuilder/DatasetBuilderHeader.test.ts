import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilderHeader';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));
describe('DatasetBuilderHeader', () => {
  it('renders', () => {
    const name = 'hello world';
    const { getByText } = render(h(DatasetBuilderHeader, { datasetDetails: { name, id: 'id', description: '' } }));

    expect(getByText('Data Browser')).toBeTruthy();
  });
});
