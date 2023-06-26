import _ from 'lodash/fp';
import qs from 'qs';
import { authOpts, fetchCbas, fetchCromwell, fetchLeo, fetchOk, jsonBody } from 'src/libs/ajax/ajax-common';
import { getConfig } from 'src/libs/config';

export const Cbas = (signal) => ({
  status: async (cbasUrlRoot) => {
    const res = await fetchOk(`${cbasUrlRoot}/status`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
    return res.json();
  },
  methods: {
    post: async (cbasUrlRoot, payload) => {
      const res = await fetchCbas(cbasUrlRoot)('methods', _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]));
      return res.json();
    },
    getWithoutVersions: async (cbasUrlRoot) => {
      const keyParams = qs.stringify({ show_versions: false });
      const res = await fetchCbas(cbasUrlRoot)(`methods?${keyParams}`, _.mergeAll([authOpts(), { signal, method: 'GET' }]));
      return res.json();
    },
  },
});

export const Cromwell = (signal) => ({
  workflows: (workflowId) => {
    return {
      metadata: async (includeKey, excludeKey) => {
        const keyParams = qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' });
        const res = await fetchCromwell(`${workflowId}/metadata?${keyParams}`, { signal, method: 'GET' });
        return res.json();
      },
    };
  },
});

export const WorkflowScript = (signal) => ({
  get: async (workflowUrl) => {
    const res = await fetchOk(workflowUrl, { signal, method: 'GET' });
    return res.text();
  },
});

export const extractLeoTokenFromCookies = (cookieString) => {
  const cookies = cookieString.split(';');
  return _.flow(
    _.map((c) => c.trim()),
    _.filter((c) => c.startsWith('LeoToken=')),
    _.map((c) => c.substring(9)),
    _.first
  )(cookies);
};

const leoToken = () => {
  const cookieString = document.cookie;
  return extractLeoTokenFromCookies(cookieString);
};
const authHeader = { headers: { Authorization: `Bearer ${leoToken()}` } };

const wdsInstanceId = getConfig().wdsInstanceId || '15f36863-30a5-4cab-91f7-52be439f1175';

export const Leonardo = (signal) => ({
  listAppsV2: async () => {
    const res = await fetchLeo(`api/apps/v2/${wdsInstanceId}`, _.mergeAll([authHeader, { signal, method: 'GET' }]));
    return res.json();
  },
});
