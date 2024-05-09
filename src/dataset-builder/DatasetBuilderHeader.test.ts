import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { DatasetBuilderHeader } from './DatasetBuilderHeader';
import { testSnapshotId } from './TestConstants';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));
describe('DatasetBuilderHeader', () => {
  it('renders', () => {
    const { getByText } = render(
      h(DatasetBuilderHeader, {
        snapshotId: testSnapshotId,
      })
    );

    expect(getByText('Data Browser')).toBeTruthy();
  });
});
