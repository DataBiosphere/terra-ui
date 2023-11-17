import _ from 'lodash/fp';
import { authOpts, fetchSam } from 'src/libs/ajax/ajax-common';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/User';

export const TermsOfService = (signal?: AbortSignal) => {
  return {
    getTermsOfServiceText: async (): Promise<string> => {
      const res = await fetchSam('termsOfService/v1/docs?doc=termsOfService', { signal });
      return res.text();
    },
    getPrivacyText: async (): Promise<string> => {
      const res = await fetchSam('termsOfService/v1/docs?doc=privacyPolicy', { signal });
      return res.text();
    },
    acceptTermsOfServiceFor: async (): Promise<void> => {
      const response = await fetchSam(
        '/api/termsOfService/v1/user/self/accept',
        _.mergeAll([authOpts(), { signal, method: 'PUT' }])
      );
      return response.json();
    },
    rejectTermsOfService: async (): Promise<void> => {
      const response = await fetchSam(
        '/api/termsOfService/v1/user/self/reject',
        _.mergeAll([authOpts(), { signal, method: 'PUT' }])
      );
      return response.json();
    },
    getUserTermsOfServiceDetails: async (): Promise<SamUserTermsOfServiceDetails> => {
      const res = await fetchSam('/api/termsOfService/v1/user/self', _.merge(authOpts(), { signal }));
      return res.json();
    },
  };
};
