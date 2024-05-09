import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import { getCurrentRoute } from 'src/libs/nav';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { OAuth2Account } from './OAuth2Account';

jest.mock('src/libs/ajax');

jest.mock('src/auth/auth', () => ({
  ...jest.requireActual('src/auth/auth'),
  loadTerraUser: jest.fn(),
}));

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ externalCreds: { providers: ['github'], urlRoot: 'https/foo.bar.com' } }),
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
  short: 'Test',
  queryParams: {
    redirectUri: 'localhost/oauth_callback',
  },
  supportsAccessToken: true,
  supportsIdToken: false,
  isFence: false,
};

describe('OAuth2Account', () => {
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
      const { container } = await act(() =>
        render(<OAuth2Account queryParams={{}} provider={testAccessTokenProvider} />)
      );

      // Assert
      screen.getByText(`Log in to ${testAccessTokenProvider.short}`);
      expect(getAuthorizationUrlFn).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
  describe('When the link account button is clicked', () => {
    it('reaches out to ECM to get an authorization url and opens a new window/tab', async () => {
      // Arrange
      const user = userEvent.setup();
      jest.spyOn(window, 'open').mockImplementation(() => null);
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
      await act(() => render(<OAuth2Account queryParams={{}} provider={testAccessTokenProvider} />));

      // Assert
      const button = screen.getByText(`Log in to ${testAccessTokenProvider.short}`);
      await user.click(button);
      expect(getAuthorizationUrlFn).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalled();
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
      const captureEventFn = jest.fn();

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
            Metrics: {
              captureEvent: captureEventFn,
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      await act(() => render(<OAuth2Account queryParams={queryParams} provider={testAccessTokenProvider} />));

      // Assert
      expect(linkAccountFn).toHaveBeenCalled();
      expect(captureEventFn).toHaveBeenCalledWith(Events.user.externalCredential.link, {
        provider: testAccessTokenProvider.key,
      });
    });
  });
  describe('When an account is already linked', () => {
    it('shows the linked account status', async () => {
      // Arrange
      const linkStatus = { externalUserId: 'testUser', expirationTimestamp: new Date(), authenticated: true };
      authStore.update((state) => ({ ...state, oAuth2AccountStatus: { [testAccessTokenProvider.key]: linkStatus } }));
      // Act
      await act(() => render(<OAuth2Account queryParams={{}} provider={testAccessTokenProvider} />));

      // Assert
      screen.getByText(`Renew your ${testAccessTokenProvider.short} link`);
      screen.getByText('Unlink');
      screen.getByText('Username:');
      screen.getByText(linkStatus.externalUserId);
      screen.getByText('Link Expiration:');
      screen.getByText(Utils.makeCompleteDate(linkStatus.expirationTimestamp));
    });
    it("unlinks the account when 'Unlink' is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const linkStatus = { externalUserId: 'testUser', expirationTimestamp: new Date(), authenticated: true };
      authStore.update((state) => ({ ...state, oAuth2AccountStatus: { [testAccessTokenProvider.key]: linkStatus } }));
      const unlinkAccountFn = jest.fn().mockResolvedValue(undefined);
      const captureEventFn = jest.fn();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            ExternalCredentials: () => {
              return {
                unlinkAccount: unlinkAccountFn,
              };
            },
            Metrics: {
              captureEvent: captureEventFn,
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
      // Act
      const { container } = await act(() =>
        render(<OAuth2Account queryParams={{}} provider={testAccessTokenProvider} />)
      );
      const unlinkButton = screen.getByText('Unlink');
      await user.click(unlinkButton);

      const okButton = screen.getByText('OK');
      await user.click(okButton);

      // Assert
      expect(unlinkAccountFn).toHaveBeenCalled();
      screen.getByText(`Log in to ${testAccessTokenProvider.short}`);

      expect(captureEventFn).toHaveBeenCalledWith(Events.user.externalCredential.unlink, {
        provider: testAccessTokenProvider.key,
      });

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
