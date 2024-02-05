import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { getDatasetReleasePoliciesDisplayInformation, useDataCatalog } from 'src/data-catalog/data-browser-utils';
import { DataBrowserDetails, MainContent, MetadataDetailsComponent } from 'src/data-catalog/DataBrowserDetails';
import { TEST_DATASET_ONE, TEST_DATASET_TWO, TEST_DATASETS } from 'src/data-catalog/test-datasets';
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
  beforeAll(() => {
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

  describe('MainContent', () => {
    it('renders with name and description', async () => {
      // Act
      render(h(MainContent, { dataObj: TEST_DATASET_ONE }));
      // Assert
      expect(await screen.findByText(TEST_DATASET_ONE['dct:title'])).toBeTruthy();
      expect(await screen.findByText(TEST_DATASET_ONE['dct:description'])).toBeTruthy();
    });
    it('renders workspace content if from a workspace', async () => {
      // Act
      render(h(MainContent, { dataObj: TEST_DATASET_ONE }));
      // Assert
      expect(await screen.findByText('This data is from the Terra workspace:')).toBeTruthy();
    });
    it('does not render workspace content if not from a workspace', async () => {
      // Act
      render(h(MainContent, { dataObj: TEST_DATASET_TWO }));
      // Assert
      expect(await screen.queryByText('This data is from the Terra workspace:')).toBeFalsy();
    });
  });

  describe('MetadataDetailsComponent', () => {
    it('renders', async () => {
      // Act
      render(h(MetadataDetailsComponent, { dataObj: TEST_DATASET_ONE }));
      // Assert (We are only testing the properties which are on the test dataset)
      expect(
        await screen.findByText(
          getDatasetReleasePoliciesDisplayInformation(TEST_DATASET_ONE['TerraDCAT_ap:hasDataUsePermission']).label
        )
      ).toBeTruthy();
    });
  });
});
