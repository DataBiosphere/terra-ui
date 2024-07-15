import { oauth2Provider, OAuth2ProviderKey } from 'src/profile/external-identities/OAuth2Providers';

describe('OAuth2Provider', () => {
  it.each(['github', 'ras', 'era-commons', 'fence', 'dcf-fence', 'kids-first', 'anvil'] as Array<OAuth2ProviderKey>)(
    'should return the correct provider for %s',
    (providerKey) => {
      const provider = oauth2Provider(providerKey);
      expect(provider.key).toEqual(providerKey);
    }
  );
});
