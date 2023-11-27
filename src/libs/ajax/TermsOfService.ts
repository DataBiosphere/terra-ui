import _ from 'lodash/fp';
import { authOpts, fetchSam } from 'src/libs/ajax/ajax-common';

export interface SamUserTermsOfServiceDetails {
  latestAcceptedVersion: string;
  acceptedOn: Date;
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
      const res = await fetchSam('api/termsOfService/v1/user/self', _.merge(authOpts(), { signal }));
      return res.json();
    },
    getTermsOfServiceConfig: async (): Promise<SamTermsOfServiceConfig> => {
      const res = await fetchSam('termsOfService/v1', { signal });
      return res.json();
    },
  };
};
