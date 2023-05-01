import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { signOut } from 'src/libs/auth';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { authStore, azurePreviewStore } from 'src/libs/state';

import AzurePreview, { submittedPreviewFormPrefKey } from './AzurePreview';

jest.mock('src/libs/ajax', () => ({
  ...jest.requireActual('src/libs/ajax'),
  Ajax: jest.fn(),
}));

jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  signOut: jest.fn(),
}));

jest.mock('src/libs/prefs', () => ({
  getLocalPref: jest.fn(),
  setLocalPref: jest.fn(),
}));

describe('AzurePreview', () => {
  it('renders different content based on whether the user is a preview user', () => {
    // Act
    const [previewUserContent, nonPreviewUserContent] = [true, false].map((isAzurePreviewUser) => {
      authStore.set({
        user: { email: 'user@organization.name' },
        isAzurePreviewUser,
      });
      const { container, unmount } = render(h(AzurePreview));
      const content = container.innerHTML;
      unmount();
      return content;
    });

    // Assert
    expect(previewUserContent).not.toBe(nonPreviewUserContent);
  });

  describe('for preview users', () => {
    beforeAll(() => {
      authStore.set({ isAzurePreviewUser: true });
    });

    it('renders a button to proceed to Terra', async () => {
      // Arrange
      const user = userEvent.setup();

      jest.spyOn(azurePreviewStore, 'set');

      // Act
      render(h(AzurePreview));

      const proceedToTerraButton = screen.getByText('Proceed to Terra on Microsoft Azure Preview');
      await user.click(proceedToTerraButton);

      // Assert
      expect(azurePreviewStore.set).toHaveBeenCalledWith(true);
    });

    it('renders a sign out button', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(h(AzurePreview));

      const signOutButton = screen.getByText('Sign Out');
      await user.click(signOutButton);

      // Assert
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('for non-preview users', () => {
    beforeAll(() => {
      authStore.set({
        user: { email: 'user@organization.name' },
        isAzurePreviewUser: false,
      });
    });

    describe('for users who have not submitted the form', () => {
      beforeAll(() => {
        getLocalPref.mockImplementation((key) => (key === submittedPreviewFormPrefKey ? false : undefined));
      });

      it('renders a message', () => {
        // Act
        render(h(AzurePreview));

        // Assert
        screen.getByText(
          'Terra on Microsoft Azure is currently in preview. Please complete the following form if you are interested in accessing the platform and exploring the capabilities of Terra on Microsoft Azure.'
        );
      });

      it('renders the form', () => {
        // Act
        render(h(AzurePreview));

        // Assert
        screen.getByRole('form');
      });

      describe('form validation', () => {
        it('requires a value for all fields', async () => {
          // Arrange
          const user = userEvent.setup();

          render(h(AzurePreview));

          const isSubmitEnabled = () => screen.getByText('Submit').getAttribute('aria-disabled') === 'false';

          // Assert
          expect(isSubmitEnabled()).toBe(false);

          // Act
          await user.type(screen.getByLabelText('First name *'), 'A');
          await user.type(screen.getByLabelText('Last name *'), 'User');

          // Assert
          expect(isSubmitEnabled()).toBe(false);

          // Act
          await user.type(screen.getByLabelText('Title/Role *'), 'Automated test');
          await user.type(screen.getByLabelText('Organization name *'), 'Terra UI');
          await user.clear(screen.getByLabelText('Contact email address *'));
          await user.type(screen.getByLabelText('Contact email address *'), 'user@example.com');

          // Assert
          expect(isSubmitEnabled()).toBe(false);

          // Act
          await user.click(screen.getByText('Launch workflows'));

          // Assert
          expect(isSubmitEnabled()).toBe(true);
        });
      });

      describe('successfully submitting the form', () => {
        let submitForm;
        let user;

        beforeAll(() => {
          submitForm = jest.fn(() => Promise.resolve());
          Ajax.mockImplementation(() => ({ Surveys: { submitForm } }));
        });

        beforeEach(async () => {
          // Arrange
          user = userEvent.setup();

          render(h(AzurePreview));

          await user.type(screen.getByLabelText('First name *'), 'A');
          await user.type(screen.getByLabelText('Last name *'), 'User');
          await user.type(screen.getByLabelText('Title/Role *'), 'Automated test');
          await user.type(screen.getByLabelText('Organization name *'), 'Terra UI');
          await user.clear(screen.getByLabelText('Contact email address *'));
          await user.type(screen.getByLabelText('Contact email address *'), 'user@example.com');
          await user.click(screen.getByText('Launch workflows'));

          // Act
          const submitButton = screen.getByText('Submit');
          await act(() => user.click(submitButton));
        });

        it('submits user info', () => {
          expect(submitForm).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
          const formInput = submitForm.mock.calls[0][1];
          expect(Object.values(formInput)).toEqual(
            expect.arrayContaining(['A', 'User', 'Automated test', 'Terra UI', 'user@example.com', 'user@organization.name', 'Launch workflows'])
          );
        });

        it('hides the form', () => {
          // Assert
          expect(screen.queryByRole('form')).toBeNull();
        });

        it('shows a thank you message', () => {
          // Assert
          screen.getByText('Thank you for your interest in using Terra on Microsoft Azure. We will be in touch with your access information.');
        });

        it('saves submission status', () => {
          expect(setLocalPref).toHaveBeenCalledWith(submittedPreviewFormPrefKey, true);
        });
      });
    });

    describe('for users who have submitted the form', () => {
      beforeAll(() => {
        getLocalPref.mockImplementation((key) => (key === submittedPreviewFormPrefKey ? true : undefined));
      });

      it('renders a message', () => {
        // Act
        render(h(AzurePreview));

        // Assert
        screen.getByText('Thank you for your interest in using Terra on Microsoft Azure. We will be in touch with your access information.');
      });

      it('does not render the form', () => {
        // Act
        render(h(AzurePreview));

        // Assert
        expect(screen.queryByRole('form')).toBeNull();
      });
    });

    it('renders a sign out button', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(h(AzurePreview));

      const signOutButton = screen.getByText('Sign Out');
      await user.click(signOutButton);

      // Assert
      expect(signOut).toHaveBeenCalled();
    });
  });
});
