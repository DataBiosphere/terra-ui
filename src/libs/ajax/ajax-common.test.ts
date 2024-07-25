import { makeRequestRetry } from './ajax-common';

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
