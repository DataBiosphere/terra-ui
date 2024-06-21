import { addDays, addHours, setMilliseconds } from 'date-fns/fp';
import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { getConfig } from 'src/libs/config';
import { getLinkExpirationAlerts } from 'src/libs/link-expiration-alerts';
import * as Nav from 'src/libs/nav';
import { AuthState } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/auth/auth', () => {
  return {
    getAuthToken: jest.fn(),
    getAuthTokenFromLocalStorage: jest.fn(),
  };
});

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/profile/external-identities/OAuth2Providers', () => ({
  allOAuth2Providers: [
    {
      key: 'fence',
      name: 'NHLBI BioData Catalyst Framework Services',
      short: 'NHLBI',
      queryParams: {
        redirectUri: 'localhost://#fence-callback',
      },
      supportsAccessToken: true,
      supportsIdToken: false,
      isFence: true,
    },
  ],
}));

describe('getLinkExpirationAlerts', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('NIH link', () => {
    it('includes alert if NIH link has expired', () => {
      const expirationDate = setMilliseconds(0, addDays(-1, new Date()));
      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: 'user@example.com',
          linkExpireTime: expirationDate.getTime() / 1000,
          datasetPermissions: [],
        },
      } as unknown as AuthState);

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'nih-link-expiration',
            title: 'Your access to NIH Controlled Access workspaces and data has expired.',
          }),
        ])
      );
    });

    it('includes alert if link will expire within the next 24 hours', () => {
      const expirationDate = setMilliseconds(0, addHours(6, new Date()));

      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: 'user@example.com',
          linkExpireTime: expirationDate.getTime() / 1000,
          datasetPermissions: [],
        },
      } as unknown as AuthState);

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'nih-link-expiration',
            title: 'Your access to NIH Controlled Access workspaces and data will expire soon.',
          }),
        ])
      );
    });

    it('does not show notification if link will not expire within the next 24 hours', () => {
      const expirationDate = setMilliseconds(0, addDays(7, new Date()));

      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: 'user@example.com',
          linkExpireTime: expirationDate.getTime() / 1000,
          datasetPermissions: [],
        },
      } as unknown as AuthState);

      expect(alerts).toEqual([]);
    });
  });

  describe('fence links', () => {
    beforeEach(() => {
      jest.spyOn(Nav, 'getLink').mockReturnValue('fence-callback');
      asMockedFn(getConfig).mockReturnValue({ externalCreds: { providers: ['fence'], urlRoot: 'https/foo.bar.com' } });
    });

    it('includes alert if link has expired', () => {
      const expirationDate = addDays(-90, new Date());

      const alerts = getLinkExpirationAlerts({
        oAuth2AccountStatus: {
          fence: {
            externalUserId: 'user@example.com',
            expirationTimestamp: expirationDate,
            authenticated: true,
          },
        },
      } as unknown as AuthState);

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'oauth2-account-link-expiration/fence',
            title: 'Your access to NHLBI BioData Catalyst Framework Services has expired.',
          }),
        ])
      );

      const message = _.find({ id: 'oauth2-account-link-expiration/fence' }, alerts)?.message;
      const { container } = render(message as ReactElement);
      expect(container).toHaveTextContent('Log in to restore your access or unlink your account.');
    });

    it('includes alert if link will expire within the next 5 days', () => {
      const expirationDate = addDays(3, new Date());

      const alerts = getLinkExpirationAlerts({
        oAuth2AccountStatus: {
          fence: {
            externalUserId: 'user@example.com',
            expirationTimestamp: expirationDate,
            authenticated: true,
          },
        },
      } as unknown as AuthState);

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'oauth2-account-link-expiration/fence',
            title: 'Your access to NHLBI BioData Catalyst Framework Services will expire in 3 day(s).',
          }),
        ])
      );

      const message = _.find({ id: 'oauth2-account-link-expiration/fence' }, alerts)?.message;
      const { container } = render(message as ReactElement);
      expect(container).toHaveTextContent('Log in to renew your access or unlink your account.');
    });

    it('does not include alert if link will not expire within the next 5 days', () => {
      const expirationDate = addDays(30, new Date());

      const alerts = getLinkExpirationAlerts({
        oAuth2AccountStatus: {
          fence: {
            externalUserId: 'user@example.com',
            expirationTimestamp: expirationDate,
            authenticated: true,
          },
        },
      } as unknown as AuthState);

      expect(alerts).toEqual([]);
    });
  });
});
