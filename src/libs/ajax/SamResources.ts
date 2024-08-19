import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { Ajax } from 'src/libs/ajax';
import { appIdentifier, fetchSam } from 'src/libs/ajax/ajax-common';

type RequesterPaysProject = undefined | string;

export interface FullyQualifiedResourceId {
  resourceTypeName: string;
  resourceId: string;
}

export const SamResources = (signal?: AbortSignal) => ({
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

  getResourcePolicies: async (fqResourceId: FullyQualifiedResourceId): Promise<object> => {
    const res = await fetchSam(
      `api/admin/v1/resources/${fqResourceId.resourceTypeName}/${fqResourceId.resourceId}/policies`,
      _.mergeAll([authOpts(), appIdentifier])
    );
    return res.json();
  },

  getAuthDomains: async (fqResourceId: FullyQualifiedResourceId): Promise<string[]> => {
    return fetchSam(
      `api/resources/v2/${fqResourceId.resourceTypeName}/${fqResourceId.resourceId}/authDomain`,
      _.mergeAll([authOpts(), { signal }])
    ).then((r) => r.json());
  },
});

export type SamResourcesContract = ReturnType<typeof SamResources>;
