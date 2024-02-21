import { oauth2Provider } from 'src/profile/external-identities/OAuth2Providers';

describe('OAuth2Provider', () => {
  it('should return the correct provider for GitHub', () => {
    const githubProvider = oauth2Provider('github');
    expect(githubProvider.name).toEqual('GitHub');
  });
  it('should return the correct provider for RAS', () => {
    const githubProvider = oauth2Provider('ras');
    expect(githubProvider.name).toEqual('RAS');
  });
});
