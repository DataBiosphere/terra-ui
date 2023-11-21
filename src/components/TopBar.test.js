import { h } from 'react-hyperscript-helpers';
import TopBar from 'src/components/TopBar';
import { authStore } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

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
      // screen.getByText('Sign In');
    });
    it('when signInStatus is signedOut', () => {
      // Arrange
      authStore.update((state) => ({ ...state, signInStatus: 'signedOut' }));

      // Act
      render(h(TopBar));

      // Assert
      // screen.getByText('Sign In');
    });
  });
});
