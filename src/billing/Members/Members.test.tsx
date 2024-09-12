import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { Members } from 'src/billing/Members/Members';
import { Member } from 'src/groups/Members/MemberTable';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');
describe('Members', () => {
  it('renders a list of members in the billing project with no accessibility errors', async () => {
    // Arrange
    const projectUsers: Member[] = [
      { email: 'x_owner@test.email.org', roles: ['Owner'] },
      { email: 'user@test.email.org', roles: ['User'] },
    ];

    // Act
    const { container } = renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
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
    const projectUsers: Member[] = [
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
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
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
    const projectUsers: Member[] = [{ email: 'owner@test.email.org', roles: ['Owner'] }];
    const user = userEvent.setup();

    const addProjectUser = jest.fn();
    const mockAjax: DeepPartial<AjaxContract> = {
      Billing: { addProjectUser } as Partial<AjaxContract['Billing']>,
      // Next 2 mocks are needed for suggestions in the NewUserModal.
      Workspaces: { getShareLog: jest.fn(() => Promise.resolve([])) },
      Groups: { list: jest.fn(() => Promise.resolve([])) },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
    const userAddedCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={userAddedCallback}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
      />
    );
    // Open add user dialog
    const addUserButton = screen.getByText('Add User');
    await user.click(addUserButton);
    // Both the combobox and the input field have the same label (which is not ideal, but already existing),
    // so we need to select the second one.
    const emailInput = screen.getAllByLabelText('User email *')[1];
    await user.type(emailInput, 'test-user@company.com');
    // Save button ("Add User") within the dialog, as opposed to the one that opened the dialog.
    const saveButton = within(screen.getByRole('dialog')).getByText('Add User');
    await user.click(saveButton);

    // Assert
    expect(userAddedCallback).toHaveBeenCalled();
    expect(addProjectUser).toHaveBeenCalledWith('test-project', ['User'], 'test-user@company.com');

    // The actual display of the dialog to add a user is done in the parent file.
  });

  it('does not show the Add User button for non-owners', async () => {
    // Arrange
    const projectUsers: Member[] = [{ email: 'owner@test.email.org', roles: ['Owner'] }];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner={false}
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByText('Add User')).toBeNull();
  });

  it('disables the action menu for an owner if there are not multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers: Member[] = [{ email: ownerEmail, roles: ['Owner'] }];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByLabelText(`Menu for User: ${ownerEmail}`)).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not show an action menu if the user is not an owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers: Member[] = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['User'] },
    ];

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner={false}
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByLabelText(`Menu for User: ${userEmail}`)).toBeNull();
  });

  it('supports deleting an owner if there are multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers: Member[] = [
      { email: ownerEmail, roles: ['Owner'] },
      { email: 'owner2@test.email.org', roles: ['Owner'] },
    ];
    const user = userEvent.setup();
    const deleteUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={deleteUserCallback}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${ownerEmail}`);
    expect(menu).toHaveAttribute('aria-disabled', 'false');
    await user.click(menu);
    const removeButton = screen.getByText('Remove User');
    await user.click(removeButton);
    // Confirm the remove
    await user.click(screen.getByText('Remove'));

    // Assert
    expect(deleteUserCallback).toHaveBeenCalledWith({ email: ownerEmail, roles: ['Owner'] });
  });

  it('supports deleting a non-owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers: Member[] = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['User'] },
    ];
    const user = userEvent.setup();
    const deleteUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={jest.fn()}
        deleteUser={deleteUserCallback}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${userEmail}`);
    await user.click(menu);
    const removeButton = screen.getByText('Remove User');
    await user.click(removeButton);
    // Confirm the remove
    await user.click(screen.getByText('Remove'));

    // Assert
    expect(deleteUserCallback).toHaveBeenCalledWith({ email: userEmail, roles: ['User'] });
  });

  it('supports editing a non-owner', async () => {
    // Arrange
    const userEmail = 'user@test.email.org';
    const projectUsers: Member[] = [
      { email: 'owner@test.email.org', roles: ['Owner'] },
      { email: userEmail, roles: ['User'] },
    ];
    const user = userEvent.setup();
    const changeUserRoles = jest.fn();
    const mockAjax: DeepPartial<AjaxContract> = {
      Billing: { changeUserRoles } as Partial<AjaxContract['Billing']>,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
    const editingUserCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={editingUserCallback}
        deleteUser={jest.fn()}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${userEmail}`);
    await user.click(menu);
    const editButton = screen.getByText('Edit Role');
    await user.click(editButton);
    // Toggle the checkbox
    const changeRoleButton = screen.getByLabelText('Can manage users (Owner)');
    await user.click(changeRoleButton);
    // Save the change.
    await user.click(screen.getByText('Change Role'));

    // Assert
    expect(editingUserCallback).toHaveBeenCalled();
    expect(changeUserRoles).toHaveBeenCalledWith('test-project', userEmail, ['User'], ['Owner']);
  });

  it('supports editing an owner if there are multiple owners', async () => {
    // Arrange
    const ownerEmail = 'owner@test.email.org';
    const projectUsers: Member[] = [
      { email: ownerEmail, roles: ['Owner'] },
      { email: 'owner2@test.email.org', roles: ['Owner'] },
    ];
    const user = userEvent.setup();
    const changeUserRoles = jest.fn();
    const mockAjax: DeepPartial<AjaxContract> = {
      Billing: { changeUserRoles } as Partial<AjaxContract['Billing']>,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
    const userEditedCallback = jest.fn();

    // Act
    renderWithAppContexts(
      <Members
        billingProjectName='test-project'
        isOwner
        projectUsers={projectUsers}
        userAdded={jest.fn()}
        userEdited={userEditedCallback}
        deleteUser={jest.fn()}
      />
    );
    const menu = screen.getByLabelText(`Menu for User: ${ownerEmail}`);
    await user.click(menu);
    const editButton = screen.getByText('Edit Role');
    await user.click(editButton);
    // Toggle the checkbox
    const changeRoleButton = screen.getByLabelText('Can manage users (Owner)');
    await user.click(changeRoleButton);
    // Save the change.
    await user.click(screen.getByText('Change Role'));

    // Assert
    expect(userEditedCallback).toHaveBeenCalled();
    expect(changeUserRoles).toHaveBeenCalledWith('test-project', ownerEmail, ['Owner'], ['User']);
  });
});
