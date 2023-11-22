import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import TopBar from 'src/components/TopBar';
import { AuthState, authStore } from 'src/libs/state';
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

const itDoesNotShowTheSignInButton = (newState: Partial<AuthState>) => {
  it('does not display the Sign In button in the menu', () => {
    // Arrange
    authStore.update((state) => ({ ...state, ...newState }));

    // Act
    render(h(TopBar));

    // Assert
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });
};

const itShowsTheSignInButton = (newState: Partial<AuthState>) => {
  it('displays the Sign In button in the menu', () => {
    // Arrange
    authStore.update((state) => ({ ...state, ...newState }));

    // Act
    render(h(TopBar));

    // Assert
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });
};
describe('TopBar', () => {
  describe('when signInStatus is userLoaded', () => {
    itDoesNotShowTheSignInButton({ signInStatus: 'userLoaded' });
  });
  describe('when signInStatus is authenticated', () => {
    itDoesNotShowTheSignInButton({ signInStatus: 'authenticated' });
  });
  describe('when signInStatus is uninitialized', () => {
    itShowsTheSignInButton({ signInStatus: 'uninitialized' });
  });
  describe('when signInStatus is signedOut', () => {
    itShowsTheSignInButton({ signInStatus: 'signedOut' });
  });
});
