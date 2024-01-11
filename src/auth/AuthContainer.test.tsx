import { act, getByTestId, screen } from '@testing-library/react';
import React from 'react';
import AuthContainer from 'src/auth/AuthContainer';
import { Ajax } from 'src/libs/ajax';
import { Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import { TermsOfService } from 'src/libs/ajax/TermsOfService';
import { User } from 'src/libs/ajax/User';
import { useRoute } from 'src/libs/nav';
import { AuthState, authStore } from 'src/libs/state';
import { Disabled } from 'src/pages/Disabled';
import SignIn from 'src/pages/SignIn';
import { Register } from 'src/registration/Register';
import { TermsOfServicePage } from 'src/registration/terms-of-service/TermsOfServicePage';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

jest.mock('src/libs/ajax');

type AuthExports = typeof import('src/auth/auth');
jest.mock(
  'src/auth/auth',
  (): AuthExports => ({
    ...jest.requireActual<AuthExports>('src/auth/auth'),
    isAzureUser: jest.fn(),
  })
);
jest.mock('src/pages/Disabled');
jest.mock('src/pages/SignIn');
jest.mock('src/registration/Register');
jest.mock('src/registration/terms-of-service/TermsOfServicePage');

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual<NavExports>('src/libs/nav'),
  useRoute: jest.fn(),
}));
describe('AuthContainer', () => {
  const renderedPageFn = jest.fn();

  describe('when the page is not public', () => {
    asMockedFn(useRoute).mockImplementation(() => ({ public: false }));
    describe('and the user is uninitialized', () => {
      const signInStatus = 'uninitialized';
      it('renders the loading spinner', async () => {
        // Arrange
        await act(async () => {
          authStore.update((state: AuthState) => ({ ...state, signInStatus }));
        });

        // Act
        const { container } = render(
          <AuthContainer>
            <div />
          </AuthContainer>
        );

        // Assert
        getByTestId(container, 'loading-spinner');
      });
    });
    describe('and the user is signedOut', () => {
      const signInStatus = 'signedOut';
      it('renders the SignIn page', async () => {
        // Arrange
        await act(async () => {
          authStore.update((state: AuthState) => ({ ...state, signInStatus }));
        });
        asMockedFn(SignIn).mockImplementation(renderedPageFn);

        // Act
        render(
          <AuthContainer>
            <div />
          </AuthContainer>
        );

        // Assert
        expect(renderedPageFn).toHaveBeenCalled();
      });
    });
  });
  describe('when the user is unregistered', () => {
    it('shows the Register page', async () => {
      // Arrange
      await act(async () => {
        authStore.update((state: AuthState) => ({ ...state, signInStatus: 'unregistered' }));
      });
      asMockedFn(Register).mockImplementation(renderedPageFn);

      // Act
      render(
        <AuthContainer>
          <div />
        </AuthContainer>
      );

      // Assert
      expect(renderedPageFn).toHaveBeenCalled();
    });
  });
  describe('when a user is loaded, enabled, but needs to accept the Terms of Service', () => {
    it('shows the TermsOfService page', async () => {
      // Arrange
      const terraUserAllowances = {
        allowed: false,
        details: {
          enabled: true,
          termsOfService: false,
        },
      };
      await act(async () => {
        authStore.update((state: AuthState) => ({ ...state, signInStatus: 'userLoaded', terraUserAllowances }));
      });
      asMockedFn(TermsOfServicePage).mockImplementation(renderedPageFn);

      // Act
      render(
        <AuthContainer>
          <div />
        </AuthContainer>
      );

      // Assert
      expect(renderedPageFn).toHaveBeenCalled();
    });
    it('can still show the PrivacyPolicy page', async () => {
      // Arrange
      asMockedFn(useRoute).mockImplementation(() => ({ public: false, name: 'privacy' }));
      const terraUserAllowances = {
        allowed: false,
        details: {
          enabled: true,
          termsOfService: false,
        },
      };
      await act(async () => {
        authStore.update((state: AuthState) => ({ ...state, signInStatus: 'userLoaded', terraUserAllowances }));
      });

      // Act
      render(<AuthContainer>Privacy Policy Page</AuthContainer>);

      screen.getByText('Privacy Policy Page');
    });
  });
  describe('when the user is disabled', () => {
    it('shows the Disabled page', async () => {
      // Arrange
      const terraUserAllowances = {
        allowed: false,
        details: {
          enabled: false,
          termsOfService: true,
        },
      };
      await act(async () => {
        authStore.update((state: AuthState) => ({ ...state, signInStatus: 'userLoaded', terraUserAllowances }));
      });
      asMockedFn(Disabled).mockImplementation(renderedPageFn);

      // Act
      render(
        <AuthContainer>
          <div />
        </AuthContainer>
      );

      // Assert
      expect(renderedPageFn).toHaveBeenCalled();
    });
  });
  describe('when the user is loaded and enabled', () => {
    it('renders the children elements', async () => {
      // Arrange
      asMockedFn(useRoute).mockImplementation(() => ({ public: false }));
      const terraUserAllowances = {
        allowed: true,
        details: {
          enabled: true,
          termsOfService: true,
        },
      };

      type AjaxContract = ReturnType<typeof Ajax>;
      type UserContract = ReturnType<typeof User>;
      type MetricsContract = ReturnType<typeof Metrics>;
      type GroupsContract = ReturnType<typeof Groups>;
      type TermsOfServiceContract = ReturnType<typeof TermsOfService>;
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: {
              captureEvent: jest.fn(),
            } as Partial<MetricsContract>,
            Groups: {
              list: jest.fn(),
            } as Partial<GroupsContract>,
            User: {
              getNihStatus: jest.fn(),
              getFenceStatus: jest.fn(),
            } as Partial<UserContract>,
            TermsOfService: {
              getUserTermsOfServiceDetails: jest.fn(),
            } as Partial<TermsOfServiceContract>,
          } as Partial<AjaxContract> as AjaxContract)
      );

      await act(async () => {
        authStore.update((state: AuthState) => ({ ...state, signInStatus: 'userLoaded', terraUserAllowances }));
      });

      // Act
      render(<AuthContainer>Child Page Content</AuthContainer>);

      screen.getByText('Child Page Content');
    });
  });
});
