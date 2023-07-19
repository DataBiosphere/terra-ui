import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { AddUsersStep } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AddUsersStep';

const onSetUserEmails = jest.fn();
const onSetOwnerEmails = jest.fn();
const onAddUsersOrOwners = jest.fn();
const onOwnersOrUsersInputFocused = jest.fn();
const getUsersInput = () => screen.getByLabelText('Users');
const getOwnersInput = () => screen.getByLabelText('Owners');

// Exported for wizard integration test.
export const getNoUsersRadio = () =>
  screen.getByLabelText("I don't have additional owners or users to add at this time");
export const getAddUsersRadio = () => screen.getByLabelText('Add the following owners and/or users');
export const addUserAndOwner = (userEmail, ownerEmail) => {
  fireEvent.change(getUsersInput(), { target: { value: userEmail } });
  fireEvent.change(getOwnersInput(), { target: { value: ownerEmail } });
};

const defaultProps = {
  inputDebounce: 0,
  isActive: true,
  userEmails: '',
  ownerEmails: '',
  onSetUserEmails,
  onSetOwnerEmails,
  addUsersOrOwners: undefined,
  onAddUsersOrOwners,
  onOwnersOrUsersInputFocused,
};

describe('AddUsersStep', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');
  const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

  const verifyCheckedState = (item, checked) => expect(item.checked).toBe(checked);

  it('has the correct initial state', () => {
    // Arrange
    render(h(AddUsersStep, defaultProps));

    // Assert
    verifyCheckedState(getNoUsersRadio(), false);
    verifyCheckedState(getAddUsersRadio(), false);
    verifyDisabled(getUsersInput());
    verifyDisabled(getOwnersInput());
  });

  it('Disables and clears the input fields based on radio button selection', async () => {
    // Arrange
    const user = userEvent.setup();

    const mockAddUsersOrOwners = jest.fn((addUsers) => {
      renderResult.rerender(
        h(AddUsersStep, {
          ...defaultProps,
          onAddUsersOrOwners: mockAddUsersOrOwners,
          addUsersOrOwners: addUsers,
        })
      );
    });
    const renderResult = render(h(AddUsersStep, { ...defaultProps, onAddUsersOrOwners: mockAddUsersOrOwners }));

    // Act
    await user.click(getAddUsersRadio());

    // Assert
    expect(mockAddUsersOrOwners).toBeCalledWith(true);
    verifyCheckedState(getNoUsersRadio(), false);
    verifyCheckedState(getAddUsersRadio(), true);
    verifyEnabled(getUsersInput());
    verifyEnabled(getOwnersInput());

    // Act and Assert
    await user.click(getUsersInput());
    expect(onOwnersOrUsersInputFocused).toBeCalled();
    fireEvent.change(getUsersInput(), { target: { value: 'user@foo.com' } });
    expect(onSetUserEmails).toBeCalledWith('user@foo.com', false);

    onOwnersOrUsersInputFocused.mockReset();
    await user.click(getOwnersInput());
    expect(onOwnersOrUsersInputFocused).toBeCalled();
    fireEvent.change(getOwnersInput(), { target: { value: 'owner@foo.com' } });
    expect(onSetOwnerEmails).toBeCalledWith('owner@foo.com', false);

    await user.click(getNoUsersRadio());
    expect(mockAddUsersOrOwners).toBeCalledWith(false);
    expect(onSetOwnerEmails).toHaveBeenLastCalledWith('', false);
    expect(onSetUserEmails).toHaveBeenLastCalledWith('', false);
    verifyDisabled(getUsersInput());
    verifyDisabled(getOwnersInput());
  });

  it('shows error messages based on bad email input', async () => {
    // Testing only 1 input field because it is the same component for both

    // Arrange
    render(h(AddUsersStep, { ...defaultProps, addUsersOrOwners: true }));

    // Act
    fireEvent.change(getUsersInput(), { target: { value: 'bademail, secondbademail' } });

    // Assert
    await screen.findByText('Bademail is not a valid email');
    await screen.findByText('Secondbademail is not a valid email');
    expect(screen.queryByText('2 emails entered')).toBeNull();
    expect(onSetUserEmails).toBeCalledWith('bademail, secondbademail', true);
  });

  it('shows count of correct emails', async () => {
    // Testing only 1 input field because it is the same component for both

    // Arrange
    // For some reason, passing this as text with fireEvent.change does not work.
    const goodEmails = 'first@example.com, second@example.com';
    render(h(AddUsersStep, { ...defaultProps, addUsersOrOwners: true, ownerEmails: goodEmails }));

    // Assert
    await screen.findByText('2 emails entered');
    expect(screen.queryByText('First@example.com is not a valid email')).toBeNull();
  });
});
