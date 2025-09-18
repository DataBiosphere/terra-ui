import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { TopBar } from 'src/components/TopBar';
import { authStore, configOverridesStore, SignInStatus } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/auth/auth');

jest.mock('src/libs/ajax/Support');
jest.mock('src/libs/ajax/User');

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
  it.each([
    { signInStatus: 'uninitialized' satisfies SignInStatus, signInShown: true },
    { signInStatus: 'authenticated' satisfies SignInStatus, signInShown: false },
    { signInStatus: 'userLoaded' satisfies SignInStatus, signInShown: false },
    { signInStatus: 'signedOut' satisfies SignInStatus, signInShown: true },
  ])('when signInStatus is $signInStatus, Sign In button shown is: $signInShown', ({ signInStatus, signInShown }) => {
    // Arrange
    authStore.update((authState) => ({ ...authState, signInStatus: signInStatus as SignInStatus }));

    // Act
    render(h(TopBar));
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    // Assert
    if (signInShown) {
      screen.getByText('Sign In');
    } else {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    }
  });

  it('renders limited options when scientificServices brand option is enabled', async () => {
    configOverridesStore.set({ brand: 'scientificServices' });

    authStore.update((authState) => ({ ...authState, signInStatus: 'uninitialized' as SignInStatus }));

    // Act
    render(h(TopBar));
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    // Assert
    expect(screen.queryByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Support')).not.toBeInTheDocument();
    expect(screen.queryByText('Service News')).toBeInTheDocument();
    expect(screen.queryByText('Documentation')).toBeInTheDocument();
  });

  it('renders full options when scientificServices brand option is disabled', async () => {
    configOverridesStore.set({ brand: undefined });

    authStore.update((authState) => ({ ...authState, signInStatus: 'uninitialized' as SignInStatus }));

    // Act
    render(h(TopBar));
    fireEvent.click(screen.getByLabelText('Toggle main menu'));

    // Assert
    expect(screen.queryByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByText('Workspaces')).toBeInTheDocument();
    expect(screen.queryByText('Support')).toBeInTheDocument();
  });
});
