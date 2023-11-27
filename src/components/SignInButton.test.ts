import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import SignInButton from 'src/components/SignInButton';
import { AuthState, authStore } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('SignInButton', () => {
  it('displays a spinner if the user is uninitialized', () => {
    // Arrange
    authStore.update((state: AuthState) => ({ ...state, signInStatus: 'uninitialized' }));

    // Act
    render(h(SignInButton));

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });
  it('displays the sign in button if the user is not uninitialized', () => {
    // Arrange
    authStore.update((state: AuthState) => ({ ...state, signInStatus: 'signedOut' }));

    // Act
    render(h(SignInButton));

    // Assert
    screen.getByText('Sign In');
  });
});
