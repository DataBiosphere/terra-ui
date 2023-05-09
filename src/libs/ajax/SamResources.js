import _ from 'lodash/fp';
import { appIdentifier, authOpts, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common';

export const SamResources = (signal) => ({
  leave: (samResourceType, samResourceId) =>
    fetchSam(`api/resources/v2/${samResourceType}/${samResourceId}/leave`, _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])),

  getSignedUrl: async (bucket, object, project) => {
    const res = await fetchSam(
      `api/google/v1/user/petServiceAccount/${project}/signedUrlForBlob`,
      _.mergeAll([jsonBody({ bucketName: bucket, blobName: object }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },
});
