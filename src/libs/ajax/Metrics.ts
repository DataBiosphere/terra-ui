import { getDefaultProperties } from '@databiosphere/bard-client';
import _ from 'lodash/fp';
import { authOpts, fetchBard, jsonBody } from 'src/libs/ajax/ajax-common';
import { ensureAuthSettled } from 'src/libs/auth';
import { withErrorIgnoring } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { authStore, userStatus } from 'src/libs/state';
import { v4 as uuid } from 'uuid';

export const Metrics = (signal?: AbortSignal) => {
  const captureEventFn = async (event, details = {}) => {
    await ensureAuthSettled();
    const { isSignedIn, registrationStatus } = authStore.get(); // NOTE: This is intentionally read after ensureAuthSettled
    const isRegistered = isSignedIn && registrationStatus === userStatus.registeredWithTos;
    if (!isRegistered) {
      authStore.update(
        _.update('anonymousId', (id) => {
          return id || uuid();
        })
      );
    }
    const body = {
      event,
      properties: {
        ...details,
        // Users who have not registered are considered anonymous users. Send an anonymized distinct_id in that case; otherwise the user identity is captured via the auth token.
        distinct_id: isRegistered ? undefined : authStore.get().anonymousId,
        sessionId: authStore.get().sessionId,
        appId: 'Saturn',
        hostname: window.location.hostname,
        appPath: Nav.getCurrentRoute().name,
        ...getDefaultProperties(),
      },
    };

    return fetchBard(
      'api/event',
      _.mergeAll([isRegistered ? authOpts() : undefined, jsonBody(body), { signal, method: 'POST' }])
    );
  };
  return {
    captureEvent: withErrorIgnoring(captureEventFn) as unknown as typeof captureEventFn,

    syncProfile: withErrorIgnoring(() => {
      return fetchBard('api/syncProfile', _.merge(authOpts(), { signal, method: 'POST' }));
    }),

    identify: withErrorIgnoring((anonId) => {
      const body = { anonId };
      return fetchBard('api/identify', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
    }),
  };
};
