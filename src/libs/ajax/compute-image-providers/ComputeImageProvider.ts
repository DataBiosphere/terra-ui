import _ from 'lodash/fp';
import { ComputeImage } from 'src/analysis/useComputeImages';
import { terraSupportedRuntimeImageIds } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';

export interface ComputeImage {
  id: string;
  image: string;
  isCommunity?: boolean;
  isRStudio?: boolean;
  label: string;
  packages: string;
  requiresSpark: boolean;
  updated: string;
  version: string;
}

export interface ComputeImageProviderContract {
  listImages: (googleProject: string, signal?: AbortSignal) => Promise<ComputeImage[]>;
}

export const ComputeImageProvider: ComputeImageProviderContract = {
  listImages: async (googleProject: string, signal?: AbortSignal): Promise<ComputeImage[]> => {
    const fetchedImages: ComputeImage[] = await Ajax(signal)
      .Buckets.getObjectPreview(
        googleProject,
        getConfig().terraDockerImageBucket,
        getConfig().terraDockerVersionsFile,
        true
      )
      .then((r) => r.json());
    const supportedImages = _.flow(
      _.filter(({ id }) => terraSupportedRuntimeImageIds.includes(id)),
      _.map(({ image }) => image)
    )(fetchedImages);
    return supportedImages;
  },
};
