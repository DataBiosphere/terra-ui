import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore, FenceStatus } from 'src/libs/state';
import { FenceAccount } from 'src/profile/external-identities/FenceAccount';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

// Mocking for Nav.getLink
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => ''),
    useRoute: jest.fn(() => 'fence-callback'),
  })
);

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

jest.mock('src/libs/ajax');

const nhlbi = {
  key: 'fence',
  provider: {
    key: 'fence',
    name: 'NHLBI BioData Catalyst Framework Services',
    expiresAfter: 30,
    short: 'NHLBI',
  },
};

const fenceStatus: FenceStatus = {
  fence: {
    issued_at: new Date(Date.now()),
    username: 'bojackhorseman',
  },
};

type AjaxContract = ReturnType<typeof Ajax>;
type MetricsPartial = Partial<AjaxContract['Metrics']>;
type UserPartial = Partial<AjaxContract['User']>;

describe('FenceLink', () => {
  describe('when the user has not linked a fence account', () => {
    it('renders the login button', async () => {
      // Arrange

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as MetricsPartial,
            User: { getFenceAuthUrl: jest.fn().mockReturnValue({ url: 'https://foo.bar' }) } as UserPartial,
          } as AjaxContract)
      );
      // Act
      await act(async () => {
        renderWithAppContexts(h(FenceAccount, nhlbi));
      });

      // Assert
      expect(screen.getByText('Log in to NHLBI'));
    });
  });

  describe('when a user has linked a fence account', () => {
    it('renders the status of the Fence Account link', async () => {
      // Arrange

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as MetricsPartial,
            User: { getFenceAuthUrl: jest.fn().mockReturnValue({ url: 'https://foo.bar' }) } as UserPartial,
          } as AjaxContract)
      );

      await act(async () => {
        authStore.update((state) => ({ ...state, fenceStatus }));
      });

      // Act
      await act(async () => {
        renderWithAppContexts(h(FenceAccount, nhlbi));
      });

      // Assert
      expect(screen.getByText('Renew'));
      expect(screen.getByText('Unlink'));
      expect(screen.getByText(fenceStatus.fence.username));
      expect(screen.getByText('Link Expiration:'));
    });

    it('reaches out to Bond when the "Unlink" link is clicked', async () => {
      // Arrange
      const user = userEvent.setup();

      const unlinkFenceAccountFunction = jest.fn().mockReturnValue(Promise.resolve());
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as MetricsPartial,
            User: {
              unlinkFenceAccount: unlinkFenceAccountFunction,
              getFenceAuthUrl: jest.fn().mockReturnValue({ url: 'https://foo.bar' }),
            } as UserPartial,
          } as AjaxContract)
      );
      await act(async () => {
        authStore.update((state) => ({ ...state, fenceStatus }));
      });

      // Act
      renderWithAppContexts(h(FenceAccount, nhlbi));

      await user.click(screen.getByText('Unlink'));
      expect(screen.getByText('Confirm unlink account'));

      await user.click(screen.getByText('OK'));

      // Assert
      expect(unlinkFenceAccountFunction).toHaveBeenCalled();
    });
  });
  describe('when loading after being redirected from an NIH login provider', () => {
    it('reaches out to Bond when the page is loaded after the user has logged in to a Fence Account', async () => {
      const url = new URL('https://localhost:3000/?code=oauthCode&state=eyJwcm92aWRlciI6ICJmZW5jZSJ9#fence-callback');
      Object.defineProperty(window, 'location', {
        value: {
          href: url.href,
          search: url.search,
        },
        writable: true, // possibility to override
      });
      // Arrange
      const linkFenceAccountFunction = jest.fn().mockReturnValue(Promise.resolve());
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as MetricsPartial,
            User: {
              linkFenceAccount: linkFenceAccountFunction,
              getFenceAuthUrl: jest.fn().mockReturnValue({ url: 'https://foo.bar' }),
            } as UserPartial,
          } as AjaxContract)
      );
      // Act
      await act(async () => {
        renderWithAppContexts(h(FenceAccount, nhlbi));
      });

      // Assert
      expect(linkFenceAccountFunction).toHaveBeenCalled();
    });
  });
});
