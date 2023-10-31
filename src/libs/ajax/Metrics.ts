import { getDefaultProperties } from '@databiosphere/bard-client';
import _ from 'lodash/fp';
import { ensureAuthSettled } from 'src/auth/auth';
import { authOpts, fetchBard, jsonBody } from 'src/libs/ajax/ajax-common';
import { getConfig } from 'src/libs/config';
import { withErrorIgnoring } from 'src/libs/error';
import { MetricsEventName } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { AuthState, authStore, getSessionId } from 'src/libs/state';
import { v4 as uuid } from 'uuid';

export const Metrics = (signal?: AbortSignal) => {
  const captureEventFn = async (event: MetricsEventName, details: Record<string, any> = {}): Promise<void> => {
    await ensureAuthSettled();
    const state: AuthState = authStore.get();
    const isRegistered = state.registrationStatus === 'registered';
    // If a user has not logged in, or has logged in but has not registered, ensure an anonymous ID has been generated.
    // The anonymous ID is used to associate events triggered by the anonymous user.
    // If the anonymous user registers during this session, the anonymous ID will be linked to their actual user ID.
    if (!isRegistered && state.anonymousId === undefined) {
      authStore.update((oldState: AuthState) => ({
        ...oldState,
        anonymousId: uuid(),
      }));
    }

    // Send event to Appcues and refresh Appcues state
    if (details.pushToAppcues !== false) {
      window.Appcues?.track(event);
      window.Appcues?.page();
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
        appVersion: getConfig().gitRevision,
        appVersionBuildTime: new Date(getConfig().buildTimestamp).toISOString(),
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
