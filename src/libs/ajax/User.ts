import _ from 'lodash/fp';
import * as qs from 'qs';
import {
  authOpts,
  fetchBond,
  fetchEcm,
  fetchOrchestration,
  fetchRex,
  fetchSam,
  jsonBody,
} from 'src/libs/ajax/ajax-common';
import { getConfig } from 'src/libs/config';
import { getBlankProfile, getTerraUser, TerraUserProfile } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

export interface SamUserRegistrationStatusResponse {
  userSubjectId: string;
  userEmail: string;
  enabled: boolean;
}

export interface SamUserTosStatusResponse {
  userInfo: {
    userSubjectId: string;
    userEmail: string;
  };
  enabled: {
    ldap: boolean;
    allUsersGroup: boolean;
    google: boolean;
  };
}

export interface SamUserTosComplianceStatusResponse {
  userId: string;
  userHasAcceptedLatestTos: boolean;
  permitsSystemUsage: boolean;
}

export interface OrchestrationUserProfileResponse {
  userId: string;
  keyValuePairs: { key: string; value: string }[];
}

export interface OrchestrationUserPreferLegacyFireCloudResponse {
  preferTerra: boolean;
  preferTerraLastUpdated: number;
}

export interface NihDatasetPermission {
  name: string;
  authorized: boolean;
}

export interface OrchestrationNihStatusResponse {
  linkedNihUsername: string;
  datasetPermissions: NihDatasetPermission[];
  linkExpireTime: number;
}

export interface BondFenceUrlResponse {
  url: string;
}

export interface BondFenceStatusResponse {
  issued_at: Date;
  username: string;
}

export interface EcmLinkAccountResponse {
  externalUserId: string;
  expirationTimestamp: Date;
  authenticated: boolean;
}

export interface SamInviteUserResponse {
  userSubjectId: string;
  userEmail: string;
}

export interface RexFirstTimestampResponse {
  timestamp: Date;
}

// TODO: Remove this as a part of https://broadworkbench.atlassian.net/browse/ID-460
const getFirstTimeStamp = Utils.memoizeAsync(
  async (token): Promise<RexFirstTimestampResponse> => {
    const res = await fetchRex('firstTimestamps/record', _.mergeAll([authOpts(token), { method: 'POST' }]));
    return res.json();
  },
  { keyFn: (...args) => JSON.stringify(args) }
) as (token: string) => Promise<RexFirstTimestampResponse>;

