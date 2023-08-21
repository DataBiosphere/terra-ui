import React from 'react';
import { h } from 'react-hyperscript-helpers';
import { getImageUrl } from 'src/analysis/modal-utils';
import { ComputeImage, ComputeImageStore, useComputeImages } from 'src/analysis/useComputeImages';
import { RuntimeToolLabel, runtimeTools } from 'src/analysis/utils/tool-utils';
import { spinnerOverlay } from 'src/components/common';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

export const defaultImageId = 'terra-jupyter-gatk';

export interface GcpComputeImageSelectProps {
  readonly setSelectedImage: (image: ComputeImage | undefined) => void;
  readonly setIsCustomSelectedImage: (value: boolean) => void;
  readonly tool: RuntimeToolLabel;
  readonly currentRuntime?: GetRuntimeItem;
}

const customImageUrl = 'CUSTOM_IMAGE_URL';

export const GcpComputeImageSelect: React.FC<GcpComputeImageSelectProps> = (props: GcpComputeImageSelectProps) => {
  const { loadedState, refreshStore }: ComputeImageStore = useComputeImages();
  const [images, setImages] = useState<ComputeImage[]>([]);
  const [selectedComputeImageUrl, setSelectedComputeImageUrl] = useState<string>('');

  _.once(refreshStore());

  const getImageOptions = (predicate) =>
    _.flow(
      _.filter(predicate),
      _.map(({ label, image }) => ({ label, value: image }))
    )(images);

  const renderImageSelect = () => {
    const hasCustomImageOption = tool === runtimeToolLabels.Jupyter || tool === runtimeToolLabels.RStudio;

    return h(GroupedSelect, {
      'aria-label': 'Select Environment',
      maxMenuHeight: '25rem',
      value: selectedComputeImageUrl,
      onChange: ({ value }) => {
        setSelectedComputeImageUrl(value);
      },
      isSearchable: true,
      isClearable: false,
      options: [
        {
          label: 'TERRA-MAINTAINED JUPYTER ENVIRONMENTS',
          options: getImageOptions(({ isCommunity, isRStudio }) => !isCommunity && !isRStudio),
        },
        {
          label: 'COMMUNITY-MAINTAINED JUPYTER ENVIRONMENTS (verified partners)',
          options: getImageOptions(_.get(['isCommunity'])),
        },
        {
          label: 'COMMUNITY-MAINTAINED RSTUDIO ENVIRONMENTS (verified partners)',
          options: getImageOptions(_.get(['isRStudio'])),
        },
        ...(hasCustomImageOption
          ? [
              {
                label: 'OTHER ENVIRONMENTS',
                options: [{ label: 'Custom Environment', value: customImageUrl }],
              },
            ]
          : []),
      ],
    });
  };

  useEffect(() => {
    const isCustom = selectedComputeImageUrl === customImageUrl;
    setIsCustomSelectedImage(isCustom);
    if (isCustom) {
      setSelectedImage(undefined);
    } else {
      const selectedComputeImage = images.find(({ image }) => image === selectedComputeImageUrl);
      setSelectedImage(selectedComputeImage);
    }
  }, [selectedComputeImageUrl, images]);

  // initialize on load
  useEffect(() => {
    const allImages: ComputeImage[] = loadedState.state ?? [];

    const defaultImageUrl: string = allImages.find(({ id }) => id === defaultImageId)?.image ?? '';

    const currentImageUrl: string = getImageUrl(currentRuntime) ?? defaultImageUrl;
    const currentImage: ComputeImage = allImages.find(({ image }) => image === currentImageUrl);

    const defaultImageIdForTool: string = runtimeTools[tool].defaultImageId;
    const defaultImageUrlForTool: string = allImages.find(({ id }) => id === defaultImageIdForTool)?.image ?? '';

    const imagesForTool = allImages.filter((image) => runtimeTools[tool].imageIds.includes(image.id));

    setImages(imagesForTool);

    if (imagesForTool.includes(currentImage)) {
      setSelectedComputeImageUrl(currentImageUrl);
    } else if (currentImage) {
      setSelectedComputeImageUrl(defaultImageUrlForTool);
    } else {
      setSelectedComputeImageUrl(customImageUrl);
    }
  }, [loadedState]);

  return h(Fragment, [loadedState.status === 'Ready' ? renderImageSelect() : spinnerOverlay]);
};
