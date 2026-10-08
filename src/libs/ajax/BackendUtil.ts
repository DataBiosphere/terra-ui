import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchOrchestration } from 'src/libs/ajax/ajax-common';

/** Response from Firecloud Orchestration; field names match the shared contract exactly. */
export interface UrlSizeResponse {
  /** Echo of the request URL, whichever kind it was. */
  originalUrl: string;
  /**
   * A list of URLs and its size
   */
  files: { signed_url: string; sizeBytes: number }[];
}

export const BackendUtil = (signal?: AbortSignal) => ({
  /**
   * Ask Firecloud Orchestration (which asks cWDS) to resolve a export URL into the AVRO files it
   * refers to, with their sizes.
   *
   * The URL may be either a PFB manifest or a single AVRO file; cWDS tells them apart by
   * examining the response for the URL, so the caller does not have to know which it has.
   * Either way the response carries a list: one entry per URL in a manifest, or exactly one
   * entry for a single AVRO file.
   *
   * Terra UI cannot read these sizes itself, because the export buckets do not allow cross
   * origin requests and `Content-Length` is not a CORS-safelisted response header.
   *
   * @param sourceUrl - A manifest URL or a single AVRO URL, with its query string intact.
   */
  preprocess: async (sourceUrl: string): Promise<UrlSizeResponse> => {
    const res = await fetchOrchestration(
      'api/import/getUrlSize',
      _.mergeAll([authOpts(), jsonBody({ url: sourceUrl }), { signal, method: 'POST' }])
    );
    return res.json();
  },
});
