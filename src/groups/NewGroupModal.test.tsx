import { DeepPartial } from '@terra-ui-packages/core-utils';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NewGroupModal } from 'src/groups/NewGroupModal';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

type ErrorExports = typeof import('src/libs/error');
const mockReportError = jest.fn();

jest.mock(
  'src/libs/error',
  (): ErrorExports => ({
    ...jest.requireActual('src/libs/error'),
    reportError: (...args) => mockReportError(...args),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

describe('NewGroupModal', () => {
  it('renders correctly', () => {
    // Arrange
    // Act
    const { getByText } = render(<NewGroupModal onDismiss={jest.fn()} onSuccess={jest.fn()} existingGroups={[]} />);
    // Assert
    expect(getByText('Create Group')).toBeInTheDocument();
  });

  it('updates the admin notifier checkbox state correctly', async () => {
    // Arrange
    const { getByLabelText } = render(
      <NewGroupModal onDismiss={jest.fn()} onSuccess={jest.fn()} existingGroups={[]} />
    );
    const checkbox = getByLabelText('Allow anyone to request access');
    expect(checkbox).toBeChecked();
    // Act
    fireEvent.click(checkbox);
    // Assert
    await waitFor(() => expect(checkbox).not.toBeChecked());
  });

  it('enables the create button if the form is valid', async () => {
    // Arrange
    const { getByText, getByLabelText } = render(
      <NewGroupModal onDismiss={jest.fn()} onSuccess={jest.fn()} existingGroups={[]} />
    );
    // Act
    const nameInput = getByLabelText('Enter a unique name *');
    fireEvent.change(nameInput, { target: { value: 'ValidName' } });
    // Assert
    await waitFor(() => expect(getByText('Create Group')).not.toBeDisabled());
  });

  it('displays an error for invalid input', async () => {
    // Arrange
    const { getByText, getByLabelText } = render(
      <NewGroupModal onDismiss={jest.fn()} onSuccess={jest.fn()} existingGroups={[]} />
    );
    // Act
    const nameInput = getByLabelText('Enter a unique name *');
    fireEvent.change(nameInput, { target: { value: 'Invalid Name&' } });
    // Assert
    await waitFor(() =>
      expect(getByText('Group name can only contain letters, numbers, underscores, and dashes')).toBeInTheDocument()
    );
  });

  it('does not allow a group name that already exists ', async () => {
    // Arrange
    const existingName = 'Existing name';
    const { getByText, getByLabelText } = render(
      <NewGroupModal onDismiss={jest.fn()} onSuccess={jest.fn()} existingGroups={[existingName]} />
    );
    // Act
    const nameInput = getByLabelText('Enter a unique name *');
    fireEvent.change(nameInput, { target: { value: existingName } });
    // Assert
    await waitFor(() => expect(getByText('Group name already exists')).toBeInTheDocument());
  });

  it('calls submit function on form submission with valid data', async () => {
    // Arrange
    const mockCreateFn = jest.fn().mockReturnValue(Promise.resolve());
    const mockSetPolicyFn = jest.fn().mockReturnValue(Promise.resolve());
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            group: jest.fn().mockImplementation(() => ({
              create: mockCreateFn,
              setPolicy: mockSetPolicyFn,
            })),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const mockOnSuccessFn = jest.fn();
    const { getByText, getByLabelText } = render(
      <NewGroupModal onDismiss={jest.fn()} onSuccess={mockOnSuccessFn} existingGroups={[]} />
    );
    const nameInput = getByLabelText('Enter a unique name *');
    fireEvent.change(nameInput, { target: { value: 'ValidName' } });
    await waitFor(() => expect(nameInput).toHaveValue('ValidName'));
    const submitButton = getByText('Create Group');
    expect(submitButton).toBeEnabled();
    // Act
    fireEvent.click(submitButton);
    // Assert
    await waitFor(() => expect(mockCreateFn).toHaveBeenCalled());
    await waitFor(() => expect(mockSetPolicyFn).toHaveBeenCalledWith('admin-notifier', true));
    await waitFor(() => expect(mockCreateFn).toHaveBeenCalled());
    await waitFor(() => expect(mockOnSuccessFn).toHaveBeenCalled());
  });
});
