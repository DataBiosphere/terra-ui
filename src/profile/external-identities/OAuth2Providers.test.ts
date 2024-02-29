import { oauth2Provider, OAuth2ProviderKey } from 'src/profile/external-identities/OAuth2Providers';

describe('OAuth2Provider', () => {
  it.each(['github', 'ras'] as Array<OAuth2ProviderKey>)('should return the correct provider for %s', (providerKey) => {
    const githubProvider = oauth2Provider(providerKey);
    expect(githubProvider.key).toEqual(providerKey);
  });
});
