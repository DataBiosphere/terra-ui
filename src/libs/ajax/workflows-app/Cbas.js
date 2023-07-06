import _ from 'lodash/fp';
import qs from 'qs';
import { authOpts, fetchFromProxy, jsonBody } from 'src/libs/ajax/ajax-common';

export const Cbas = (signal) => ({
  status: async (cbasUrlRoot) => {
    const res = await fetchFromProxy(cbasUrlRoot)('status', _.mergeAll([authOpts(), { signal, method: 'GET' }]));
    return res.json();
  },
  methods: {
    post: async (cbasUrlRoot, payload) => {
      const res = await fetchFromProxy(cbasUrlRoot)('api/batch/v1/methods', _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
      return res.json();
    },
    getWithoutVersions: async (cbasUrlRoot) => {
      const keyParams = qs.stringify({ show_versions: false });
      const res = await fetchFromProxy(cbasUrlRoot)(`api/batch/v1/methods?${keyParams}`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
      return res.json();
    },
  },
});
