import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import React from 'react';
import { AppConfigSettings, getConfig } from 'src/libs/config';
import { TerraUserState, userStore } from 'src/libs/state';
import { ExternalIdentities } from 'src/profile/external-identities/ExternalIdentities';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/profile/external-identities/OAuth2Account', () => ({
  ...jest.requireActual('src/profile/external-identities/OAuth2Account'),
  OAuth2Account: jest.fn((props) => <div>{props.provider.name}</div>),
}));

describe('ExternalIdentities', () => {
  describe('when the user has access to GitHub Account Linking', () => {
    it('shows the GitHub Account Linking card', async () => {
      // Arrange
      asMockedFn(getConfig).mockReturnValue(
        partial<AppConfigSettings>({
          externalCreds: { providers: ['github'], urlRoot: 'https/foo.bar.com' },
        })
      );
      await act(async () => {
        userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: ['github-account-linking'] }));
      });

      // Act
      render(<ExternalIdentities queryParams={{}} />);

      // Assert
      screen.getByText('GitHub');
    });
  });
  describe('when the user does not have access to GitHub Account Linking', () => {
    it('hides the GitHub Account Linking card', async () => {
      // Arrange
      asMockedFn(getConfig).mockReturnValue(
        partial<AppConfigSettings>({
          externalCreds: { providers: ['github'], urlRoot: 'https/foo.bar.com' },
        })
      );
      await act(async () => {
        userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: [] }));
      });

      // Act
      render(<ExternalIdentities queryParams={{}} />);

      // Assert
      expect(screen.queryByText('GitHub')).toBeNull();
    });
  });

  it('sorts providers based on desiredOrder', async () => {
    // Arrange
    asMockedFn(getConfig).mockReturnValue(
      partial<AppConfigSettings>({
        externalCreds: partial<AppConfigSettings['externalCreds']>({
          providers: ['ras', 'fence', 'dcf-fence', 'kids-first', 'sage'],
        }),
      })
    );
    // Act
    render(<ExternalIdentities queryParams={{}} />);

    // Assert
    const providerElements = Array.from(screen.getByRole('main').querySelectorAll('div')).map((div) => div.textContent);
    expect(providerElements).toStrictEqual([
      'NIH Researcher Auth Service (RAS)',
      'NHLBI BioData Catalyst Framework Services',
      'NCI CRDC Framework Services',
      'Kids First DRC Framework Services',
      'Sage Bionetworks',
    ]);
  });
});
