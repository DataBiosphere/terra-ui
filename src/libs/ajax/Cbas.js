import _ from 'lodash/fp';
import { authOpts, fetchCbas, jsonBody } from 'src/libs/ajax/ajax-common';

export const Cbas = (signal) => ({
  status: async () => {
    const res = fetchCbas(fetchCbas)('api/batch/v1/status', { signal });
    return res.json();
  },
  methods: {
    post: async (cbasUrlRoot, payload) => {
      const res = await fetchCbas(cbasUrlRoot)('api/batch/v1/methods', _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
      return res.json();
    },
  },
});
