import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-options';
import { fetchSam } from 'src/libs/ajax/ajax-common';

export interface SamUserTermsOfServiceDetails {
  latestAcceptedVersion?: string;
  acceptedOn?: Date;
  permitsSystemUsage: boolean;
  isCurrentVersion: boolean;
}

export type SamTermsOfServiceConfig = {
  enforced: boolean;
  currentVersion: string;
  inRollingAcceptanceWindow: boolean;
};

export const TermsOfService = (signal?: AbortSignal) => {
  return {
    getTermsOfServiceText: async (): Promise<string> => {
      const res = await fetchSam('termsOfService/v1/docs?doc=termsOfService', { signal });
      return res.text();
    },
    getPrivacyPolicyText: async (): Promise<string> => {
      const res = await fetchSam('termsOfService/v1/docs?doc=privacyPolicy', { signal });
      return res.text();
    },
    acceptTermsOfService: async (): Promise<void> => {
      return await fetchSam(
        'api/termsOfService/v1/user/self/accept',
        _.mergeAll([authOpts(), { signal, method: 'PUT' }])
      );
    },
    rejectTermsOfService: async (): Promise<void> => {
      return await fetchSam(
        'api/termsOfService/v1/user/self/reject',
        _.mergeAll([authOpts(), { signal, method: 'PUT' }])
      );
    },
    getUserTermsOfServiceDetails: async (): Promise<SamUserTermsOfServiceDetails> => {
      try {
        const res = await fetchSam('api/termsOfService/v1/user/self', _.merge(authOpts(), { signal }));
        return res.json();
      } catch (error: unknown) {
        if (error instanceof Response && error.status === 404) {
          return {
            latestAcceptedVersion: undefined,
            acceptedOn: undefined,
            permitsSystemUsage: false,
            isCurrentVersion: false,
          };
        }
        throw error;
      }
    },
    getTermsOfServiceConfig: async (): Promise<SamTermsOfServiceConfig> => {
      const res = await fetchSam('termsOfService/v1', { signal });
      return res.json();
    },
  };
};

export type TermsOfServiceContract = ReturnType<typeof TermsOfService>;