export const User = (signal?: AbortSignal) => {
  return {
    getStatus: async (): Promise<SamUserRegistrationStatusResponse> => {
      const res = await fetchSam('register/user/v2/self/info', _.mergeAll([authOpts(), { signal }]));
      return res.json();
    },

    profile: {
      get: async (): Promise<OrchestrationUserProfileResponse> => {
        const res = await fetchOrchestration('register/profile', _.merge(authOpts(), { signal }));
        return res.json();
      },

      // We are not calling Thurloe directly because free credits logic was in orchestration
      set: async (profile: TerraUserProfile): Promise<void> => {
        return fetchOrchestration(
          'register/profile',
          _.mergeAll([authOpts(), jsonBody(_.merge(getBlankProfile(), profile)), { signal, method: 'POST' }])
        );
      },

      setPreferences: async (body: {}): Promise<void> => {
        return fetchOrchestration(
          'api/profile/preferences',
          _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }])
        );
      },

      preferLegacyFirecloud: async (): Promise<OrchestrationUserPreferLegacyFireCloudResponse> => {
        return fetchOrchestration('api/profile/terra', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
      },
    },

    // Returns the proxy group email of the user with the given email
    getProxyGroup: async (email: string): Promise<string> => {
      const res = await fetchOrchestration(
        `api/proxyGroup/${encodeURIComponent(email)}`,
        _.merge(authOpts(), { signal })
      );
      return res.json();
    },

    getTos: async (): Promise<string> => {
      const response = await fetchSam('tos/text', _.merge(authOpts(), { signal }));
      return response.text();
    },

    acceptTos: async (): Promise<SamUserTosStatusResponse | undefined> => {
      try {
        const response = await fetchSam(
          'register/user/v1/termsofservice',
          _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody('app.terra.bio/#terms-of-service')])
        );
        return response.json();
      } catch (error: unknown) {
        if (!(error instanceof Response && error.status === 404)) {
          throw error;
        }
      }
    },

    rejectTos: async (): Promise<SamUserTosStatusResponse | undefined> => {
      try {
        const response = await fetchSam(
          'register/user/v1/termsofservice',
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }])
        );
        return response.json();
      } catch (error: unknown) {
        if (!(error instanceof Response && error.status === 404)) {
          throw error;
        }
      }
    },

    getTermsOfServiceComplianceStatus: async (): Promise<SamUserTosComplianceStatusResponse | null> => {
      try {
        const res = await fetchSam(
          'register/user/v2/self/termsOfServiceComplianceStatus',
          _.merge(authOpts(), { signal })
        );
        return res.json();
      } catch (error: unknown) {
        if (error instanceof Response && (error.status === 404 || error.status === 403)) {
          return null;
        }
        throw error;
      }
    },

    getPrivacyPolicy: async (): Promise<string> => {
      const response = await fetchSam('privacy/text', _.merge(authOpts(), { signal }));
      return response.text();
    },

    firstTimestamp: (): Promise<RexFirstTimestampResponse> => {
      return getFirstTimeStamp(getTerraUser().token!);
    },

    getNihStatus: async (): Promise<OrchestrationNihStatusResponse | undefined> => {
      try {
        const res = await fetchOrchestration('api/nih/status', _.merge(authOpts(), { signal }));
        return res.json();
      } catch (error: unknown) {
        if (error instanceof Response && error.status === 404) {
          return;
        }
        throw error;
      }
    },

    linkNihAccount: async (token: string): Promise<OrchestrationNihStatusResponse> => {
      const res = await fetchOrchestration(
        'api/nih/callback',
        _.mergeAll([authOpts(), jsonBody({ jwt: token }), { signal, method: 'POST' }])
      );
      return res.json();
    },

    unlinkNihAccount: async (): Promise<void> => {
      await fetchOrchestration('api/nih/account', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]));
    },

    getFenceStatus: async (providerKey: string): Promise<BondFenceStatusResponse | {}> => {
      try {
        const res = await fetchBond(`api/link/v1/${providerKey}`, _.merge(authOpts(), { signal }));
        return res.json();
      } catch (error: unknown) {
        if (error instanceof Response && error.status === 404) {
          return {};
        }
        throw error;
      }
    },

    getFenceAuthUrl: async (providerKey: string, redirectUri: string): Promise<BondFenceUrlResponse> => {
      const queryParams = {
        scopes: ['openid', 'google_credentials', 'data', 'user'],
        redirect_uri: redirectUri,
        state: btoa(JSON.stringify({ providerKey })),
      };
      const res = await fetchBond(
        `api/link/v1/${providerKey}/authorization-url?${qs.stringify(queryParams, { indices: false })}`,
        _.merge(authOpts(), { signal })
      );
      return res.json();
    },

    linkFenceAccount: async (
      providerKey: string,
      authCode: string | undefined,
      redirectUri: string,
      state: string
    ): Promise<BondFenceStatusResponse> => {
      const queryParams = {
        oauthcode: authCode,
        redirect_uri: redirectUri,
        state,
      };
      const res = await fetchBond(
        `api/link/v1/${providerKey}/oauthcode?${qs.stringify(queryParams)}`,
        _.merge(authOpts(), { signal, method: 'POST' })
      );
      return res.json();
    },

    unlinkFenceAccount: async (providerKey: string): Promise<void> => {
      return fetchBond(`api/link/v1/${providerKey}`, _.merge(authOpts(), { signal, method: 'DELETE' }));
    },

    externalAccount: (providerKey: string) => {
      const root = `api/oidc/v1/${providerKey}`;
      const queryParams = {
        scopes: ['openid', 'email', 'ga4gh_passport_v1'],
        redirectUri: `${
          window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin
        }/ecm-callback`,
      };

      return {
        get: async (): Promise<string[] | null> => {
          try {
            const res = await fetchEcm(root, _.merge(authOpts(), { signal }));
            return res.json();
          } catch (error: unknown) {
            if (error instanceof Response && error.status === 404) {
              return null;
            }
            throw error;
          }
        },

        getAuthUrl: async (): Promise<string> => {
          const res = await fetchEcm(
            `${root}/authorization-url?${qs.stringify(queryParams, { indices: false })}`,
            _.merge(authOpts(), { signal })
          );
          return res.json();
        },

        getPassport: async (): Promise<{}> => {
          const res = await fetchEcm(`${root}/passport`, _.merge(authOpts(), { signal }));
          return res.json();
        },

        linkAccount: async (oauthcode: string, state: string): Promise<EcmLinkAccountResponse> => {
          const res = await fetchEcm(
            `${root}/oauthcode?${qs.stringify({ ...queryParams, oauthcode, state }, { indices: false })}`,
            _.merge(authOpts(), { signal, method: 'POST' })
          );
          return res.json();
        },

        unlink: async (): Promise<void> => {
          return fetchEcm(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
        },
      };
    },

    isUserRegistered: async (email: string): Promise<boolean> => {
      try {
        await fetchSam(`api/users/v1/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'GET' }));
      } catch (error: unknown) {
        if (error instanceof Response && error.status === 404) {
          return false;
        }
        throw error;
      }
      return true;
    },

    inviteUser: async (email: string): Promise<SamInviteUserResponse> => {
      return fetchSam(
        `api/users/v1/invite/${encodeURIComponent(email)}`,
        _.merge(authOpts(), { signal, method: 'POST' })
      );
    },
  };
};
