import { fetchSam } from 'src/libs/ajax/ajax-common';

export const TermsOfService = (signal?: AbortSignal) => {
  return {
    getTermsOfServiceText: async (): Promise<string> => {
      const res = await fetchSam('tos/text', { signal });
      return res.text();
    },
    getPrivacyText: async (): Promise<string> => {
      const res = await fetchSam('privacy/text', { signal });
      return res.text();
    },
  };
};
