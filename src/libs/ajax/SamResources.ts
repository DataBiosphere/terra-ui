import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import { appIdentifier, authOpts, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common';

type RequesterPaysProject = undefined | string;

export const SamResources = (signal: AbortSignal) => ({
  leave: (samResourceType, samResourceId): Promise<void> =>
    fetchSam(
      `api/resources/v2/${samResourceType}/${samResourceId}/leave`,
      _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])
    ),
  getRequesterPaysSignedUrl: async (
    gsPath: string,
    requesterPaysProject: RequesterPaysProject = undefined
  ): Promise<string> => {
    const res = await fetchSam(
      'api/google/v1/user/signedUrlForBlob',
      _.mergeAll([jsonBody({ gsPath, requesterPaysProject }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },

  getSignedUrl: async (
    bucket: string,
    object: string,
    requesterPaysProject: RequesterPaysProject = undefined
  ): Promise<string> => {
    return Ajax(signal).SamResources.getRequesterPaysSignedUrl(`gs://${bucket}/${object}`, requesterPaysProject);
  },
});
