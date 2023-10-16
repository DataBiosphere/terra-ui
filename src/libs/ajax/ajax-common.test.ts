import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { loadAuthToken, OidcUser, signOut } from 'src/libs/auth';
import { asMockedFn } from 'src/testing/test-utils';

import { authOpts, makeRequestRetry, withAuthToken } from './ajax-common';

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

type AuthExports = typeof import('src/libs/auth');
jest.mock('src/libs/auth', (): Partial<AuthExports> => {
  return {
    loadAuthToken: jest.fn(),
    signOut: jest.fn(),
    getAuthToken: jest.fn(() => mockOidcUser.access_token),
  };
});

describe('withRetryAfterReloadingExpiredAuthToken', () => {
  it('passes args through to wrapped fetch', async () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
    );
    const wrappedFetch = withAuthToken(originalFetch);

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
    const wrappedFetch = withAuthToken(originalFetch);

    // Act
    const response = await wrappedFetch('https://example.com');

    // Assert
    expect(response instanceof Response).toBe(true);
    expect(response.json()).resolves.toEqual({ success: true });
    expect(response.status).toBe(200);
  });

  describe('if an authenticated request fails with a 401 status', () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 }))
    );
    const wrappedFetch = withAuthToken(originalFetch);
    const makeAuthenticatedRequest = () => wrappedFetch('https://example.com', authOpts());

    describe('if reloading auth token fails', () => {
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

      it('signs out user', async () => {
        // Act
        // Ignore errors because makeAuthenticatedRequest is expected to return a rejected promise here.
        await Promise.allSettled([makeAuthenticatedRequest()]);

        // Assert
        expect(signOut).toHaveBeenCalled();
      });

      it('throws an error', () => {
        // Act
        const result = makeAuthenticatedRequest();

        // Assert
        expect(result).rejects.toEqual(new Error(sessionTimedOutErrorMessage));
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
