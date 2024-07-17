import { userCanNowUseTerra } from 'src/auth/app-load/init-auth';
import { Metrics } from 'src/libs/ajax/Metrics';
import { withErrorIgnoring } from 'src/libs/error';
import { captureAppcuesEvent } from 'src/libs/events';
import { AuthState, authStore, metricStore, userStore } from 'src/libs/state';

export const initializeAuthMetrics = () => {
  authStore.subscribe(
    withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
      if (!oldState.termsOfService.permitsSystemUsage && state.termsOfService.permitsSystemUsage) {
        if (window.Appcues) {
          const { terraUser, samUser } = userStore.get();
          // for Sam users who have been invited but not yet registered
          // and for a set of users who didn't have registration dates to migrate into Sam
          // registeredAt may be null in the Sam db. In that case, default to epoch (1970) instead
          // so the survey won't be immediately displayed
          const dateJoined = samUser.registeredAt ? samUser.registeredAt.getTime() : new Date('1970-01-01').getTime();
          window.Appcues.identify(terraUser.id!, {
            dateJoined,
          });
          window.Appcues.on('all', captureAppcuesEvent);
        }
      }
    })
  );

  authStore.subscribe(
    withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
      if (userCanNowUseTerra(oldState, state)) {
        await Metrics().syncProfile();
      }
    })
  );

  authStore.subscribe(
    withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
      if (userCanNowUseTerra(oldState, state)) {
        const { anonymousId } = metricStore.get();
        if (anonymousId) {
          return await Metrics().identify(anonymousId);
        }
      }
    })
  );
};
