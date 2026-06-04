import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { authStore, SignInStatus } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { ScientificServicesSidebar } from './ScientificServicesSidebar';

jest.mock('src/auth/auth');
jest.mock('src/auth/signout/sign-out');
jest.mock('src/libs/ajax/Support');
jest.mock('src/libs/ajax/User');

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn((key) => `/#${key}`),
  })
);

describe('ScientificServicesSidebar', () => {
  const defaultProps = {
    title: 'Test Title',
    href: '/#root',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { signInStatus: 'uninitialized' satisfies SignInStatus, signInShown: true },
    { signInStatus: 'authenticated' satisfies SignInStatus, signInShown: false },
    { signInStatus: 'userLoaded' satisfies SignInStatus, signInShown: false },
    { signInStatus: 'signedOut' satisfies SignInStatus, signInShown: true },
  ])('when signInStatus is $signInStatus, Sign In button shown is: $signInShown', ({ signInStatus, signInShown }) => {
    // Arrange
    authStore.update((authState) => ({ ...authState, signInStatus: signInStatus as SignInStatus }));

    // Act
    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    // Assert
    if (signInShown) {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    }
  });

  it('displays user name when signed in', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'authenticated' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.getByText('Loading...')).toBeInTheDocument(); // username is shown as Loading... while user info is being fetched
  });

  it('shows all job menu items when signed in', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'authenticated' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.getByText('Run Job')).toBeInTheDocument();
    expect(screen.getByText('Job History')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('shows all account menu items when signed in', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'authenticated' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Quotas')).toBeInTheDocument();
  });

  it('shows service news and documentation links', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'signedOut' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.getByText('Service News')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('shows Sign Out button when signed in', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'authenticated' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('does not show Sign Out button when signed out', () => {
    authStore.update((authState) => ({ ...authState, signInStatus: 'signedOut' as SignInStatus }));

    render(<ScientificServicesSidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });
});
