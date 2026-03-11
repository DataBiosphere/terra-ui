import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchDrsHub } from 'src/libs/ajax/ajax-common';
import { appIdentifier } from 'src/libs/ajax/fetch/fetch-core';

export const DrsUriResolver = (signal?: AbortSignal) => ({
  // DRSHub now gets a signed URL instead of Martha
  getSignedUrl: async ({ bucket, object, dataObjectUri, googleProject }) => {
    const res = await fetchDrsHub(
      'api/v4/gcs/getSignedUrl',
      _.mergeAll([
        jsonBody({ bucket, object, dataObjectUri, googleProject }),
        authOpts(),
        appIdentifier,
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },

  getDataObjectMetadata: async (url, fields, options?: { userProject?: string }) => {
    const headers = _.merge({}, authOpts().headers, options?.userProject && { 'x-user-project': options.userProject });
    const res = await fetchDrsHub(
      'api/v4/drs/resolve',
      _.mergeAll([jsonBody({ url, fields }), { headers }, appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },
});

export type DrsUriResolverAjaxContract = ReturnType<typeof DrsUriResolver>;
