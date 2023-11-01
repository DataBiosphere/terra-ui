import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import { NihAccount } from 'src/profile/external-identities/NihAccount';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => 'externalIdentities'),
}));

jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
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

jest.mock('src/libs/ajax');

const nihStatus = {
  linkedNihUsername: 'TEST_USERNAME',
  datasetPermissions: [{ name: 'TEST_DATASET', authorized: true }],
  linkExpireTime: 10,
};

describe('NihAccount', () => {
  afterEach(async () => {
    await act(async () => {
      authStore.reset();
    });
  });
  describe('when given a token', () => {
    it('links the NIH Account and renders a linked NIH Account', async () => {
      // Arrange
      const linkNihAccountFunction = jest.fn().mockReturnValue(Promise.resolve(nihStatus));
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as Partial<ReturnType<typeof Ajax>['Metrics']>,
            User: { linkNihAccount: linkNihAccountFunction } as Partial<ReturnType<typeof Ajax>['User']>,
          } as ReturnType<typeof Ajax>)
      );

      // Act
      await act(async () => {
        renderWithAppContexts(h(NihAccount, { nihToken: 'token' }));
      });

      // Assert
      expect(linkNihAccountFunction).toHaveBeenCalled();

      expect(screen.getByText('Username:')).not.toBeNull();
      expect(screen.getByText('TEST_USERNAME')).not.toBeNull();

      expect(screen.getByText('Link Expiration:')).not.toBeNull();
      expect(screen.getByText('Jan 1, 1970, 12:00 AM')).not.toBeNull();
    });
  });
  describe('when not given a token', () => {
    describe('when the user has not linked before', () => {
      it('renders the NIH Account Link button', async () => {
        // Arrange
        // Act
        await act(async () => {
          authStore.update((state) => ({ ...state, nihStatusLoaded: true }));
          renderWithAppContexts(h(NihAccount));
        });

        // Assert
        expect(screen.getByText('Log in to NIH')).not.toBeNull();
      });
    });
    describe('when the user has linked before', () => {
      it('renders the NIH Account Link button', async () => {
        // Arrange
        // Act
        await act(async () => {
          authStore.update((state) => ({ ...state, nihStatus, nihStatusLoaded: true }));
          renderWithAppContexts(h(NihAccount));
        });

        // Assert
        expect(screen.getByText('Username:')).not.toBeNull();
        expect(screen.getByText('TEST_USERNAME')).not.toBeNull();

        expect(screen.getByText('Link Expiration:')).not.toBeNull();
        expect(screen.getByText('Jan 1, 1970, 12:00 AM')).not.toBeNull();
      });
    });
  });
  describe('when the NIH Account status has not been loaded yet', () => {
    it('renders the NIH Account Loading spinner', async () => {
      // Arrange
      // Act
      await act(async () => {
        renderWithAppContexts(h(NihAccount));
      });

      // Assert
      expect(screen.getByText('Loading NIH account status...')).not.toBeNull();
    });
  });
  describe('Unlinking', () => {
    it('presents the unlink link', async () => {
      // Arrange
      const user = userEvent.setup();

      const unlinkNihAccountFunction = jest.fn().mockReturnValue(Promise.resolve());
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent: jest.fn() } as Partial<ReturnType<typeof Ajax>['Metrics']>,
            User: { unlinkNihAccount: unlinkNihAccountFunction } as Partial<ReturnType<typeof Ajax>['User']>,
          } as ReturnType<typeof Ajax>)
      );
      // Act
      await act(async () => {
        authStore.update((state) => ({ ...state, nihStatus, nihStatusLoaded: true }));
        renderWithAppContexts(h(NihAccount));
      });

      expect(screen.getByText('Unlink')).not.toBeNull();

      await user.click(screen.getByText('Unlink'));
      expect(screen.getByText('Confirm unlink account')).not.toBeNull();

      await user.click(screen.getByText('OK'));

      expect(unlinkNihAccountFunction).toHaveBeenCalled();
    });
  });
});
