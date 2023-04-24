import { reloadAuthToken, signOutAfterSessionTimeout } from "src/libs/auth";
import { getUser } from "src/libs/state";
import { asMockedFn } from "src/testing/test-utils";

import { authOpts, withRetryAfterReloadingExpiredAuthToken } from "./ajax-common";

type AuthExports = typeof import("src/libs/auth");
jest.mock("src/libs/auth", (): Partial<AuthExports> => {
  return {
    reloadAuthToken: jest.fn(),
    signOutAfterSessionTimeout: jest.fn(),
  };
});

type StateExports = typeof import("src/libs/state");
jest.mock("src/libs/state", (): StateExports => {
  return {
    ...jest.requireActual("src/libs/state"),
    getUser: jest.fn(() => ({ token: "testtoken" })),
  };
});

describe("withRetryAfterReloadingExpiredAuthToken", () => {
  it("passes args through to wrapped fetch", async () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);

    // Act
    await wrappedFetch("https://example.com", { headers: { "Content-Type": "application/json" } });

    // Assert
    expect(originalFetch).toHaveBeenCalledWith("https://example.com", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("returns result of successful request", async () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);

    // Act
    const response = await wrappedFetch("https://example.com");

    // Assert
    expect(response instanceof Response).toBe(true);
    expect(response.json()).resolves.toEqual({ success: true });
    expect(response.status).toBe(200);
  });

  describe("if an authenticated request fails with a 401 status", () => {
    // Arrange
    const originalFetch = jest.fn(() =>
      Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 }))
    );
    const wrappedFetch = withRetryAfterReloadingExpiredAuthToken(originalFetch);
    const makeAuthenticatedRequest = () => wrappedFetch("https://example.com", authOpts());

    beforeEach(() => {
      let mockUser = { token: "testtoken" };
      asMockedFn(getUser).mockImplementation(() => mockUser);

      asMockedFn(reloadAuthToken).mockImplementation(() => {
        mockUser = { token: "newtesttoken" };
        return Promise.resolve(true);
      });
    });

    it("attempts to reload auth token", async () => {
      // Act
      // Ignore errors because the mock originalFetch function always returns a rejected promise.
      await Promise.allSettled([makeAuthenticatedRequest()]);

      // Assert
      expect(reloadAuthToken).toHaveBeenCalled();
    });

    it("retries request with new auth token if reloading auth token succeeds", async () => {
      // Act
      // Ignore errors because the mock originalFetch function always returns a rejected promise.
      await Promise.allSettled([makeAuthenticatedRequest()]);

      // Assert
      expect(originalFetch).toHaveBeenCalledTimes(2);
      expect(originalFetch).toHaveBeenCalledWith("https://example.com", {
        headers: { Authorization: "Bearer testtoken" },
      });
      expect(originalFetch).toHaveBeenLastCalledWith("https://example.com", {
        headers: { Authorization: "Bearer newtesttoken" },
      });
    });

    describe("if reloading auth token fails", () => {
      beforeEach(() => {
        asMockedFn(reloadAuthToken).mockImplementation(() => Promise.resolve(false));
      });

      it("signs out user", async () => {
        // Act
        // Ignore errors because makeAuthenticatedReuqest is expected to return a rejected promise here.
        await Promise.allSettled([makeAuthenticatedRequest()]);

        // Assert
        expect(signOutAfterSessionTimeout).toHaveBeenCalled();
      });

      it("throws an error", () => {
        // Act
        const result = makeAuthenticatedRequest();

        // Assert
        expect(result).rejects.toEqual(new Error("Session timed out"));
      });
    });
  });
});
