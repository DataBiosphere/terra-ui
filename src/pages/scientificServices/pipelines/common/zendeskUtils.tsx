// Enum representing different documentation keys
export enum DocsKey {
  GETTING_STARTED = 'GETTING_STARTED',
  ABOUT_SERVICE = 'ABOUT_SERVICE',
  INPUT_REQ = 'INPUT_REQ',
  QUOTA_DETAILS = 'QUOTA_DETAILS',
}

// Mapping of documentation keys to their respective Zendesk URLs
const ZENDESK_PAGES: Record<DocsKey, string> = {
  GETTING_STARTED: 'https://broadscientificservices.zendesk.com/hc/en-us/sections/39901025462171',
  ABOUT_SERVICE: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/39901941351323',
  INPUT_REQ: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/40161675448859',
  QUOTA_DETAILS: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/39903092619035',
};

// Retrieve the Zendesk URL based on the provided documentation key
export const zendeskUrl = (key: DocsKey): string => {
  // typescript should make sure all keys are valid, but just in case, default to the home page
  return ZENDESK_PAGES[key] ?? ZENDESK_PAGES.GETTING_STARTED;
};
