import { DeepPartial } from '@terra-ui-packages/core-utils';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { signOut } from 'src/auth/auth-events/logout';
import { OidcUser, removeUserFromLocalState } from 'src/auth/oidc-broker';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import { notify, sessionTimeoutProps } from 'src/libs/notifications';
import { authStore, azureCookieReadyStore, cookieReadyStore, metricStore, oidcStore, userStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/auth/oidc-broker');

jest.mock('src/libs/ajax');

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

type NotificationExports = typeof import('src/libs/notifications');
jest.mock(
  'src/libs/notifications',
  (): NotificationExports => ({
    ...jest.requireActual('src/libs/notifications'),
    notify: jest.fn(),
  })
);

describe('logout', () => {
  describe('metrics', () => {
    it('sends sign out metrics', async () => {
      // Arrange
      const captureEventFn = jest.fn();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: {
              captureEvent: captureEventFn,
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );

      // Act
      signOut();
      // Assert
      expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.unspecified, expect.any(Object));
    });
    it('sends sign out metrics with a specified event', async () => {
      // Arrange
      const captureEventFn = jest.fn();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: {
              captureEvent: captureEventFn,
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );

      // Act
      signOut('idleStatusMonitor');
      // Assert
      expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.idleStatusMonitor, expect.any(Object));
    });
  });
  describe('notifications', () => {
    it('displays a session expired notification for an expired refresh token', () => {
      // Arrange
      const notifyFn = jest.fn();
      asMockedFn(notify).mockImplementation(notifyFn);

      // Act
      signOut('expiredRefreshToken');
      // Assert
      expect(notifyFn).toHaveBeenCalledWith('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
    });
    it('displays a session expired notification for an error refreshing tokens', () => {
      // Arrange
      const notifyFn = jest.fn();
      asMockedFn(notify).mockImplementation(notifyFn);

      // Act
      signOut('errorRefreshingAuthToken');
      // Assert
      expect(notifyFn).toHaveBeenCalledWith('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
    });
  });
  describe('state', () => {
    it('removes the user from local state', () => {
      // Arrange
      const userSignedOutFn = jest.fn();
      asMockedFn(removeUserFromLocalState).mockImplementation(userSignedOutFn);
      // Act
      signOut();
      // Assert
      expect(userSignedOutFn).toHaveBeenCalled();
    });
    it('clears stores', () => {
      // Arrange
      cookieReadyStore.update(() => true);
      azureCookieReadyStore.update((state) => ({ ...state, readyForRuntime: true }));
      authStore.update((state) => ({ ...state, cookiesAccepted: true, nihStatusLoaded: true }));
      oidcStore.update((state) => ({ ...state, user: {} as OidcUser }));
      metricStore.update((state) => ({ ...state, anonymousId: '12345', sessionId: '67890' }));
      userStore.update((state) => ({ ...state, enterpriseFeatures: ['github-account-linking'] }));
      // Act
      signOut();
      // Assert
      expect(cookieReadyStore.get()).toBe(false);
      expect(azureCookieReadyStore.get().readyForRuntime).toBe(false);
      // logout preserves cookiesAccepted
      expect(authStore.get().cookiesAccepted).toBe(true);
      expect(authStore.get().nihStatusLoaded).toBe(false);
      expect(oidcStore.get().user).toBeUndefined();
      // logout preserves the anonymousId
      expect(metricStore.get().anonymousId).toBe('12345');
      expect(metricStore.get().sessionId).toBeUndefined();
      expect(userStore.get().enterpriseFeatures).toEqual([]);
    });
  });
});
