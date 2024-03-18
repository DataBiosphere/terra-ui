import { getAuthToken, getAuthTokenFromLocalStorage, loadAuthToken } from 'src/auth/auth';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { signOut } from 'src/auth/auth-events/logout';
import { OidcUser } from 'src/auth/oidc-broker';
import { asMockedFn } from 'src/testing/test-utils';

import { authOpts, makeRequestRetry, withRetryAfterReloadingExpiredAuthToken } from './ajax-common';

let mockOidcUser: OidcUser;
const token = 'testtoken';
const newToken = 'newtesttoken';
beforeEach(() => {
  mockOidcUser = {
    id_token: undefined,
    session_state: null,
    access_token: token,
    refresh_token: '',
    token_type: '',
    scope: undefined,
    profile: {
      sub: '',
      iss: '',
      aud: '',
      exp: 0,
      iat: 0,
    },
    expires_at: undefined,
    state: undefined,
    expires_in: 0,
    expired: undefined,
    scopes: [],
    toStorageString: (): string => '',
  };

  asMockedFn(loadAuthToken).mockImplementation(() => {
    mockOidcUser.access_token = newToken;
    return Promise.resolve({
      status: 'success',
      oidcUser: mockOidcUser,
    });
  });
});

type AuthExports = typeof import('src/auth/auth');
jest.mock('src/auth/auth', (): Partial<AuthExports> => {
  return {
    getAuthToken: jest.fn(() => mockOidcUser.access_token),
    getAuthTokenFromLocalStorage: jest.fn(() => Promise.resolve(mockOidcUser.access_token)),
    loadAuthToken: jest.fn(),
    sendAuthTokenDesyncMetric: jest.fn(),
    sendRetryMetric: jest.fn(),
  };
});

type LogoutExports = typeof import('src/auth/auth-events/logout');

jest.mock(
  'src/auth/auth-events/logout',
  (): Partial<LogoutExports> => ({
    signOut: jest.fn(),
  })
);

describe('withRetryAfterReloadingExpiredAuthToken', () => {
  it('passes args through to wrapped fetch', async () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);

    // Act
    await wrappedFetch('https://example.com', { headers: { 'Content-Type': 'application/json' } });

    // Assert
    expect(originalFetch).toHaveBeenCalledWith('https://example.com', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('returns result of successful request', async () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);

    // Act
    const response = await wrappedFetch('https://example.com');

    // Assert
    expect(response instanceof Response).toBe(true);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(response.status).toBe(200);
  });

  describe('uses locally stored auth token for authenticated requests', () => {
    const localToken = 'local token';
    asMockedFn(getAuthTokenFromLocalStorage).mockImplementationOnce(() => Promise.resolve(localToken));
    it('when tokens are different', async () => {
      // Arrange
      const originalFetch = jest.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
      );
      const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);
      const makeAuthenticatedRequest = () => wrappedFetch('https://example.com', authOpts());

      // Act
      await Promise.allSettled([makeAuthenticatedRequest()]);

      // Assert
      expect(originalFetch).toHaveBeenCalledWith('https://example.com', {
        headers: { Authorization: `Bearer ${localToken}` },
      });
    });
  });

  describe('if an authenticated request fails with a 401 status', () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);
    const makeAuthenticatedRequest = () => wrappedFetch('https://example.com', authOpts());

    it('attempts to reload auth token', async () => {
      // Act
      // Ignore errors because the mock originalFetch function always returns a rejected promise.
      await Promise.allSettled([makeAuthenticatedRequest()]);

      // Assert
      expect(loadAuthToken).toHaveBeenCalled();
    });

    describe('if reloading auth token fails', () => {
      describe('due to an error', () => {
        beforeEach(() => {
          asMockedFn(loadAuthToken).mockImplementation(() =>
            Promise.resolve({
              status: 'error',
              internalErrorMsg: 'unexpected error',
              userErrorMsg: 'unexpected error',
              reason: {},
            })
          );
        });

        describe('and the authToken the request used was completed with the current authToken', () => {
          it('signs out user', async () => {
            // Act
            // Ignore errors because makeAuthenticatedRequest is expected to return a rejected promise here.
            await Promise.allSettled([makeAuthenticatedRequest()]);

            // Assert
            expect(signOut).toHaveBeenCalledWith('errorRefreshingAuthToken');
          });
        });

        describe('and the authToken the request used was completed with a different authToken than the current one', () => {
          it('does not sign out user', async () => {
            // Arrange
            asMockedFn(getAuthToken)
              .mockImplementationOnce(() => token)
              .mockImplementationOnce(() => newToken);
            // Act
            // Ignore errors because makeAuthenticatedRequest is expected to return a rejected promise here.
            await Promise.allSettled([makeAuthenticatedRequest()]);

            // Assert
            expect(signOut).not.toHaveBeenCalled();
          });
        });
        it('throws an error', async () => {
          // Act
          const result = makeAuthenticatedRequest();

          // Assert
          await expect(result).rejects.toEqual(new Error(sessionTimedOutErrorMessage));
        });
      });

      describe('due to an expired refresh token', () => {
        beforeEach(() => {
          asMockedFn(loadAuthToken).mockImplementation(() =>
            Promise.resolve({
              status: 'expired',
            })
          );
        });

        describe('and the authToken the request used was completed with the current authToken', () => {
          it('signs out user', async () => {
            // Act
            // Ignore errors because makeAuthenticatedRequest is expected to return a rejected promise here.
            await Promise.allSettled([makeAuthenticatedRequest()]);

            // Assert
            expect(signOut).toHaveBeenCalledWith('expiredRefreshToken');
          });
        });

        describe('and the authToken the request used was completed with a different authToken than the current one', () => {
          it('does not sign out user', async () => {
            // Arrange
            asMockedFn(getAuthToken)
              .mockImplementationOnce(() => token)
              .mockImplementationOnce(() => newToken);
            // Act
            // Ignore errors because makeAuthenticatedRequest is expected to return a rejected promise here.
            await Promise.allSettled([makeAuthenticatedRequest()]);

            // Assert
            expect(signOut).not.toHaveBeenCalled();
          });
        });

        it('throws an error', async () => {
          // Act
          const result = makeAuthenticatedRequest();

          // Assert
          await expect(result).rejects.toEqual(new Error(sessionTimedOutErrorMessage));
        });
      });
    });

    it('and reloading the auth token succeeds it retries request with new auth token', async () => {
      // Act
      // Ignore errors because the mock originalFetch function always returns a rejected promise.
      await Promise.allSettled([makeAuthenticatedRequest()]);

      // Assert
      expect(originalFetch).toHaveBeenCalledTimes(2);
      expect(originalFetch).toHaveBeenCalledWith('https://example.com', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(originalFetch).toHaveBeenLastCalledWith('https://example.com', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    });
  });
});

describe('makeRequestRetry', () => {
  it('fails after max retries', async () => {
    // Arrange
    const fetchFunction = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 51);
        })
    );

    let thrownError;
    // Act
    try {
      await makeRequestRetry(fetchFunction, 5, 10);
    } catch (error) {
      thrownError = error;
    }

    // Assert
    expect(thrownError).toEqual(new Error('Request timed out'));
  });

  it('succeeds after one fail', async () => {
    // Arrange
    let callCount = 0;
    const fetchFunction = jest.fn(
      () =>
        new Promise((resolve) => {
          if (callCount === 0) {
            callCount++;
            setTimeout(() => resolve(new Response()), 51);
          } else {
            resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
          }
        })
    );

    // Act
    const result = await makeRequestRetry(fetchFunction, 5, 10);

    // Assert
    expect(result.success).toBe(true);
  });
});
