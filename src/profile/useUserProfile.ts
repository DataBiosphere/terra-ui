import { useCallback, useEffect, useState } from 'react';
import { refreshTerraProfile } from 'src/auth/auth';
import { makeSetUserProfileRequest, User } from 'src/libs/ajax/User';
import { reportError } from 'src/libs/error';
import { useStore } from 'src/libs/react-utils';
import { authStore, TerraUserProfile } from 'src/libs/state';

/**
 * Custom LoadedState because we always have a value for the profile from the global state.
 */
interface ProfileLoadedState {
  /** Status of a request to refresh or update the profile. */
  status: 'Loading' | 'Ready' | 'Error';

  /** The user's profile. */
  state: TerraUserProfile;
}

export interface UseUserProfileResult {
  /** The user's profile and its refresh status. */
  profile: ProfileLoadedState;

  /** Refresh the user's profile. */
  refresh: () => Promise<void>;

  /** Update the user's profile. */
  update: (profile: TerraUserProfile) => Promise<void>;
}

export const useUserProfile = (): UseUserProfileResult => {
  const { profile } = useStore(authStore);

  const [status, setStatus] = useState<'Loading' | 'Ready' | 'Error'>('Loading');

  const refresh = useCallback(async () => {
    setStatus('Loading');
    try {
      await refreshTerraProfile();
      setStatus('Ready');
    } catch (err) {
      reportError('Error loading profile', err);
      setStatus('Error');
    }
  }, []);

  const update = useCallback(async (updatedProfile: TerraUserProfile): Promise<void> => {
    setStatus('Loading');
    try {
      await User().profile.set(makeSetUserProfileRequest(updatedProfile));
      await refreshTerraProfile();
      setStatus('Ready');
    } catch (err) {
      reportError('Error saving profile', err);
      setStatus('Error');
    }
  }, []);

  // exhaustive-deps is disabled because this should run only once, when the hook mounts.
  // It should not re-run in the event refresh is recreated.
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    profile: { status, state: profile },
    refresh,
    update,
  };
};
