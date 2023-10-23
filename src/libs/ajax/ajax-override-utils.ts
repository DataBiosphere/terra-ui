/**
 * Utilities for overriding API responses for manual testing.
 * See https://github.com/DataBiosphere/terra-ui/wiki/Mocking-API-Responses.
 */

import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { AjaxOverride, ajaxOverridesStore, getTerraUser } from 'src/libs/state';

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
 * Override WDS app listings to use a local instance of WDS for relevant workspaces.
 */
export const overrideAppsWithLocalWDS = async () => {
  const wdsUrl = 'http://localhost:8080';
  const token = getTerraUser().token;

  if (!token) {
    throw new Error('Must be signed in to use local WDS');
  }

  // Get list of instances from local WDS.
  // Using base fetch here to avoid an import cycle with ajax-common.ts.
  const instancesResponse = await fetch(`${wdsUrl}/instances/v0.2`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const instances: string[] = await instancesResponse.json();

  // For each instance on the local WDS, override the Leo apps list
  // for the corresponding workspace to return the local WDS' URL
  // as the WDS proxy URL for that workspace.
  const ajaxOverrides: AjaxOverride[] = instances.map((instanceId) => {
    const workspaceId = instanceId;
    return {
      filter: { url: new RegExp(`/apps/v2/${workspaceId}`) },
      fn: mapJsonBody((apps: ListAppResponse[]): ListAppResponse[] => {
        return apps.map((app) => {
          if (app.appType === 'WDS') {
            return {
              ...app,
              proxyUrls: {
                ...app.proxyUrls,
                wds: wdsUrl,
              },
            };
          }
          return app;
        });
      }),
    };
  });

  ajaxOverridesStore.set(ajaxOverrides);
};

/**
 * Utilities to be exposed as globals.
 */
const ajaxOverrideUtils = {
  mapJsonBody,
  makeError,
  makeSuccess,
  overrideAppsWithLocalWDS,
};

declare global {
  interface Window {
    ajaxOverrideUtils: typeof ajaxOverrideUtils;
  }
}

window.ajaxOverrideUtils = ajaxOverrideUtils;
