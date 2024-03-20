import { DeepPartial } from '@terra-ui-packages/core-utils';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { signOut } from 'src/auth/auth-events/signout';
import { removeUserFromLocalState } from 'src/auth/oidc-broker';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { goToPath } from 'src/libs/nav';
import { notify, sessionTimeoutProps } from 'src/libs/notifications';
import { OidcState, oidcStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/auth/oidc-broker');

jest.mock('react-oidc-context');

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

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  return {
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn().mockReturnValue({ name: 'logout-callback', query: {} }),
    goToPath: jest.fn(),
  };
});

jest.mock('src/libs/state', () => {
  const state = jest.requireActual('src/libs/state');
  return {
    ...state,
    oidcStore: {
      ...state.oidcStore,
      get: jest.fn().mockReturnValue({
        ...state.oidcStore.get,
        userManager: { signoutRedirect: jest.fn() },
      }),
    },
  };
});

describe('signout', () => {
  it('sends sign out metrics', async () => {
    // Arrange
    const captureEventFn = jest.fn();
    asMockedFn(Ajax).mockReturnValue({
      Metrics: {
        captureEvent: captureEventFn,
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    signOut();
    // Assert
    expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.unspecified, expect.any(Object));
  });
  it('sends sign out metrics with a specified event', async () => {
    // Arrange
    const captureEventFn = jest.fn();
    asMockedFn(Ajax).mockReturnValue({
      Metrics: {
        captureEvent: captureEventFn,
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    signOut('idleStatusMonitor');
    // Assert
    expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.idleStatusMonitor, expect.any(Object));
  });
  it('displays a session expired notification for an expired refresh token', () => {
    // Arrange
    // Act
    signOut('expiredRefreshToken');
    // Assert
    expect(notify).toHaveBeenCalledWith('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
  });
  it('displays a session expired notification for an error refreshing tokens', () => {
    // Arrange
    // Act
    signOut('errorRefreshingAuthToken');
    // Assert
    expect(notify).toHaveBeenCalledWith('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
  });
  it('redirects to the logout callback page', () => {
    // Arrange
    const signoutRedirectFn = jest.fn();
    asMockedFn(oidcStore.get).mockReturnValue({
      userManager: {
        signoutRedirect: signoutRedirectFn,
      },
    } as unknown as OidcState);
    asMockedFn(Nav.getLink).mockReturnValue('logout');
    // Act
    signOut();
    // Assert
    expect(signoutRedirectFn).toHaveBeenCalledWith({
      post_logout_redirect_uri: `${window.location.origin}/logout`,
    });
  });
  it('logs an error and calls userSignedOut if signoutRedirect throws', () => {
    // Arrange
    const signoutRedirectFn = jest.fn(() => {
      throw new Error('test error');
    });
    const removeUserFromLocalStateFn = jest.fn();
    const goToRootFn = jest.fn();
    asMockedFn(oidcStore.get).mockReturnValue({
      userManager: {
        signoutRedirect: signoutRedirectFn,
      },
    } as unknown as OidcState);
    asMockedFn(removeUserFromLocalState).mockImplementation(removeUserFromLocalStateFn);
    asMockedFn(goToPath).mockImplementation(goToRootFn);
    const consoleErrorFn = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Act
    signOut();
    // Assert
    expect(consoleErrorFn).toHaveBeenCalledWith(
      'Signing out with B2C failed. Falling back on local signout',
      expect.any(Error)
    );
    expect(removeUserFromLocalStateFn).toHaveBeenCalled();
    expect(goToRootFn).toHaveBeenCalledWith('root');
  });
});
