import React from 'react';
import { h } from 'react-hyperscript-helpers';
import { getImageUrl } from 'src/analysis/modal-utils';
import { GcpComputeImageSelect } from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpComputeImageSelect';
import { ComputeImage, ComputeImageStore, useComputeImages } from 'src/analysis/useComputeImages';
import { RuntimeToolLabel, runtimeTools } from 'src/analysis/utils/tool-utils';
import { spinnerOverlay } from 'src/components/common';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

export interface GcpComputeImageSectionProps {
  readonly setSelection: (image: ComputeImage | undefined, isCustomImage: boolean) => void;
  readonly tool: RuntimeToolLabel;
  readonly currentRuntime?: Pick<GetRuntimeItem, 'runtimeImages'>;
}

const customImageOptionUrl = 'CUSTOM_IMAGE_OPTION';

export const GcpComputeImageSection: React.FC<GcpComputeImageSectionProps> = (props: GcpComputeImageSectionProps) => {
  const { loadedState, refreshStore }: ComputeImageStore = useComputeImages();
  const [images, setImages] = useState<ComputeImage[]>([]);
  const [selectedComputeImageUrl, setSelectedComputeImageUrl] = useState<string>('');
  const { setSelection, tool, currentRuntime } = props;

  _.once(refreshStore());

  // on selection change
  useEffect(() => {
    const isCustom = selectedComputeImageUrl === customImageOptionUrl;
    const selectedComputeImage = images.find(({ image }) => image === selectedComputeImageUrl);
    setSelection(selectedComputeImage, isCustom);
  }, [setSelection, selectedComputeImageUrl, images]);

  // initialize on load
  useEffect(() => {
    const allImages: ComputeImage[] = loadedState.state ?? [];
    const imagesForTool = allImages.filter((image) => runtimeTools[tool].imageIds.includes(image.id));

    const currentImageUrl: string = getImageUrl(currentRuntime) ?? '';
    const currentImage: ComputeImage = allImages.find(({ image }) => image === currentImageUrl);

    setImages(imagesForTool);

    if (imagesForTool.includes(currentImage)) {
      setSelectedComputeImageUrl(currentImageUrl);
    } else if (currentImage) {
      const defaultImageId: string = runtimeTools[tool].defaultImageId;
      const defaultImageUrl: string = allImages.find(({ id }) => id === defaultImageId)?.image ?? '';
      setSelectedComputeImageUrl(defaultImageUrl);
    } else {
      setSelectedComputeImageUrl(customImageOptionUrl);
    }
  }, [loadedState, currentRuntime, tool]);

  return h(Fragment, [
    loadedState.status === 'Ready'
      ? h(GcpComputeImageSelect, {
          selectedComputeImageUrl,
          setSelectedComputeImageUrl,
          images,
          hasCustomOption: tool === runtimeToolLabels.Jupyter || tool === runtimeToolLabels.RStudio,
          customOptionUrl: customImageOptionUrl,
        })
      : spinnerOverlay,
  ]);
};
