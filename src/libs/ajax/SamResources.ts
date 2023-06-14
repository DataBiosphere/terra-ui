import _ from 'lodash/fp';
import { appIdentifier, authOpts, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common';

export const SamResources = (signal: AbortSignal) => ({
  leave: (samResourceType, samResourceId): Promise<void> =>
    fetchSam(
      `api/resources/v2/${samResourceType}/${samResourceId}/leave`,
      _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])
    ),

  getSignedUrl: async (bucket: string, object: string, project: string, requesterPays = false): Promise<string> => {
    const res = await fetchSam(
      `api/google/v1/user/petServiceAccount/${project}/signedUrlForBlob`,
      _.mergeAll([
        jsonBody({ bucketName: bucket, blobName: object, requesterPays }),
        authOpts(),
        appIdentifier,
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },
});
