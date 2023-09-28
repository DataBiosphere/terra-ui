import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts, fetchBond, fetchEcm, fetchOk, fetchOrchestration, fetchRex, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common';
import { getConfig } from 'src/libs/config';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

const getFirstTimeStamp = Utils.memoizeAsync(
  async (token) => {
    const res = await fetchRex('firstTimestamps/record', _.mergeAll([authOpts(token), { method: 'POST' }]));
    return res.json();
  },
  { keyFn: (...args) => JSON.stringify(args) }
);

export const User = (signal) => ({
  getStatus: async () => {
    const res = await fetchSam('register/user/v2/self/info', _.mergeAll([authOpts(), { signal }]));
    return res.json();
  },

  profile: {
    get: async () => {
      const res = await fetchOrchestration('register/profile', _.merge(authOpts(), { signal }));
      return res.json();
    },

    // We are not calling Thurloe directly because free credits logic was in orchestration
    set: (keysAndValues) => {
      const blankProfile = {
        firstName: 'N/A',
        lastName: 'N/A',
        title: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        institutionalProgram: 'N/A',
        programLocationCity: 'N/A',
        programLocationState: 'N/A',
        programLocationCountry: 'N/A',
        pi: 'N/A',
        nonProfitStatus: 'N/A',
      };
      return fetchOrchestration(
        'register/profile',
        _.mergeAll([authOpts(), jsonBody(_.merge(blankProfile, keysAndValues)), { signal, method: 'POST' }])
      );
    },

    setPreferences: (body) => {
      return fetchOrchestration('api/profile/preferences', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
    },

    preferLegacyFirecloud: () => {
      return fetchOrchestration('api/profile/terra', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
    },
  },

  getProxyGroup: async (email) => {
    const res = await fetchOrchestration(`api/proxyGroup/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  getTos: async () => {
    const response = await fetchSam('tos/text', _.merge(authOpts(), { signal }));
    return response.text();
  },

  acceptTos: async () => {
    try {
      const response = await fetchSam(
        'register/user/v1/termsofservice',
        _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody('app.terra.bio/#terms-of-service')])
      );
      return response.json();
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  },

  rejectTos: async () => {
    try {
      const response = await fetchSam('register/user/v1/termsofservice', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
      return response.json();
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  },

  getTermsOfServiceComplianceStatus: async () => {
    try {
      const res = await fetchSam('register/user/v2/self/termsOfServiceComplianceStatus', _.merge(authOpts(), { signal }));
      return res.json();
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        return null;
      }
      throw error;
    }
  },

  getPrivacyPolicy: async () => {
    const response = await fetchSam('privacy/text', _.merge(authOpts(), { signal }));
    return response.text();
  },

  // If you are making changes to the Support Request Modal, make sure you test the following:
  // 1. Submit a ticket via Terra while signed in and signed out
  // 2. Check the tickets are generated on Zendesk
  // 3. Reply internally (as a Light Agent) and make sure an email is not sent
  // 4. Reply externally (ask one of the Comms team with Full Agent access) and make sure you receive an email
  createSupportRequest: ({ name, email, currUrl, subject, type, description, attachmentToken, emailAgreed, clinicalUser }) => {
    return fetchOk(
      'https://support.terra.bio/api/v2/requests.json',
      _.merge(
        { signal, method: 'POST' },
        jsonBody({
          request: {
            requester: { name, email },
            subject,
            // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
            custom_fields: [
              { id: 360012744452, value: type },
              { id: 360007369412, value: description },
              { id: 360012744292, value: name },
              { id: 360012782111, value: email },
              { id: 360018545031, value: emailAgreed },
              { id: 360027463271, value: clinicalUser },
            ],
            comment: {
              body: `${description}\n\n------------------\nSubmitted from: ${currUrl}`,
              uploads: [`${attachmentToken}`],
            },
          },
        })
      )
    );
  },

  uploadAttachment: async (file) => {
    const res = await fetchOk(`https://support.terra.bio/api/v2/uploads?filename=${file.name}`, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': 'application/binary',
      },
    });
    return (await res.json()).upload;
  },

  firstTimestamp: () => {
    return getFirstTimeStamp(getTerraUser().token);
  },

  getNihStatus: async () => {
    try {
      const res = await fetchOrchestration('api/nih/status', _.merge(authOpts(), { signal }));
      return res.json();
    } catch (error) {
      if (error.status === 404) {
        return {};
      }
      throw error;
    }
  },

  linkNihAccount: async (token) => {
    const res = await fetchOrchestration('api/nih/callback', _.mergeAll([authOpts(), jsonBody({ jwt: token }), { signal, method: 'POST' }]));
    return res.json();
  },

  unlinkNihAccount: async () => {
    await fetchOrchestration('api/nih/account', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
  },

  getFenceStatus: async (provider) => {
    try {
      const res = await fetchBond(`api/link/v1/${provider}`, _.merge(authOpts(), { signal }));
      return res.json();
    } catch (error) {
      if (error.status === 404) {
        return {};
      }
      throw error;
    }
  },

  getFenceAuthUrl: async (provider, redirectUri) => {
    const queryParams = {
      scopes: ['openid', 'google_credentials', 'data', 'user'],
      redirect_uri: redirectUri,
      state: btoa(JSON.stringify({ provider })),
    };
    const res = await fetchBond(
      `api/link/v1/${provider}/authorization-url?${qs.stringify(queryParams, { indices: false })}`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },

  linkFenceAccount: async (provider, authCode, redirectUri, state) => {
    const queryParams = {
      oauthcode: authCode,
      redirect_uri: redirectUri,
      state,
    };
    const res = await fetchBond(`api/link/v1/${provider}/oauthcode?${qs.stringify(queryParams)}`, _.merge(authOpts(), { signal, method: 'POST' }));
    return res.json();
  },

  unlinkFenceAccount: (provider) => {
    return fetchBond(`api/link/v1/${provider}`, _.merge(authOpts(), { signal, method: 'DELETE' }));
  },

  externalAccount: (provider) => {
    const root = `api/oidc/v1/${provider}`;
    const queryParams = {
      scopes: ['openid', 'email', 'ga4gh_passport_v1'],
      redirectUri: `${window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin}/ecm-callback`,
    };

    return {
      get: async () => {
        try {
          const res = await fetchEcm(root, _.merge(authOpts(), { signal }));
          return res.json();
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      },

      getAuthUrl: async () => {
        const res = await fetchEcm(`${root}/authorization-url?${qs.stringify(queryParams, { indices: false })}`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      getPassport: async () => {
        const res = await fetchEcm(`${root}/passport`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      linkAccount: async (oauthcode, state) => {
        const res = await fetchEcm(
          `${root}/oauthcode?${qs.stringify({ ...queryParams, oauthcode, state }, { indices: false })}`,
          _.merge(authOpts(), { signal, method: 'POST' })
        );
        return res.json();
      },

      unlink: () => {
        return fetchEcm(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
      },
    };
  },

  isUserRegistered: async (email) => {
    try {
      await fetchSam(`api/users/v1/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'GET' }));
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
    return true;
  },

  inviteUser: (email) => {
    return fetchSam(`api/users/v1/invite/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'POST' }));
  },
});
