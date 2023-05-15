import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { describe, expect, it, vi } from 'vitest';

import { NameModal } from './NameModal';

vi.mock('src/components/Modal', async () => {
  const { mockModalModule } = await vi.importActual('src/components/Modal.mock');
  return mockModalModule();
});

describe('NameModal', () => {
  it('renders a prompt for a new thing name', () => {
    // Act
    render(
      h(NameModal, {
        thing: 'Thing',
        onSuccess: () => {},
        onDismiss: () => {},
      })
    );

    // Assert
    screen.getByLabelText('Create a New Thing');

    const nameInput = screen.getByLabelText('Thing name *');
    expect(nameInput.value).toBe('');
  });

  it("renders a prompt to update an existing thing's name", () => {
    // Act
    render(
      h(NameModal, {
        thing: 'Thing',
        value: 'foo',
        onSuccess: () => {},
        onDismiss: () => {},
      })
    );

    // Assert
    screen.getByLabelText('Update Thing');

    const nameInput = screen.getByLabelText('Thing name *');
    expect(nameInput.value).toBe('foo');
  });

  it('when submit button is clicked, it calls onSuccess with entered name', async () => {
    // Arrange
    const user = userEvent.setup();

    const onSuccess = vi.fn();
    render(
      h(NameModal, {
        thing: 'Thing',
        onSuccess,
        onDismiss: () => {},
      })
    );

    // Act
    const nameInput = screen.getByLabelText('Thing name *');
    await user.type(nameInput, 'foo');

    const submitButton = screen.getByText('Create Thing');
    await user.click(submitButton);

    // Assert
    expect(onSuccess).toHaveBeenCalledWith({ name: 'foo' });
  });

  it('when cancel button is clicked, it calls onDismiss', async () => {
    // Arrange
    const user = userEvent.setup();

    const onDismiss = vi.fn();
    render(
      h(NameModal, {
        thing: 'Thing',
        onSuccess: () => {},
        onDismiss,
      })
    );

    // Act
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
  });

  describe('validation', () => {
    it('requires input', async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        h(NameModal, {
          thing: 'Thing',
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );

      const nameInput = screen.getByLabelText('Thing name *');
      const submitButton = screen.getByText('Create Thing');

      // Assert
      expect(nameInput.value).toBe('');
      expect(submitButton.getAttribute('aria-disabled')).toBe('true');

      // Act
      await user.type(nameInput, 'foo');

      // Assert
      expect(nameInput.value).toBe('foo');
      expect(submitButton.getAttribute('aria-disabled')).toBe('false');
    });

    it('shows required input message only after input is touched', async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        h(NameModal, {
          thing: 'Thing',
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );

      const nameInput = screen.getByLabelText('Thing name *');

      // Assert
      expect(screen.queryByText('Name is required')).toBeNull();

      // Act
      await user.type(nameInput, 'foo');
      await user.clear(nameInput);

      // Assert
      expect(nameInput.value).toBe('');
      screen.getByText('Name is required');
    });

    describe('regex', () => {
      it('validates name matches regex', async () => {
        // Arrange
        const user = userEvent.setup();

        render(
          h(NameModal, {
            thing: 'Thing',
            validator: /b.*/,
            validationMessage: 'Name must start with the letter b',
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );

        const nameInput = screen.getByLabelText('Thing name *');
        const submitButton = screen.getByText('Create Thing');

        // Act
        await user.type(nameInput, 'foo');

        // Assert
        screen.getByText('Name must start with the letter b');
        expect(submitButton.getAttribute('aria-disabled')).toBe('true');

        // Act
        await user.clear(nameInput);
        await user.type(nameInput, 'bar');

        // Assert
        expect(screen.queryByText('Name must start with the letter b')).toBeNull();
        expect(submitButton.getAttribute('aria-disabled')).toBe('false');
      });
    });

    describe('function', () => {
      it('validates with function returning boolean (true if invalid)', async () => {
        // Arrange
        const user = userEvent.setup();

        render(
          h(NameModal, {
            thing: 'Thing',
            validator: (name) => !name.startsWith('b'),
            validationMessage: 'Name must start with the letter b',
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );

        const nameInput = screen.getByLabelText('Thing name *');
        const submitButton = screen.getByText('Create Thing');

        // Act
        await user.type(nameInput, 'foo');

        // Assert
        screen.getByText('Name must start with the letter b');
        expect(submitButton.getAttribute('aria-disabled')).toBe('true');

        // Act
        await user.clear(nameInput);
        await user.type(nameInput, 'bar');

        // Assert
        expect(screen.queryByText('Name must start with the letter b')).toBeNull();
        expect(submitButton.getAttribute('aria-disabled')).toBe('false');
      });

      it('validates with function returning string (validation message)', async () => {
        // Arrange
        const user = userEvent.setup();

        render(
          h(NameModal, {
            thing: 'Thing',
            validator: (name) => (!name.startsWith('b') ? 'Name must start with the letter b' : false),
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );

        const nameInput = screen.getByLabelText('Thing name *');
        const submitButton = screen.getByText('Create Thing');

        // Act
        await user.type(nameInput, 'foo');

        // Assert
        screen.getByText('Name must start with the letter b');
        expect(submitButton.getAttribute('aria-disabled')).toBe('true');

        // Act
        await user.clear(nameInput);
        await user.type(nameInput, 'bar');

        // Assert
        expect(screen.queryByText('Name must start with the letter b')).toBeNull();
        expect(submitButton.getAttribute('aria-disabled')).toBe('false');
      });
    });
  });
});
