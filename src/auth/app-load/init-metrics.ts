import { userCanNowUseTerra } from 'src/auth/app-load/init-auth';
import { Metrics } from 'src/libs/ajax/Metrics';
import { withErrorIgnoring } from 'src/libs/error';
import { AuthState, authStore, metricStore } from 'src/libs/state';

export const initializeAuthMetrics = () => {
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
