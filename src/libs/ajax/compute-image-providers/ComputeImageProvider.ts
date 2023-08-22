import { ComputeImage } from 'src/analysis/useComputeImages';
import { terraSupportedRuntimeImageIds } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';

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

        // TODO https://github.com/DataBiosphere/terra-ui/pull/4136#discussion_r1301733112
        // This conversion to json should be done in the Ajax layer in GoogleStorage.ts getObjectPreview method.... which is what the getObject method right next to it is doing.
        // Looking at usages of getObjectPreview it's kinda ugly that it burdens the caller to decide if .text(), .json() or .blob() is the right thing to call on the response.... would be much better to resolve this within the getObjectPreview method and have the appropriate Promise return type there even if its a union. Also, if text() is the error case, then it should get cleaned up in getObjectPreview and thrown as a proper Error so that consumers of the method have normalized expectations.
      )
      .then((r) => r.json());

    const isImageSupported = ({ id }): boolean => terraSupportedRuntimeImageIds.includes(id);
    const supportedImages: ComputeImage[] = fetchedImages.filter(isImageSupported);
    return supportedImages;
  },
};
