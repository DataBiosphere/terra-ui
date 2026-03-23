import { oauth2Provider, OAuth2ProviderKey } from 'src/profile/external-identities/OAuth2Providers';

describe('OAuth2Provider', () => {
  it.each(['github', 'ras', 'fence', 'dcf-fence', 'kids-first', 'sage'] as Array<OAuth2ProviderKey>)(
    'should return the correct provider for %s',
    (providerKey) => {
      const provider = oauth2Provider(providerKey);
      expect(provider.key).toEqual(providerKey);
    }
  );
  it.each([
    { key: 'ras', expectedToolTip: true },
    { key: 'fence', expectedToolTip: true },
    { key: 'dcf-fence', expectedToolTip: true },
    { key: 'kids-first', expectedToolTip: true },
    { key: 'github', expectedToolTip: false },
    { key: 'sage', expectedToolTip: true },
  ] as Array<{ key: OAuth2ProviderKey; expectedToolTip: boolean }>)(
    'should have toolTip set correctly for %s',
    ({ key, expectedToolTip }) => {
      const provider = oauth2Provider(key);
      if (expectedToolTip) {
        expect(provider.toolTip).toBeDefined();
      } else {
        expect(provider.toolTip).toBeUndefined();
      }
    }
  );
});
