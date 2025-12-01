import { DocsKey, zendeskUrl } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';

describe('zendeskUtils', () => {
  describe('zendeskUrl', () => {
    it('returns the correct URL for INPUT_REQ', () => {
      expect(zendeskUrl(DocsKey.INPUT_REQ)).toBe(
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
});
