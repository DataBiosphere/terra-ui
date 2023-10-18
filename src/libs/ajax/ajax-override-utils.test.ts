import { makeError, makeSuccess, mapJsonBody } from './ajax-override-utils';

type FetchFn = typeof fetch;

describe('mapJsonBody', () => {
  it('updates response body', async () => {
    // Arrange
    const fetch: FetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify({ foo: 1, bar: 2, baz: 3 })));

    const incrementValues = mapJsonBody((obj) =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Number(v) + 1]))
    );
    const fetchWithOverride = incrementValues(fetch);

    // Act
    const response = await fetchWithOverride('/api', { headers: { Authorization: 'Bearer token' } });
    const responseBody = await response.json();

    // Assert
    expect(fetch).toHaveBeenCalledWith('/api', { headers: { Authorization: 'Bearer token' } });
    expect(response).toBeInstanceOf(Response);
    expect(responseBody).toEqual({ foo: 2, bar: 3, baz: 4 });
  });
});

describe('makeError', () => {
  it('overrides response with error response', async () => {
    // Arrange
    const fetch: FetchFn = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const fetchWithOverride = makeError({ status: 500 })(fetch);

    // Act
    const response = await fetchWithOverride('/api', { headers: { Authorization: 'Bearer token' } });
    const responseBody = await response.text();

    // Assert
    expect(fetch).not.toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(responseBody).toBe('Instrumented error');
  });

  it('can override responses randomly', async () => {
    // Arrange
    const random = jest.spyOn(Math, 'random');

    const fetch: FetchFn = jest.fn().mockResolvedValue(new Response('Success', { status: 200 }));

    const fetchWithOverride = makeError({ status: 500, frequency: 0.5 })(fetch);

    // Act
    random.mockReturnValue(0.25);
    const firstResponse = await fetchWithOverride('/api', { headers: { Authorization: 'Bearer token' } });
    const firstResponseBody = await firstResponse.text();

    random.mockReturnValue(0.75);
    const secondResponse = await fetchWithOverride('/api', { headers: { Authorization: 'Bearer token' } });
    const secondResponseBody = await secondResponse.text();

    // Assert
    expect(fetch).toHaveBeenCalledTimes(1);

    expect(firstResponse.status).toBe(500);
    expect(firstResponseBody).toBe('Instrumented error');

    expect(secondResponse.status).toBe(200);
    expect(secondResponseBody).toBe('Success');
  });
});

describe('makeSuccess', () => {
  it('overrides response with success response', async () => {
    // Arrange
    const fetch: FetchFn = jest.fn().mockResolvedValue(new Response('Error', { status: 500 }));

    const fetchWithOverride = makeSuccess({ message: 'Success' })(fetch);

    // Act
    const response = await fetchWithOverride('/api', { headers: { Authorization: 'Bearer token' } });
    const responseBody = await response.json();

    // Assert
    expect(fetch).not.toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ message: 'Success' });
  });
});
