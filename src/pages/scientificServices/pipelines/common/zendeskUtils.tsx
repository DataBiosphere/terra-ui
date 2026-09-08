// Enum representing different documentation keys
import React from 'react';

export enum DocsKey {
  GETTING_STARTED = 'GETTING_STARTED',
  ABOUT_SERVICE = 'ABOUT_SERVICE',
  ARRAY_IMPUTATION_INPUT_REQ = 'ARRAY_IMPUTATION_INPUT_REQ',
  LOW_PASS_IMPUTATION_INPUT_REQ = 'LOW_PASS_IMPUTATION_INPUT_REQ',
  QUOTA_DETAILS = 'QUOTA_DETAILS',
  CLOUD_INPUTS = 'CLOUD_INPUTS',
  CLOUD_OUTPUTS = 'CLOUD_OUTPUTS',
}

// Mapping of documentation keys to their respective Zendesk URLs
const ZENDESK_PAGES: Record<DocsKey, string> = {
  GETTING_STARTED: 'https://broadscientificservices.zendesk.com/hc/en-us/sections/39901025462171',
  ABOUT_SERVICE: 'https://broadscientificservices.zendesk.com/hc/en-us/categories/39900993442459',
  ARRAY_IMPUTATION_INPUT_REQ: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/40161675448859',
  LOW_PASS_IMPUTATION_INPUT_REQ:
    'https://broadscientificservices.zendesk.com/hc/en-us/articles/50837430347675-Input-Requirements',
  QUOTA_DETAILS: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/39903092619035',
  CLOUD_INPUTS: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/47099858889243',
  CLOUD_OUTPUTS: 'https://broadscientificservices.zendesk.com/hc/en-us/articles/48878810499483',
};

// Retrieve the Zendesk URL based on the provided documentation key
export const zendeskUrl = (key: DocsKey): string => {
  // typescript should make sure all keys are valid, but just in case, default to the home page
  return ZENDESK_PAGES[key] ?? ZENDESK_PAGES.GETTING_STARTED;
};

// Renders a component with link to the specified Zendesk documentation page
export const ZendeskLink = ({
  docsKey,
  additionalStyle,
  children,
}: {
  docsKey: DocsKey;
  additionalStyle?;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={zendeskUrl(docsKey)}
      target='_blank'
      style={{ color: '#46A3E9', textDecoration: 'underline', ...additionalStyle }}
      rel='noreferrer'
    >
      {children}
    </a>
  );
};
