import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DeleteConfirmationModal } from 'src/components/common/DeleteConfirmationModal';
import { renderWithAppContexts } from 'src/testing/test-utils';

describe('DeleteConfirmationModal', () => {
  it('renders a confirmation modal dialog with the type/name passed in', () => {
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal objectType='nut' objectName='pistachio' onConfirm={jest.fn()} onDismiss={jest.fn()} />
    );

    // Assert
    const modalElement = screen.getByRole('dialog');
    expect(modalElement).toHaveAccessibleName('Delete nut');
    expect(modalElement).toHaveTextContent(/Are you sure you want to delete the nut pistachio?/);
  });

  it('allows the specification of a custom title', () => {
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal
        title='Allergic to nuts?'
        objectType='nut'
        objectName='pistachio'
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    // Assert
    const modalElement = screen.getByRole('dialog');
    expect(modalElement).toHaveAccessibleName('Allergic to nuts?');
  });

  it('allows passing custom children', () => {
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal
        title='Allergic to nuts?'
        objectType='nut'
        objectName='pistachio'
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      >
        <div>custom message</div>
      </DeleteConfirmationModal>
    );

    // Assert
    const modalElement = screen.getByRole('dialog');
    expect(modalElement).toHaveTextContent(/custom message/);
    expect(modalElement).not.toHaveTextContent(/Are you sure you want to delete the nut pistachio?/);
  });

  it('supports forcing the user to type confirmation text (case insensitive)', async () => {
    // Arrange
    const user = userEvent.setup();
    const isConfirmButtonDisabled = () => {
      const confirmButton = screen.getAllByRole('button').find((button) => button.textContent === 'Delete nut');
      return confirmButton!.getAttribute('aria-disabled');
    };

    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal
        confirmationPrompt='confirm'
        objectType='nut'
        objectName='pistachio'
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(isConfirmButtonDisabled()).toBe('true');
    const confirmationInput = screen.getByLabelText('Type "confirm" to continue:');
    await user.type(confirmationInput, 'conFIRM');

    // Assert
    expect(isConfirmButtonDisabled()).toBe('false');
  });

  it('triggers a callback on confirmation with default button text', async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal objectType='nut' objectName='pistachio' onConfirm={onConfirm} onDismiss={jest.fn()} />
    );

    const confirmButton = screen.getAllByRole('button').find((button) => button.textContent === 'Delete nut');
    await user.click(confirmButton!);

    // Assert
    expect(onConfirm).toHaveBeenCalled();
  });

  it('allows the user to specify the confirmation button text', async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal
        buttonText='Please delete'
        objectType='nut'
        objectName='pistachio'
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    );

    const confirmButton = screen.getAllByRole('button').find((button) => button.textContent === 'Please delete');
    await user.click(confirmButton!);

    // Assert
    expect(onConfirm).toHaveBeenCalled();
  });

  it('triggers a callback on on dismissal', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    // Act
    renderWithAppContexts(
      <DeleteConfirmationModal objectType='nut' objectName='pistachio' onConfirm={jest.fn()} onDismiss={onDismiss} />
    );

    const confirmButton = screen.getAllByRole('button').find((button) => button.textContent === 'Cancel');
    await user.click(confirmButton!);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
  });
});
