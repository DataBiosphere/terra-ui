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
    getById: async (cbasUrlRoot, methodId) => {
      const keyParams = qs.stringify({ method_id: methodId });
      const res = await fetchFromProxy(cbasUrlRoot)(`api/batch/v1/methods?${keyParams}`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
      return res.json();
    },
  },
  runSets: {
    get: async (cbasUrlRoot) => {
      const res = await fetchFromProxy(cbasUrlRoot)('api/batch/v1/run_sets', _.mergeAll([authOpts(), { signal, method: 'GET' }]));
      return res.json();
    },
    post: async (cbasUrlRoot, payload) => {
      const res = await fetchFromProxy(cbasUrlRoot)('api/batch/v1/run_sets', _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody(payload)]));
      return res.json();
    },
    getForMethod: async (cbasUrlRoot, methodId, pageSize) => {
      const keyParams = qs.stringify({ method_id: methodId, page_size: pageSize }, { arrayFormat: 'repeat' });
      const res = await fetchFromProxy(cbasUrlRoot)(`api/batch/v1/run_sets?${keyParams}`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
      return res.json();
    },
    cancel: async (cbasUrlRoot, runSetId) => {
      const keyParams = qs.stringify({ run_set_id: runSetId });
      const res = await fetchFromProxy(cbasUrlRoot)(`api/batch/v1/run_sets/abort?${keyParams}`, _.mergeAll([authOpts(), { signal, method: 'POST' }]));
      return res.json();
    },
  },
});
