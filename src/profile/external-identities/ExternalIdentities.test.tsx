import { act, screen } from '@testing-library/react';
import React from 'react';
import { getConfig } from 'src/libs/config';
import { TerraUserState, userStore } from 'src/libs/state';
import { ExternalIdentities } from 'src/profile/external-identities/ExternalIdentities';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/profile/external-identities/OAuth2Link', () => ({
  ...jest.requireActual('src/profile/external-identities/OAuth2Link'),
  OAuth2Link: jest.fn((props) => <div>{props.provider.name}</div>),
}));

jest.mock('src/profile/external-identities/OAuth2Link', () => ({
  ...jest.requireActual('src/profile/external-identities/OAuth2Link'),
  OAuth2Link: jest.fn((props) => <div>{props.provider.name}</div>),
}));

jest.mock('src/profile/external-identities/FenceAccount', () => ({
  ...jest.requireActual('src/profile/external-identities/FenceAccount'),
  FenceAccount: jest.fn((props) => <div>{props.provider.name}</div>),
}));

jest.mock('src/profile/external-identities/NihAccount', () => ({
  ...jest.requireActual('src/profile/external-identities/NihAccount'),
  NihAccount: jest.fn(() => <div>Nih Account</div>),
}));
describe('ExternalIdentities', () => {
  beforeEach(() =>
    getConfig.mockReturnValue({ externalCreds: { providers: ['github'], urlRoot: 'https/foo.bar.com' } })
  );
  describe('when the user has access to GitHub Account Linking', () => {
    it('shows the GitHub Account Linking card', async () => {
      // Arrange
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
      await act(async () => {
        userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: [] }));
      });

      // Act
      render(<ExternalIdentities queryParams={{}} />);

      // Assert
      expect(screen.queryByText('GitHub')).toBeNull();
    });
  });
});
