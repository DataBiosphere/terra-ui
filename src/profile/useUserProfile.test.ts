import { abandonedPromise } from '@terra-ui-packages/core-utils';
import { act } from '@testing-library/react';
import _ from 'lodash/fp';
import { refreshTerraProfile } from 'src/auth/user-profile/user';
import { User } from 'src/libs/ajax/User';
import { reportError } from 'src/libs/error';
import { TerraUserProfile, userStore } from 'src/libs/state';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';

import { useUserProfile } from './useUserProfile';

type UserExports = typeof import('src/libs/ajax/User');
jest.mock('src/libs/ajax/User', (): UserExports => {
  return {
    ...jest.requireActual<UserExports>('src/libs/ajax/User'),
    User: jest.fn(),
  };
});

jest.mock('src/auth/user-profile/user');

type SignOutExports = typeof import('src/auth/signout/sign-out');
jest.mock(
  'src/auth/signout/sign-out',
  (): Partial<SignOutExports> => ({
    signOut: jest.fn(),
    userSignedOut: jest.fn(),
  })
);

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  return {
    ...jest.requireActual<ErrorExports>('src/libs/error'),
    reportError: jest.fn(),
  };
});

type UserContract = ReturnType<typeof User>;

const mockProfile: TerraUserProfile = {
  firstName: 'Test',
  lastName: 'User',

  // email: 'user@example.com',
  contactEmail: '',

  institute: '',
  title: '',
  department: '',

  programLocationCity: '',
  programLocationState: '',
  programLocationCountry: '',

  researchArea: '',
  interestInTerra: undefined,
};

describe('useUserProfile', () => {
  beforeEach(() => {
    userStore.update((state) => {
      return {
        ...state,
        profile: mockProfile,
      };
    });
  });

  it('returns user profile from global auth store', async () => {
    // Act
    const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());
    const initialResult = hookReturnRef.current;

    // Any change to the auth store should cause the hook to rerender.
    const updatedProfile = { ...mockProfile, firstName: 'Test' };
    act(() =>
      userStore.update((state) => {
        return {
          ...state,
          profile: updatedProfile,
        };
      })
    );
    const resultAfterUpdate = hookReturnRef.current;

    // Assert
    expect(initialResult.profile.state).toEqual(mockProfile);
    expect(resultAfterUpdate.profile.state).toEqual(updatedProfile);
  });

  describe('refreshing the profile', () => {
    it('refreshes the profile when mounted', async () => {
      // Act
      await renderHookInAct(() => useUserProfile());

      // Assert
      expect(refreshTerraProfile).toHaveBeenCalled();
    });

    it('returns a function to refresh the profile', async () => {
      // Arrange
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Clear the mock after the hook's initial/automatic refresh.
      asMockedFn(refreshTerraProfile).mockReset();
      expect(refreshTerraProfile).not.toHaveBeenCalled();

      // Act
      await act(() => hookReturnRef.current.refresh());

      // Assert
      expect(refreshTerraProfile).toHaveBeenCalled();
    });

    it('returns loading status while profile is loading', async () => {
      // Arrange
      asMockedFn(refreshTerraProfile).mockReturnValue(abandonedPromise());

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Loading');
    });

    it('returns ready status after profile has loaded', async () => {
      // Arrange
      asMockedFn(refreshTerraProfile).mockResolvedValue();

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Ready');
    });

    it('returns error status if profile refresh fails', async () => {
      // Arrange
      asMockedFn(refreshTerraProfile).mockRejectedValue(new Error('Something went wrong'));

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Error');
    });

    it('returns reports error if profile refresh fails', async () => {
      // Arrange
      asMockedFn(refreshTerraProfile).mockRejectedValue(new Error('Something went wrong'));

      // Act
      await renderHookInAct(() => useUserProfile());

      // Assert
      expect(reportError).toHaveBeenCalledWith('Error loading profile', new Error('Something went wrong'));
    });
  });

  describe('updating the profile', () => {
    let updateProfile;

    beforeEach(() => {
      asMockedFn(refreshTerraProfile).mockReturnValue(Promise.resolve());

      updateProfile = jest.fn().mockReturnValue(abandonedPromise());
      asMockedFn(User).mockImplementation(() => {
        return {
          profile: {
            update: updateProfile,
          },
        } as unknown as UserContract;
      });
    });

    const updatedProfile: TerraUserProfile = {
      ...mockProfile,
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('returns a function to update the profile', async () => {
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Act
      act(() => {
        hookReturnRef.current.update(updatedProfile);
      });

      // Assert
      // Not all profile fields are updated via this request.
      expect(updateProfile).toHaveBeenCalledWith(_.omit(['email', 'interestInTerra'], updatedProfile));
    });

    it('returns loading status while profile is updating', async () => {
      // Arrange
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Act
      act(() => {
        hookReturnRef.current.update(updatedProfile);
      });

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Loading');
    });

    it('refreshes profile after updating profile', async () => {
      // Arrange
      updateProfile.mockReturnValue(Promise.resolve());
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Reset mock after initial refresh.
      asMockedFn(refreshTerraProfile).mockReset();
      expect(refreshTerraProfile).not.toHaveBeenCalled();

      // Act
      await act(() => hookReturnRef.current.update(updatedProfile));

      // Assert
      expect(refreshTerraProfile).toHaveBeenCalled();
    });

    it('returns ready status after profile has updated and refreshed', async () => {
      // Arrange
      updateProfile.mockReturnValue(Promise.resolve());

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Ready');
    });

    it('returns error status if profile update fails', async () => {
      // Arrange
      asMockedFn(updateProfile).mockRejectedValue(new Error('Something went wrong'));

      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Act
      await act(() => hookReturnRef.current.update(updatedProfile));

      // Assert
      expect(hookReturnRef.current.profile.status).toBe('Error');
    });

    it('returns reports error if profile update fails', async () => {
      // Arrange
      asMockedFn(updateProfile).mockRejectedValue(new Error('Something went wrong'));

      const { result: hookReturnRef } = await renderHookInAct(() => useUserProfile());

      // Act
      await act(() => hookReturnRef.current.update(updatedProfile));

      // Assert
      expect(reportError).toHaveBeenCalledWith('Error saving profile', new Error('Something went wrong'));
    });
  });
});
