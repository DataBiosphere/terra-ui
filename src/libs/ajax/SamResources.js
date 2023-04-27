import _ from 'lodash/fp'
import { appIdentifier, authOpts, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common'


export const SamResources = () => ({
  leave: (samResourceType, samResourceId) => fetchSam(`api/resources/v2/${samResourceType}/${samResourceId}/leave`, _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])),

  getSignedUrl: (bucket, object, project) => fetchSam(`api/google/v1/user/petServiceAccount/${project}/signedUrlForBlob`,
    _.mergeAll([jsonBody({ bucketName: bucket, blobName: object }), authOpts(), appIdentifier, { method: 'POST' }]))
})
