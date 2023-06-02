import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { DatasetBuilderDetails } from 'src/pages/library/datasetBuilder/DatasetBuilderDetails';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

describe('DatasetBuilderDetails', () => {
  beforeAll(() => {
    const retrieveDataset = jest.fn((datasetId) => {
      return Promise.resolve({
        name: 'AnalytiXIN',
        id: datasetId,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      });
    });
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          DatasetBuilder: { retrieveDataset } as Partial<AjaxContract['DatasetBuilder']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  it('renders', async () => {
    render(h(DatasetBuilderDetails, { datasetId: 'id' }));

    expect(await screen.findByText('AnalytiXIN')).toBeTruthy();
  });
});
