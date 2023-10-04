import { getDefaultProperties } from '@databiosphere/bard-client';
import _ from 'lodash/fp';
import { authOpts, fetchBard, jsonBody } from 'src/libs/ajax/ajax-common';
import { ensureAuthSettled } from 'src/libs/auth';
import { getConfig } from 'src/libs/config';
import { withErrorIgnoring } from 'src/libs/error';
import { MetricsEvent } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { authStore, getSessionId } from 'src/libs/state';
import { v4 as uuid } from 'uuid';

export const Metrics = (signal?: AbortSignal) => {
  const captureEventFn = async (event: MetricsEvent, details: Record<string, any> = {}): Promise<void> => {
    await ensureAuthSettled();
    const { signInStatus, registrationStatus } = authStore.get(); // NOTE: This is intentionally read after ensureAuthSettled
    const isRegistered = signInStatus === 'signedIn' && registrationStatus === 'registered';
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
        sessionId: getSessionId(),
        appId: 'Saturn',
        hostname: window.location.hostname,
        appPath: Nav.getCurrentRoute().name,
        appVersion: `https://github.com/DataBiosphere/terra-ui/commits/${getConfig().gitRevision}`,
        appVersionPublishDate: new Date(parseInt(getConfig().buildTimestamp, 10)).toLocaleString(),
        ...getDefaultProperties(),
      },
    };
    return fetchBard(
      'api/event',
      _.mergeAll([
        isRegistered ? authOpts() : undefined,
        {
          body: JSON.stringify(body, (key: string, value) =>
            // distinct_id is a mixpanel specific id and the value must not be null or this fetch will 400
            value === undefined && key !== 'distinct_id' ? null : value
          ),
          headers: { 'Content-Type': 'application/json' },
        },
        { signal, method: 'POST' },
      ])
    );
  };
  return {
    captureEvent: withErrorIgnoring(captureEventFn) as unknown as typeof captureEventFn,

    syncProfile: withErrorIgnoring(() => {
      return fetchBard('api/syncProfile', _.merge(authOpts(), { signal, method: 'POST' }));
    }) as () => Promise<void>,

    identify: withErrorIgnoring((anonId: string) => {
      const body = { anonId };
      return fetchBard('api/identify', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
    }) as (anonId: string) => Promise<void>,
  };
};
