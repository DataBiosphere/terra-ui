import { loadTerraUser } from 'src/auth/auth';
import { isNowSignedIn } from 'src/auth/signin/sign-in';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { AuthState, authStore } from 'src/libs/state';

const enforceRollingAcceptanceWindow = (state: AuthState) => {
  if (state.termsOfService.isCurrentVersion === false) {
    // The user could theoretically navigate away from the Terms of Service page during the Rolling Acceptance Window.
    // This is not a concern, since the user will be denied access to the system once the Rolling Acceptance Window ends.
    // This is really just a convenience to make sure the user is not disrupted once the Rolling Acceptance Window ends.
    Nav.goToPath('terms-of-service');
  }
};

authStore.subscribe(
  withErrorReporting('Error loading user')(async (state: AuthState, oldState: AuthState) => {
    if (isNowSignedIn(oldState, state)) {
      await loadTerraUser();
      if (state.userJustSignedIn) {
        const loadedState = authStore.get();
        enforceRollingAcceptanceWindow(loadedState);
        authStore.update((state: AuthState) => ({ ...state, userJustSignedIn: false }));
      }
    }
  })
);
