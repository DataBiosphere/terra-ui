import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { getCurrentRoute } from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import { OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { OAuth2Link } from './OAuth2Link';

jest.mock('src/libs/ajax');

jest.mock('src/auth/auth', () => ({
  ...jest.requireActual('src/auth/auth'),
  loadTerraUser: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    goToPath: jest.fn(),
    getLink: jest.fn(),
    getCurrentRoute: jest.fn().mockReturnValue({ path: '/#profile?tab=externalIdentities' }),
  })
);

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

const testAccessTokenProvider: OAuth2Provider = {
  key: 'github',
  name: 'Test Provider',
  queryParams: {
    redirectUri: 'localhost/oauth_callback',
  },
  supportsAccessToken: true,
  supportsIdToken: false,
};

describe('OAuth2Link', () => {
  describe('When no account is linked', () => {
    it('shows the button to link an account', async () => {
      // Arrange
      const getLinkStatusFn = jest.fn().mockResolvedValue(undefined);
      const getAuthorizationUrlFn = jest.fn().mockResolvedValue('https://foo.bar.com/oauth2/authorize');
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                getAccountLinkStatus: getLinkStatusFn,
                getAuthorizationUrl: getAuthorizationUrlFn,
              };
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      const { container } = await act(() => render(<OAuth2Link queryParams={{}} provider={testAccessTokenProvider} />));

      // Assert
      screen.getByText(`Link your ${testAccessTokenProvider.name} account`);
      expect(getLinkStatusFn).toHaveBeenCalled();
      expect(getAuthorizationUrlFn).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
  describe('When the link account button is clicked', () => {
    it('reaches out to ECM to get an authorization url and opens a new window/tab', async () => {
      // Arrange
      global.open = jest.fn(); // this needs to be here, but I can't seem to actually check if its called
      const getLinkStatusFn = jest.fn().mockResolvedValue(undefined);
      const getAuthorizationUrlFn = jest.fn().mockResolvedValue('https://foo.bar.com/oauth2/authorize');
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                getAccountLinkStatus: getLinkStatusFn,
                getAuthorizationUrl: getAuthorizationUrlFn,
              };
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      await act(() => render(<OAuth2Link queryParams={{}} provider={testAccessTokenProvider} />));

      // Assert
      const button = screen.getByText(`Link your ${testAccessTokenProvider.name} account`);
      fireEvent.click(button);
      expect(getAuthorizationUrlFn).toHaveBeenCalled();
    });
    it('links the account when the user is redirected back to Terra', async () => {
      // Arrange
      asMockedFn(getCurrentRoute).mockImplementation(() => ({ name: 'oauth-callback' }));
      const queryParams = {
        oauthcode: 'abcde12345',
        state: btoa(JSON.stringify({ provider: testAccessTokenProvider.key, nonce: 'abcxyz' })),
      };
      const getLinkStatusFn = jest.fn().mockResolvedValue(undefined);
      const getAuthorizationUrlFn = jest.fn().mockResolvedValue('https://foo.bar.com/oauth2/authorize');
      const linkAccountFn = jest
        .fn()
        .mockResolvedValue({ externalUserId: 'testUser', expirationTimestamp: new Date(), authenticated: true });
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                getAccountLinkStatus: getLinkStatusFn,
                getAuthorizationUrl: getAuthorizationUrlFn,
                linkAccountWithAuthorizationCode: linkAccountFn,
              };
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      await act(() => render(<OAuth2Link queryParams={queryParams} provider={testAccessTokenProvider} />));

      // Assert
      expect(linkAccountFn).toHaveBeenCalled();
    });
  });
  describe('When an account is already linked', () => {
    it('shows the linked account status', async () => {
      // Arrange
      const linkStatus = { externalUserId: 'testUser', expirationTimestamp: new Date(), authenticated: true };
      const getLinkStatusFn = jest.fn().mockResolvedValue(linkStatus);
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                getAccountLinkStatus: getLinkStatusFn,
              };
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      await act(() => render(<OAuth2Link queryParams={{}} provider={testAccessTokenProvider} />));

      // Assert
      expect(getLinkStatusFn).toHaveBeenCalled();

      screen.getByText('Renew');
      screen.getByText('Unlink');
      screen.getByText('Username:');
      screen.getByText(linkStatus.externalUserId);
      screen.getByText('Link Expiration:');
      screen.getByText(Utils.makeCompleteDate(linkStatus.expirationTimestamp));
    });
    it("unlinks the account when 'Unlink' is clicked", async () => {
      // Arrange
      const linkStatus = { externalUserId: 'testUser', expirationTimestamp: new Date(), authenticated: true };
      const getLinkStatusFn = jest.fn().mockResolvedValue(linkStatus);
      const unlinkAccountFn = jest.fn().mockResolvedValue(undefined);
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                getAccountLinkStatus: getLinkStatusFn,
                unlinkAccount: unlinkAccountFn,
              };
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      const { container } = await act(() => render(<OAuth2Link queryParams={{}} provider={testAccessTokenProvider} />));
      const unlinkButton = screen.getByText('Unlink');
      await act(() => fireEvent.click(unlinkButton));

      // Assert
      expect(unlinkAccountFn).toHaveBeenCalled();
      screen.getByText(`Link your ${testAccessTokenProvider.name} account`);

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
