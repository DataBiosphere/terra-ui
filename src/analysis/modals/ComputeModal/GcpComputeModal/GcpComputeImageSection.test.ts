import { LoadedState } from '@terra-ui-packages/core-utils';
import { act, render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import {
  defaultGoogleWorkspace,
  defaultImage,
  generateTestGoogleRuntime,
  imageDocs,
} from 'src/analysis/_testData/testData';
import {
  GcpComputeImageSection,
  GcpComputeImageSectionProps,
} from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpComputeImageSection';
import { ComputeImage, useComputeImages } from 'src/analysis/useComputeImages';
import { runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn } from 'src/testing/test-utils';

type UseComputeImagesExport = typeof import('src/analysis/useComputeImages');
jest.mock(
  'src/analysis/useComputeImages',
  (): UseComputeImagesExport => ({
    ...jest.requireActual('src/analysis/useAnalysisFiles'),
    useComputeImages: jest.fn(),
  })
);

jest.mock('src/libs/ajax');

const defaultComputeImageStore = {
  refresh: () => Promise.resolve(),
  loadedState: { status: 'Ready', state: [] as ComputeImage[] } as LoadedState<ComputeImage[], unknown>,
};

const defaultGcpComputeImageSectionProps: GcpComputeImageSectionProps = {
  onSelect: jest.fn(),
  tool: runtimeToolLabels.Jupyter,
  currentRuntime: {
    runtimeImages: generateTestGoogleRuntime().runtimeImages,
  },
};

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxOuterWorkspacesContract = AjaxContract['Workspaces'];
type AjaxInnerWorkspacesContract = AjaxContract['Workspaces']['workspace'];
type AjaxBucketsContract = AjaxContract['Buckets'];

const mockBucketsObjectPreview = jest.fn();
asMockedFn(mockBucketsObjectPreview as AjaxBucketsContract).mockResolvedValue(imageDocs);
const mockBuckets: Partial<AjaxBucketsContract> = {
  getObjectPreview: mockBucketsObjectPreview,
};

const mockInnerWorkspaces = jest.fn().mockReturnValue({
  googleProject: defaultGoogleWorkspace.googleProject,
  cloudPlatform: defaultGoogleWorkspace.cloudPlatform,
}) as AjaxInnerWorkspacesContract;
const mockOuterWorkspaces: Partial<AjaxOuterWorkspacesContract> = {
  workspace: mockInnerWorkspaces,
};

const mockAjax: Partial<AjaxContract> = {
  Workspaces: mockOuterWorkspaces as AjaxOuterWorkspacesContract,
  Buckets: mockBuckets as AjaxBucketsContract,
};

describe('GcpComputeImageSection', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useComputeImages).mockReturnValue(defaultComputeImageStore);
    asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);
  });

  it('loads properly', async () => {
    // Act
    await act(async () => {
      // eslint-disable-line require-await
      render(h(GcpComputeImageSection, defaultGcpComputeImageSectionProps));
    });

    // Assert
    const inputElement = screen.getByLabelText('Select Environment');
    // todo this won't find our label
    screen.getByText(defaultImage.label) === inputElement;

    await user.click(element);
    imageDocs.every(({ label }) => screen.getByText(label));
  });
});
