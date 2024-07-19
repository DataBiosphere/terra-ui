import { abandonedPromise } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { ajaxOverridesStore } from 'src/libs/state';

export const jsonBody = (body) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});
// Allows use of ajaxOverrideStore to stub responses for testing
export const withInstrumentation =
  (wrappedFetch) =>
  (...args) => {
    return _.flow(
      ..._.map(
        'fn',
        _.filter(({ filter }) => {
          const [url, { method = 'GET' } = {}] = args;
          return _.isFunction(filter)
            ? filter(...args)
            : url.match(filter.url) && (!filter.method || filter.method === method);
        }, ajaxOverridesStore.get())
      )
    )(wrappedFetch)(...args);
  };

// Ignores cancellation error when request is cancelled
export const withCancellation =
  (wrappedFetch) =>
  async (...args) => {
    try {
      return await wrappedFetch(...args);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return abandonedPromise();
      }
      throw error;
    }
  };

// Converts non-200 responses to exceptions
export const withErrorRejection =
  (wrappedFetch) =>
  async (...args) => {
    const res = await wrappedFetch(...args);
    if (res.ok) {
      return res;
    }
    throw res;
  };

export const fetchOk = _.flow(withInstrumentation, withCancellation, withErrorRejection)(fetch);

export const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args);
});
