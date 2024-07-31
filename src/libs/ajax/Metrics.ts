import { getDefaultProperties } from '@databiosphere/bard-client';
import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { ensureAuthSettled } from 'src/auth/auth';
import { authOpts } from 'src/auth/auth-options';
import { fetchBard } from 'src/libs/ajax/fetch/fetchBard';
import { getConfig } from 'src/libs/config';
import { withErrorIgnoring } from 'src/libs/error';
import { MetricsEventName } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { authStore, getSessionId, getTerraUser, getTerraUserProfile, MetricState, metricStore } from 'src/libs/state';
import { v4 as uuid } from 'uuid';

export const Metrics = (signal?: AbortSignal) => {
  const captureEventFn = async (
    event: MetricsEventName,
    details: Record<string, any> = {},
    refreshAppcues = true
  ): Promise<void> => {
    await ensureAuthSettled();
    const metricState: MetricState = metricStore.get();
    const { signInStatus } = authStore.get();
    const isRegistered = signInStatus === 'userLoaded';
    // If a user has not logged in, or has logged in but has not registered, ensure an anonymous ID has been generated.
    // The anonymous ID is used to associate events triggered by the anonymous user.
    // If the anonymous user registers during this session, the anonymous ID will be linked to their actual user ID.
    if (!isRegistered && metricState.anonymousId === undefined) {
      metricStore.update((oldState: MetricState) => ({
        ...oldState,
        anonymousId: uuid(),
      }));
    }

    // Send event to Appcues and refresh Appcues state
    window.Appcues?.track(event);
    if (refreshAppcues) {
      window.Appcues?.page();
    }

    const { buildTimestamp, gitRevision, terraDeploymentEnv } = getConfig();
    const signedInProps =
      isRegistered || signInStatus === 'authenticated'
        ? {
            authProvider: getTerraUser().idp,
            userInstitute: getTerraUserProfile().institute,
            userTitle: getTerraUserProfile().title,
            userDepartment: getTerraUserProfile().department,
          }
        : {};
    const body = {
      event,
      properties: {
        ...details,
        ...signedInProps,
        appId: 'Saturn',
        appPath: Nav.getCurrentRoute().name,
        appVersion: gitRevision,
        appVersionBuildTime: new Date(buildTimestamp).toISOString(),
        // Users who have not registered are considered anonymous users. Send an anonymized distinct_id in that case; otherwise the user identity is captured via the auth token.
        distinct_id: isRegistered ? undefined : metricStore.get().anonymousId,
        env: terraDeploymentEnv,
        hostname: window.location.hostname,
        sessionId: getSessionId(),
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

export type MetricsContract = ReturnType<typeof Metrics>;
