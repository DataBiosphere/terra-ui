import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import TopBar from 'src/components/TopBar';
import { authStore } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): Partial<AjaxExports> => {
  return {
    Ajax: jest.fn(),
  };
});

jest.mock('src/auth/auth');

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
    getLink: jest.fn(),
  })
);

describe('TopBar', () => {
  describe('displays the menu dropdown', () => {
    it('when signInStatus is userLoaded', () => {
      // Arrange
      authStore.update((state) => ({ ...state, signInStatus: 'userLoaded' }));

      // Act
      render(h(TopBar));

      // Assert
      // const icon = document.querySelector('[data-icon="loadingSpinner"]');
      // expect(icon).toBeInTheDocument();
    });
    it('when signInStatus is authenticated', () => {
      // Arrange
      authStore.update((state) => ({ ...state, signInStatus: 'authenticated' }));

      // Act
      render(h(TopBar));

      // Assert
      // screen.getByText('Sign In');
    });
  });
  describe('does not display the menu dropdown', () => {
    it('when signInStatus is uninitialized', () => {
      // Arrange
      authStore.update((state) => ({ ...state, signInStatus: 'uninitialized' }));

      // Act
      render(h(TopBar));

      // Assert

      screen.getByText('Sign In');
      // const icon = document.querySelector('[data-icon="loadingSpinner"]');
      // expect(icon).toBeInTheDocument();
    });
    it('when signInStatus is signedOut', () => {
      // Arrange
      authStore.update((state) => ({ ...state, signInStatus: 'signedOut' }));
      fireEvent.click(screen.getByText('Skip to main content'));
      // Act
      render(h(TopBar));

      // Assert
      screen.getByText('Sign In');
    });
  });
});
