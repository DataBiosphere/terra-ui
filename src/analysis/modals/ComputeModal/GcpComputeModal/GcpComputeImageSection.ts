import _ from 'lodash/fp';
import React, { Fragment, useEffect, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { GcpComputeImageSelect } from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpComputeImageSelect';
import { ComputeImage, ComputeImageStore, useComputeImages } from 'src/analysis/useComputeImages';
import { getImageUrlFromRuntime } from 'src/analysis/utils/runtime-utils';
import { RuntimeToolLabel, runtimeToolLabels, runtimeTools } from 'src/analysis/utils/tool-utils';
import { spinnerOverlay } from 'src/components/common';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

export interface GcpComputeImageSectionProps {
  readonly onSelect: (image: ComputeImage | undefined, isCustomImage: boolean) => void;
  readonly tool: RuntimeToolLabel;
  readonly currentRuntime?: Pick<GetRuntimeItem, 'runtimeImages'>;
}

const customImageOptionUrl = 'CUSTOM_IMAGE_OPTION';

export const GcpComputeImageSection: React.FC<GcpComputeImageSectionProps> = (props: GcpComputeImageSectionProps) => {
  const { loadedState, refresh }: ComputeImageStore = useComputeImages();
  const [images, setImages] = useState<ComputeImage[]>([]);
  const [selectedComputeImageUrl, setSelectedComputeImageUrl] = useState<string>('');
  const { onSelect, tool, currentRuntime } = props;

  // on selection change
  useEffect(() => {
    const isCustom = selectedComputeImageUrl === customImageOptionUrl;
    const selectedComputeImage = images.find(({ url }) => url === selectedComputeImageUrl);
    onSelect(selectedComputeImage, isCustom);
  }, [onSelect, selectedComputeImageUrl, images]);

  // initialize on load
  useEffect(() => {
    if (loadedState.status === 'Ready') {
      const allImages = loadedState.state;
      setImages(allImages);

      const currentTool = runtimeTools[tool];
      const imagesForTool = allImages.filter((image) => currentTool.imageIds.includes(image.id));

      const currentImageUrl: string = getImageUrlFromRuntime(currentRuntime) ?? '';
      const currentImage: ComputeImage | undefined = allImages.find(({ url }) => url === currentImageUrl);

      // Determine initial selection.
      if (currentImageUrl && !currentImage) {
        // 1. if our runtime has an image URL, but it doesn't match any of the base images -> custom
        setSelectedComputeImageUrl(customImageOptionUrl);
      } else if (currentImage && imagesForTool.includes(currentImage)) {
        // 2. if our runtime's image matches a base image in the visible tool (Jupyter | RStudio) -> that image
        setSelectedComputeImageUrl(currentImageUrl);
      } else {
        // 3. if there is no image URL on our runtime, or if the image is for another tool -> default image for the visible tool
        const defaultImageId: string = currentTool.defaultImageId;
        const defaultImageUrl: string = allImages.find(({ id }) => id === defaultImageId)?.url ?? '';
        setSelectedComputeImageUrl(defaultImageUrl);
      }
    }
  }, [loadedState, currentRuntime, tool]);

  useEffect(() => {
    _.once(refresh);
  });

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
