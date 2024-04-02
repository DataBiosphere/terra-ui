import { render } from '@testing-library/react';
import React from 'react';
import { OidcUser } from 'src/auth/oidc-broker';
import { SignOutPage } from 'src/auth/signout/SignOutPage';
import * as Nav from 'src/libs/nav';
import { authStore, azureCookieReadyStore, cookieReadyStore, metricStore, oidcStore, userStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
    getLink: jest.fn().mockImplementation((_) => _),
    goToPath: jest.fn(),
    useRoute: jest.fn().mockReturnValue({ query: {} }),
  })
);

describe('SignOutPage', () => {
  it('clears stores after being redirected to', () => {
    // Arrange
    cookieReadyStore.update(() => true);
    azureCookieReadyStore.update((state) => ({ ...state, readyForRuntime: true }));
    authStore.update((state) => ({ ...state, cookiesAccepted: true, nihStatusLoaded: true }));
    oidcStore.update((state) => ({ ...state, user: {} as OidcUser }));
    metricStore.update((state) => ({ ...state, anonymousId: '12345', sessionId: '67890' }));
    userStore.update((state) => ({ ...state, enterpriseFeatures: ['github-account-linking'] }));
    // Act
    render(<SignOutPage />);
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
  it('redirects to the root path if no state is provided', () => {
    // Act
    render(<SignOutPage />);
    // Assert
    expect(Nav.goToPath).toHaveBeenCalledWith('root');
  });
  it('redirects to the decoded state path if state is provided', () => {
    // Arrange
    const encodedState = btoa(
      JSON.stringify({ postLogoutRedirect: { name: 'foo', query: { a: 'a', b: 'b' }, params: { foo: 'bar' } } })
    );
    asMockedFn(Nav.useRoute).mockReturnValue({ query: { state: encodedState } });
    // Act
    render(<SignOutPage />);
    // Assert
    expect(Nav.goToPath).toHaveBeenCalledWith('foo', { foo: 'bar' }, { a: 'a', b: 'b' });
  });
});
