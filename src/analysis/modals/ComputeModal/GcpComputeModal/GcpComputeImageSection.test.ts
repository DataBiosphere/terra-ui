import { ReadyState } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  defaultImage,
  defaultRImage,
  generateTestGetGoogleRuntime,
  imageDocs,
  pegasusImage,
} from 'src/analysis/_testData/testData';
import {
  GcpComputeImageSection,
  GcpComputeImageSectionProps,
} from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpComputeImageSection';
import { ComputeImage, useComputeImages } from 'src/analysis/useComputeImages';
import { runtimeToolLabels, runtimeTools, terraSupportedRuntimeImageIds } from 'src/analysis/utils/tool-utils';
import { ComputeImageRaw } from 'src/libs/ajax/compute-image-providers/ComputeImageProvider';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

type UseComputeImagesExport = typeof import('src/analysis/useComputeImages');
jest.mock(
  'src/analysis/useComputeImages',
  (): UseComputeImagesExport => ({
    ...jest.requireActual<UseComputeImagesExport>('src/analysis/useComputeImages'),
    useComputeImages: jest.fn(),
  })
);

jest.mock('src/libs/ajax/workspaces/Workspaces');

const defaultComputeImageStore = {
  refresh: () => Promise.resolve(),
  loadedState: { status: 'Ready', state: [] } as ReadyState<ComputeImage[]>,
};

const mockOnSelect = jest.fn();
const defaultGcpComputeImageSectionProps: GcpComputeImageSectionProps = {
  onSelect: mockOnSelect,
  tool: runtimeToolLabels.Jupyter,
  currentRuntime: {
    runtimeImages: (generateTestGetGoogleRuntime() as Pick<GetRuntimeItem, 'runtimeImages'>).runtimeImages,
  },
};

const jupyterImageIds = runtimeTools.Jupyter.imageIds;

const rImageIds = runtimeTools.RStudio.imageIds;

const normalizedImages: ComputeImage[] = imageDocs.map(
  (image: ComputeImageRaw): ComputeImage => ({
    ...image,
    isCommunity: !!image.isCommunity,
    isRStudio: !!image.isRStudio,
    isTerraSupported: terraSupportedRuntimeImageIds.includes(image.id),
    toolLabel: image.isRStudio ? runtimeToolLabels.RStudio : runtimeToolLabels.Jupyter,
    url: image.image,
  })
);

describe('GcpComputeImageSection', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useComputeImages).mockReturnValue(defaultComputeImageStore);
    asMockedFn(mockOnSelect).mockImplementation();
  });

  it('loads properly with default selections', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useComputeImages).mockReturnValue({
      ...defaultComputeImageStore,
      loadedState: {
        ...defaultComputeImageStore.loadedState,
        state: normalizedImages,
      },
    });

    // Act
    await act(async () => {
      render(
        h(GcpComputeImageSection, {
          ...defaultGcpComputeImageSectionProps,
          'aria-label': 'Select Environment',
          currentRuntime: {
            runtimeImages: [
              {
                imageType: runtimeToolLabels.Jupyter,
                imageUrl: defaultImage.image,
                timestamp: '2022-09-19T15:37:11.035465Z',
              },
              ...(defaultGcpComputeImageSectionProps.currentRuntime?.runtimeImages ?? []),
            ],
          },
        } as GcpComputeImageSectionProps)
      );
    });

    // Assert
    // Select element appears
    const inputElement = screen.getByLabelText('Select Environment');
    // Default image is default selection
    expect(mockOnSelect).lastCalledWith(
      expect.objectContaining({ url: defaultImage.image, toolLabel: runtimeToolLabels.Jupyter }),
      false
    );

    // Act
    await user.click(inputElement);

    // Assert
    // All images for the current tool appear as options
    [
      'TERRA-MAINTAINED JUPYTER ENVIRONMENTS',
      'COMMUNITY-MAINTAINED JUPYTER ENVIRONMENTS (verified partners)',
      'OTHER ENVIRONMENTS',
    ].every((heading) => screen.getByText(heading));
    imageDocs
      .filter(({ id, label }) => label !== defaultImage.label && jupyterImageIds.includes(id))
      .every(({ label }) => screen.getByText(label));

    // Act
    const pegasusImageOption = screen.getByText(pegasusImage.label);
    await user.click(pegasusImageOption);

    // Assert
    // Change event fired
    expect(mockOnSelect).lastCalledWith(
      expect.objectContaining({ url: pegasusImage.image, isCommunity: true, toolLabel: runtimeToolLabels.Jupyter }),
      false
    );

    // Act
    await user.click(inputElement);
    const customImageOption = screen.getByText('Custom Environment');
    await user.click(customImageOption);

    // Assert
    // Change event fired
    expect(mockOnSelect).lastCalledWith(undefined, true);
  }, 10000);

  it('loads RStudio tool images', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useComputeImages).mockReturnValue({
      ...defaultComputeImageStore,
      loadedState: {
        ...defaultComputeImageStore.loadedState,
        state: normalizedImages,
      },
    });

    // Act
    await act(async () => {
      render(
        h(GcpComputeImageSection, {
          ...defaultGcpComputeImageSectionProps,
          tool: runtimeToolLabels.RStudio,
          'aria-label': 'Select Environment',
          currentRuntime: {
            runtimeImages: [
              {
                imageType: runtimeToolLabels.Jupyter,
                imageUrl: defaultImage.image,
                timestamp: '2022-09-19T15:37:11.035465Z',
              },
              ...(defaultGcpComputeImageSectionProps.currentRuntime?.runtimeImages ?? []),
            ],
          },
        } as GcpComputeImageSectionProps)
      );
    });

    // Assert
    // Select element appears
    const inputElement = screen.getByLabelText('Select Environment');
    // Default image is default selection
    expect(mockOnSelect).lastCalledWith(
      expect.objectContaining({ url: defaultRImage.image, isRStudio: true, toolLabel: runtimeToolLabels.RStudio }),
      false
    );

    // Act
    await user.click(inputElement);

    // Assert
    // All images for the current tool appear as options
    ['COMMUNITY-MAINTAINED RSTUDIO ENVIRONMENTS (verified partners)', 'OTHER ENVIRONMENTS'].every((heading) =>
      screen.getByText(heading)
    );
    imageDocs
      .filter(({ id, label }) => label !== defaultRImage.label && rImageIds.includes(id))
      .every(({ label }) => screen.getByText(label));
  });
});
