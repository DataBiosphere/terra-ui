import { fireEvent, waitFor } from '@testing-library/react';
import { writeText } from 'clipboard-polyfill/text';
import React from 'react';
import { GroupCard } from 'src/groups/GroupCard';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/nav', (): typeof import('src/libs/nav') => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn((link) => link),
}));

jest.mock('clipboard-polyfill/text', () => ({
  ...jest.requireActual('clipboard-polyfill/text'),
  writeText: jest.fn().mockResolvedValue(true),
}));

describe('GroupCard', () => {
  const testGroup1: CurrentUserGroupMembership = {
    groupEmail: 'group1@email.com',
    groupName: 'test-group1-name',
    role: 'member',
  };
  const testGroup2: CurrentUserGroupMembership = {
    groupEmail: 'group2@email.com',
    groupName: 'test-group2-name',
    role: 'admin',
  };

  it('displays the group name, email, and role', async () => {
    // Arrange
    const { getByText } = render(<GroupCard group={testGroup1} onDelete={jest.fn()} onLeave={jest.fn()} />);
    // Act
    // Assert
    expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined();
    expect(getByText(testGroup1.groupEmail, { exact: false })).toBeDefined();
    expect(getByText(testGroup1.role, { exact: false })).toBeDefined();
  });

  it('calls the leave callback when button to leave the group is clicked', async () => {
    // Arrange
    const mockLeaveCallback = jest.fn();
    const { getByText, getByRole } = render(
      <GroupCard group={testGroup1} onDelete={jest.fn()} onLeave={mockLeaveCallback} />
    );
    expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${testGroup1.groupName}` });
    fireEvent.click(menu);
    await waitFor(() => expect(getByText('Leave', { exact: false })).toBeDefined());
    const leaveButton = getByText('Leave', { exact: false });
    fireEvent.click(leaveButton);

    // Assert
    waitFor(() => expect(mockLeaveCallback).toHaveBeenCalled());
  });

  it('calls the delete callback when delete button is clicked', async () => {
    // Arrange
    const mockDeleteCallback = jest.fn();
    const mockLeaveCallback = jest.fn();
    const { getByText, getByRole } = render(
      <GroupCard group={testGroup2} onDelete={mockDeleteCallback} onLeave={mockLeaveCallback} />
    );
    expect(getByText(testGroup2.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${testGroup2.groupName}` });
    fireEvent.click(menu);
    await waitFor(() => expect(getByText('Delete', { exact: false })).toBeDefined());
    const deleteButton = getByText('Delete', { exact: false }).parentNode;
    fireEvent.click(deleteButton!);

    // Assert
    waitFor(() => expect(mockDeleteCallback).toHaveBeenCalled());
  });

  it('disables the delete button if the user is not an admin', async () => {
    // Arrange
    const { getByText, getByRole } = render(<GroupCard group={testGroup1} onDelete={jest.fn()} onLeave={jest.fn()} />);
    expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${testGroup1.groupName}` });
    fireEvent.click(menu);
    await waitFor(() => expect(getByText('Delete', { exact: false })).toBeDefined());

    // Assert
    const deleteButton = getByText('Delete', { exact: false });
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('can copy the group name to the clipboard', async () => {
    // Arrange
    const { getByLabelText } = render(<GroupCard group={testGroup1} onDelete={jest.fn()} onLeave={jest.fn()} />);

    // Act
    const copyButton = getByLabelText('Copy group email to clipboard');
    fireEvent.click(copyButton);

    // Assert
    const mockWriteText = asMockedFn(writeText);
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(testGroup1.groupEmail));
  });
});
