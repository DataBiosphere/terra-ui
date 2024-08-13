import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { Members } from 'src/billing/Members/Members';
import { renderWithAppContexts } from 'src/testing/test-utils';

describe('Members', () => {
  it('renders a list of members in the billing project with no accessibility errors', async () => {
    // Arrange
    const projectUsers = [
      { email: 'x_owner@test.email.org', roles: ['Owner'] },
      { email: 'user@test.email.org', roles: ['User'] },
    ];

    // Act
    const { container } = renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );

    // Assert
    const userTable = screen.getByRole('table');
    expect(userTable).toHaveAccessibleName('users in billing project test-project');
    const users = within(userTable).getAllByRole('row');
    expect(users).toHaveLength(3); // 1 header row + 2 user rows
    // users sort initially by email
    expect(users[1]).toHaveTextContent(/user@test.email.orgUser/);
    expect(users[2]).toHaveTextContent(/x_owner@test.email.orgOwnerThis user is the only Owner/);
    // Verify accessibility
    expect(await axe(container)).toHaveNoViolations();
  });

  it('supports sorting members', async () => {
    // Arrange
    const projectUsers = [
      { email: 'x_owner@test.email.org', roles: ['Owner'] },
      { email: 'user@test.email.org', roles: ['User'] },
    ];
    const user = userEvent.setup();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );

    // Assert
    const roleButton = screen.getByText('Roles');
    await user.click(roleButton);
    const userTable = screen.getByRole('table');
    const users = within(userTable).getAllByRole('row');
    expect(users).toHaveLength(3); // 1 header row + 2 user rows
    // users sort initially by email, clicking on role causes sorting by role
    expect(users[1]).toHaveTextContent(/x_owner@test.email.orgOwner/);
    expect(users[2]).toHaveTextContent(/user@test.email.orgUser/);
  });

  it('supports adding a member for owners', async () => {
    // Arrange
    const projectUsers = [{ email: 'owner@test.email.org', roles: ['Owner'] }];
    const user = userEvent.setup();
    const addUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={addUserCallback}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );
    const addUserButton = screen.getByText('Add User');
    await user.click(addUserButton);

    // Assert
    expect(addUserCallback).toHaveBeenCalledWith(true);
    // The actual display of the dialog to add a user is done in the parent file.
  });

  it('does not show the Add User button for non-owners', async () => {
    // Arrange
    const projectUsers = [{ email: 'owner@test.email.org', roles: ['Owner'] }];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner={false}
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByText('Add User')).toBeNull();
  });

  it('disables the action menu for an owner if there are not multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers = [{ email: ownerEmail, roles: ['Owner'] }];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByLabelText(`Menu for User: ${ownerEmail}`)).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not show an action menu if the user is not an owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['user'] },
    ];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner={false}
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByLabelText(`Menu for User: ${userEmail}`)).toBeNull();
  });

  it('supports deleting an owner if there are multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers = [
      { email: ownerEmail, roles: ['Owner'] },
      { email: 'owner2@test.email.org', roles: ['Owner'] },
    ];
    const user = userEvent.setup();
    const deletingUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={deletingUserCallback}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${ownerEmail}`);
    expect(menu).toHaveAttribute('aria-disabled', 'false');
    await user.click(menu);
    const removeButton = screen.getByText('Remove User');
    await user.click(removeButton);

    // Assert
    expect(deletingUserCallback).toHaveBeenCalledWith({ email: ownerEmail, roles: ['Owner'] });
  });

  it('supports deleting a non-owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['user'] },
    ];
    const user = userEvent.setup();
    const deletingUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={jest.fn()}
        setDeletingUser={deletingUserCallback}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${userEmail}`);
    await user.click(menu);
    const removeButton = screen.getByText('Remove User');
    await user.click(removeButton);

    // Assert
    expect(deletingUserCallback).toHaveBeenCalledWith({ email: userEmail, roles: ['user'] });
  });

  it('supports editing a non-owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['user'] },
    ];
    const user = userEvent.setup();
    const editingUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={editingUserCallback}
        setDeletingUser={jest.fn()}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${userEmail}`);
    await user.click(menu);
    const editButton = screen.getByText('Edit Role');
    await user.click(editButton);

    // Assert
    expect(editingUserCallback).toHaveBeenCalledWith({ email: userEmail, roles: ['user'] });
  });

  it('supports editing an owner if there are multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers = [
      { email: ownerEmail, roles: ['Owner'] },
      { email: 'owner2@test.email.org', roles: ['Owner'] },
    ];
    const user = userEvent.setup();
    const editingUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        setAddingUser={jest.fn()}
        setEditingUser={editingUserCallback}
        setDeletingUser={jest.fn()}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${ownerEmail}`);
    await user.click(menu);
    const editButton = screen.getByText('Edit Role');
    await user.click(editButton);

    // Assert
    expect(editingUserCallback).toHaveBeenCalledWith({ email: ownerEmail, roles: ['Owner'] });
  });
});
