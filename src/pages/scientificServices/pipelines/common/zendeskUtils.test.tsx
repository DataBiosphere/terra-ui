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

    it('returns the correct URL for CLOUD_INPUTS', () => {
      expect(zendeskUrl(DocsKey.CLOUD_INPUTS)).toBe(
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/47099858889243'
      );
    });

    it('returns the correct URL for CLOUD_OUTPUTS', () => {
      expect(zendeskUrl(DocsKey.CLOUD_OUTPUTS)).toBe(
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/48878810499483'
      );
    });

    it('returns the correct URL for LOW_PASS_IMPUTATION_INPUT_REQ', () => {
      expect(zendeskUrl(DocsKey.LOW_PASS_IMPUTATION_INPUT_REQ)).toBe(
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/50837430347675-Input-Requirements'
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

    it('renders correctly for the CLOUD_INPUTS docs key', () => {
      const { getByText } = render(
        <ZendeskLink docsKey={DocsKey.CLOUD_INPUTS}>provide inputs from the cloud</ZendeskLink>
      );

      const linkElement = getByText('provide inputs from the cloud');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute(
        'href',
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/47099858889243'
      );
    });

    it('opens in a new tab and has the expected default style when no additionalStyle is provided', () => {
      const { getByText } = render(<ZendeskLink docsKey={DocsKey.CLOUD_OUTPUTS}>cloud outputs link</ZendeskLink>);

      const linkElement = getByText('cloud outputs link');
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noreferrer');
      expect(linkElement).toHaveStyle('color: #46A3E9');
      expect(linkElement).toHaveStyle('text-decoration: underline');
    });
  });
});
