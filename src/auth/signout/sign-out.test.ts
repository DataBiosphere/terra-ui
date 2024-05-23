import { removeUserFromLocalState } from 'src/auth/oidc-broker';
import { signOut } from 'src/auth/signout/sign-out';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { goToPath } from 'src/libs/nav';
import { OidcState, oidcStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/auth/oidc-broker');

jest.mock('react-oidc-context');

jest.mock('src/libs/ajax/Metrics');

const currentRoute = {
  name: 'routeName',
  query: { a: 'a', b: 'b' },
  params: { foo: 'bar' },
};

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  return {
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn().mockReturnValue({ name: 'signout-callback', query: {} }),
    goToPath: jest.fn(),
    getWindowOrigin: jest.fn(),
    getCurrentRoute: jest.fn().mockReturnValue(currentRoute),
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

describe('sign-out', () => {
  it('sends sign out metrics', async () => {
    // Arrange
    const captureEventFn = jest.fn();
    asMockedFn(Metrics).mockReturnValue({
      captureEvent: captureEventFn,
    } as Partial<MetricsContract> as MetricsContract);

    // Act
    signOut();
    // Assert
    expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.unspecified, expect.any(Object));
  });
  it('sends sign out metrics with a specified event', async () => {
    // Arrange
    const captureEventFn = jest.fn();
    asMockedFn(Metrics).mockReturnValue({
      captureEvent: captureEventFn,
    } as Partial<MetricsContract> as MetricsContract);

    // Act
    signOut('idleStatusMonitor');
    // Assert
    expect(captureEventFn).toHaveBeenCalledWith(Events.user.signOut.idleStatusMonitor, expect.any(Object));
  });

  it('redirects to the signout callback page', () => {
    // Arrange
    const signoutRedirectFn = jest.fn();
    const hostname = 'https://mycoolhost.horse';
    const link = 'signout';
    const expectedState = btoa(JSON.stringify({ signOutRedirect: currentRoute, signOutCause: 'unspecified' }));
    asMockedFn(oidcStore.get).mockReturnValue({
      userManager: {
        signoutRedirect: signoutRedirectFn,
      },
    } as unknown as OidcState);
    asMockedFn(Nav.getLink).mockReturnValue(link);
    asMockedFn(Nav.getWindowOrigin).mockReturnValue(hostname);
    asMockedFn(Nav.getCurrentRoute).mockReturnValue(currentRoute);
    // Act
    signOut();
    // Assert
    expect(signoutRedirectFn).toHaveBeenCalledWith({
      post_logout_redirect_uri: `${hostname}/${link}`,
      extraQueryParams: { state: expectedState },
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
