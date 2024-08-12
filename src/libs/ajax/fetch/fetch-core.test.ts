import { delay } from '@terra-ui-packages/core-utils';
import { FetchFn } from '@terra-ui-packages/data-client-core';
import { asMockedFn } from '@terra-ui-packages/test-utils';

import { makeWithMaybeRetry, withErrorRejection, withMaybeRetry, withRetry } from './fetch-core';

describe('withMaybeRetry', () => {
  // These tests avoid withFakeTimers or useFakeTimers since that setup cause lots of headaches with
  // the layered promise mechanics under test.

  // use to have shouldNotRetryFn arg always return false
  const alwaysRetryError = (_error: unknown) => false;

  it('fails after max retries', async () => {
    // Arrange
    const fetchFunction: FetchFn = jest.fn(async () => {
      await delay(51);
      throw Error('BOOM!');
    });

    // use faster version of withMaybeRetry so that test completes before default 5000ms timout
    const fasterWithMaybeRetry = makeWithMaybeRetry({
      maxTimeout: 2500,
      maxAttemptDelay: 500,
      minAttemptDelay: 250,
    });

    let thrownError;

    // Act
    try {
      const myFetch = fasterWithMaybeRetry(alwaysRetryError)(fetchFunction);
      await myFetch('some.place.nice');
    } catch (error) {
      thrownError = error;
    }

    // Assert
    expect(thrownError).toEqual(new Error('BOOM!'));
    const callCount = asMockedFn(fetchFunction).mock.calls.length;
    expect(callCount).toBeGreaterThan(3);
    expect(callCount).toBeLessThan(10);
  });

  it('succeeds after one fail', async () => {
    // Arrange
    let callCount = 0;
    const fetchFunction: FetchFn = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          if (callCount === 0) {
            callCount++;
            setTimeout(() => reject(new Error('BOOM!')), 100);
          } else {
            resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
          }
        })
    );

    // Act
    const myFetch = withMaybeRetry(alwaysRetryError)(fetchFunction);
    const response = await myFetch('some.place.nice');
    const result = await response.json();

    // Assert
    expect(result.success).toBe(true);
    expect(response.status).toBe(200);
    expect(fetchFunction).toBeCalledTimes(2);
  });
});

describe('withRetry', () => {
  // These tests avoid withFakeTimers or useFakeTimers since that setup cause lots of headaches with
  // the layered promise mechanics under test.

  it('fails after max retries', async () => {
    // Arrange
    const fetchFunction: FetchFn = jest.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          setTimeout(() => reject(new Error('BOOM!')), 10);
        })
    );

    let thrownError;

    // Act
    try {
      const myFetch = withRetry(5, 100)(withErrorRejection(fetchFunction));
      await myFetch('some.place.nice');
    } catch (error) {
      thrownError = error;
    }

    // Assert
    expect(thrownError).toEqual(new Error('BOOM!'));
    expect(fetchFunction).toBeCalledTimes(6);
  });

  it('succeeds after one fail', async () => {
    // Arrange
    let callCount = 0;
    const fetchFunction: FetchFn = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          if (callCount === 0) {
            callCount++;
            setTimeout(() => reject(new Error('BOOM!')), 1);
          } else {
            resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
          }
        })
    );

    // Act
    const myFetch = withRetry(5, 100)(withErrorRejection(fetchFunction));
    const response = await myFetch('some.place.nice');
    const result = await response.json();

    // Assert
    expect(result.success).toBe(true);
    expect(response.status).toBe(200);
    expect(fetchFunction).toBeCalledTimes(2);
  });
});
