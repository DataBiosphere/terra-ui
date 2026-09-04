import { render } from '@testing-library/react';
import React from 'react';
import { DocsKey, ZendeskLink, zendeskUrl } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';

describe('zendeskUtils', () => {
  describe('zendeskUrl', () => {
    it('returns the correct URL for ARRAY_IMPUTATION_INPUT_REQ', () => {
      expect(zendeskUrl(DocsKey.ARRAY_IMPUTATION_INPUT_REQ)).toBe(
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/40161675448859'
      );
    });

    it('returns the default URL for an unknown DocsKey', () => {
      // @ts-expect-error Testing invalid key
      expect(zendeskUrl('UNKNOWN_KEY')).toBe(
        'https://broadscientificservices.zendesk.com/hc/en-us/sections/39901025462171' // Getting Started URL
      );
    });
  });

  describe('ZendeskLink', () => {
    it('renders correctly with given children and href', () => {
      const { getByText } = render(
        <ZendeskLink docsKey={DocsKey.QUOTA_DETAILS} additionalStyle={{ fontWeight: 'italics' }}>
          Link to my excellent documentation
        </ZendeskLink>
      );

      const linkElement = getByText('Link to my excellent documentation');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute(
        'href',
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/39903092619035'
      );
      expect(linkElement).toHaveStyle('font-weight: italics');
    });
  });
});
