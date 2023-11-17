import { fetchSam } from 'src/libs/ajax/ajax-common';

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
  };
};
