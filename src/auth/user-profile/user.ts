import { SamUserAttributes, User } from 'src/libs/ajax/User';
import { clearNotification, sessionExpirationProps } from 'src/libs/notifications';
import { AuthState, authStore, TerraUserProfile, TerraUserState, userStore } from 'src/libs/state';

export const refreshTerraProfile = async () => {
  const profile: TerraUserProfile = await User().profile.get();
  userStore.update((state: TerraUserState) => ({ ...state, profile }));
};

export const refreshSamUserAttributes = async (): Promise<void> => {
  const terraUserAttributes: SamUserAttributes = await User().getUserAttributes();
  userStore.update((state: TerraUserState) => ({ ...state, terraUserAttributes }));
};

export const loadTerraUser = async (): Promise<void> => {
  try {
    const signInStatus = 'userLoaded';
    const getProfile = User().profile.get();
    const getCombinedState = User().getSamUserCombinedState();
    const [profile, terraUserCombinedState] = await Promise.all([getProfile, getCombinedState]);
    const { terraUserAttributes, enterpriseFeatures, samUser, terraUserAllowances, termsOfService, favoriteResources } =
      terraUserCombinedState;
    clearNotification(sessionExpirationProps.id);
    userStore.update((state: TerraUserState) => ({
      ...state,
      profile,
      terraUserAttributes,
      enterpriseFeatures,
      samUser,
      favoriteResources,
    }));
    authStore.update((state: AuthState) => ({
      ...state,
      signInStatus,
      terraUserAllowances,
      termsOfService,
    }));
  } catch (error: unknown) {
    if ((error as Response).status !== 403) {
      throw error;
    }
    // If the call to User endpoints fail with a 403, it means the user is not registered.
    // Update the AuthStore state to forward them to the registration page.
    const signInStatus = 'unregistered';
    authStore.update((state: AuthState) => ({ ...state, signInStatus }));
  }
};
