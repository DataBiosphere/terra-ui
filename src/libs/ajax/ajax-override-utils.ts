/**
 * Utilities for overriding API responses for manual testing.
 * See https://github.com/DataBiosphere/terra-ui/wiki/Mocking-API-Responses.
 */

type FetchFn = typeof fetch;
type FetchWrapper = (wrappedFetch: FetchFn) => FetchFn;

/**
 * Modify the body of a response.
 *
 * @param fn - Function that accepts actual response body and returns overriden response body.
 */
export const mapJsonBody = (fn: (body: any) => any): FetchWrapper => {
  return (wrappedFetch: FetchFn): FetchFn => {
    return async (...args) => {
      const response: Response = await wrappedFetch(...args);
      const responseBody: any = await response.json();
      const newResponseBody: any = fn(responseBody);
      return new Response(JSON.stringify(newResponseBody), response);
    };
  };
};

/**
 * Replace a response with an error response.
 *
 * @param opts
 * @param opts.status - Status code for error response.
 * @param opts.frequency - Frequency with which to return errors, between 0 (never) and 1 (always).
 */
export const makeError = (opts: { status: number; frequency?: number }): FetchWrapper => {
  const { status, frequency = 1 } = opts;
  return (wrappedFetch: FetchFn): FetchFn => {
    return async (...args) => {
      if (Math.random() < frequency) {
        const response = new Response('Instrumented error', { status });
        return Promise.resolve(response);
      }
      return wrappedFetch(...args);
    };
  };
};

/**
 * Replace a response with a success response with the given body.
 *
 * @param body - Response body.
 */
export const makeSuccess = (body: any): FetchWrapper => {
  return (): FetchFn => {
    return () => {
      const response = new Response(JSON.stringify(body), { status: 200 });
      return Promise.resolve(response);
    };
  };
};

/**
 * Utilities to be exposed as globals.
 */
const ajaxOverrideUtils = {
  mapJsonBody,
  makeError,
  makeSuccess,
};

declare global {
  interface Window {
    ajaxOverrideUtils: typeof ajaxOverrideUtils;
  }
}

window.ajaxOverrideUtils = ajaxOverrideUtils;
