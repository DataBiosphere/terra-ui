import { render } from '@testing-library/react';
import React from 'react';
import { Logout } from 'src/auth/Logout';
import { OidcUser } from 'src/auth/oidc-broker';
import { authStore, azureCookieReadyStore, cookieReadyStore, metricStore, oidcStore, userStore } from 'src/libs/state';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
    getLink: jest.fn().mockImplementation((_) => _),
    goToPath: jest.fn(),
  })
);

describe('Logout', () => {
  it('clears stores after being redirected to', () => {
    // Arrange
    cookieReadyStore.update(() => true);
    azureCookieReadyStore.update((state) => ({ ...state, readyForRuntime: true }));
    authStore.update((state) => ({ ...state, cookiesAccepted: true, nihStatusLoaded: true }));
    oidcStore.update((state) => ({ ...state, user: {} as OidcUser }));
    metricStore.update((state) => ({ ...state, anonymousId: '12345', sessionId: '67890' }));
    userStore.update((state) => ({ ...state, enterpriseFeatures: ['github-account-linking'] }));
    // Act
    render(<Logout />);
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
