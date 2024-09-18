import { userEvent } from '@testing-library/user-event';
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
  const memberGroup: CurrentUserGroupMembership = {
    groupEmail: 'group1@email.com',
    groupName: 'test-group1-name',
    role: 'member',
  };
  const adminGroup: CurrentUserGroupMembership = {
    groupEmail: 'group2@email.com',
    groupName: 'test-group2-name',
    role: 'admin',
  };

  it('displays the group name, email, and role', async () => {
    // Arrange
    const { getByText } = render(<GroupCard group={memberGroup} onDelete={jest.fn()} onLeave={jest.fn()} />);
    // Act
    // Assert
    expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined();
    expect(getByText(memberGroup.groupEmail, { exact: false })).toBeDefined();
    expect(getByText(memberGroup.role, { exact: false })).toBeDefined();
  });

  it('calls the leave callback when button to leave the group is clicked', async () => {
    // Arrange
    const mockLeaveCallback = jest.fn();
    const user = userEvent.setup();
    const { getByText, getByRole } = render(
      <GroupCard group={memberGroup} onDelete={jest.fn()} onLeave={mockLeaveCallback} />
    );
    expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${memberGroup.groupName}` });
    await user.click(menu);
    expect(getByText('Leave', { exact: false })).toBeDefined();
    const leaveButton = getByText('Leave', { exact: false });
    await user.click(leaveButton);

    // Assert
    expect(mockLeaveCallback).toHaveBeenCalled();
  });

  it('calls the delete callback when delete button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockDeleteCallback = jest.fn();
    const mockLeaveCallback = jest.fn();
    const { getByText, getByRole } = render(
      <GroupCard group={adminGroup} onDelete={mockDeleteCallback} onLeave={mockLeaveCallback} />
    );
    expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${adminGroup.groupName}` });
    await user.click(menu);
    expect(getByText('Delete', { exact: false })).toBeDefined();
    const deleteButton = getByText('Delete', { exact: false });
    await user.click(deleteButton);

    // Assert
    expect(mockDeleteCallback).toHaveBeenCalled();
  });

  it('disables the delete button if the user is not an admin', async () => {
    // Arrange
    const user = userEvent.setup();
    const { getByText, getByRole } = render(<GroupCard group={memberGroup} onDelete={jest.fn()} onLeave={jest.fn()} />);
    expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined();

    // Act
    const menu = getByRole('button', { name: `Action Menu for Group: ${memberGroup.groupName}` });
    await user.click(menu);
    expect(getByText('Delete', { exact: false })).toBeDefined();

    // Assert
    const deleteButton = getByText('Delete', { exact: false });
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('can copy the group name to the clipboard', async () => {
    const user = userEvent.setup();
    // Arrange
    const { getByLabelText } = render(<GroupCard group={memberGroup} onDelete={jest.fn()} onLeave={jest.fn()} />);

    // Act
    const copyButton = getByLabelText('Copy group email to clipboard');
    await user.click(copyButton);

    // Assert
    const mockWriteText = asMockedFn(writeText);
    expect(mockWriteText).toHaveBeenCalledWith(memberGroup.groupEmail);
  });
});
