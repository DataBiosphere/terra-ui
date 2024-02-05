import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useDataCatalog } from 'src/data-catalog/data-browser-utils';
import { DataBrowserDetails } from 'src/data-catalog/DataBrowserDetails';
import { TEST_DATASET_ONE, TEST_DATASETS } from 'src/data-catalog/test-datasets';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

const mockGoBack = jest.fn();

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    history: { goBack: () => mockGoBack() },
    getLink: jest.fn(),
    useRoute: jest.fn(),
  })
);

type DataBrowserUtilsExports = typeof import('src/data-catalog/data-browser-utils');
jest.mock('src/data-catalog/data-browser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual('src/data-catalog/data-browser-utils'),
    useDataCatalog: jest.fn(),
  };
});

describe('DataBrowserDetails', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useDataCatalog).mockReturnValue({
      dataCatalog: TEST_DATASETS,
      loading: false,
      refresh: () => Promise.resolve(),
    });
  });

  it('enables going back', async () => {
    // Arrange
    render(h(DataBrowserDetails, { id: TEST_DATASET_ONE.id }));
    const user = userEvent.setup();
    // Act
    const backButton = await screen.findByLabelText('Back');
    await user.click(backButton);
    // Assert
    expect(mockGoBack).toBeCalledTimes(1);
  });
});
