import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { PermissionsModal } from 'src/pages/workflows/workflow/common/PermissionsModal';
import { WorkflowsPermissions } from 'src/pages/workflows/workflow/workflows-acl-utils';
import { asMockedFn, renderWithAppContexts, SelectHelper } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  return {
    ...jest.requireActual<ErrorExports>('src/libs/error'),
    reportError: jest.fn(),
  };
});

type StateExports = typeof import('src/libs/state');
jest.mock('src/libs/state', (): StateExports => {
  return {
    ...jest.requireActual('src/libs/state'),
    getTerraUser: jest.fn(() => ({ email: 'user1@foo.com' })),
  };
});

const mockPublicSnapshotPermissions: WorkflowsPermissions = [
  {
    role: 'READER',
    user: 'public',
  },
  {
    role: 'OWNER',
    user: 'user1@foo.com',
  },
  {
    role: 'READER',
    user: 'user2@bar.com',
  },
];

const mockPermissions: WorkflowsPermissions = [
  {
    role: 'OWNER',
    user: 'user1@foo.com',
  },
  {
    role: 'READER',
    user: 'user2@bar.com',
  },
];
const mockWorkflowPermissions = jest.fn().mockReturnValue(Promise.resolve(mockPermissions));
const mockSetPermissions = jest.fn();

interface AjaxMocks {
  permissionsImpl?: jest.Mock;
  setPermissionsImpl?: jest.Mock;
}

const mockAjax = (mocks: AjaxMocks = {}) => {
  const { permissionsImpl, setPermissionsImpl } = mocks;
  const mockAjax: DeepPartial<AjaxContract> = {
    Methods: {
      method: jest.fn().mockReturnValue({
        permissions: permissionsImpl || mockWorkflowPermissions,
        setPermissions: setPermissionsImpl || mockSetPermissions,
      }),
    },
  };
  asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
};

describe('PermissionsModal', () => {
  it('loads the correct title and basic elements', async () => {
    // ARRANGE
    mockAjax();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ASSERT
    expect(screen.getByText('Edit Snapshot Permissions'));
    expect(screen.getByText('Note: Sharing with user groups is not supported.'));
    expect(screen.getByText('User'));
    expect(screen.getByRole('textbox', { name: 'User' }));
    expect(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Current Users'));
    expect(screen.getByRole('checkbox', { name: 'Make Publicly Readable?' }));
    expect(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Save' }));
  });

  it('loads users with proper permissions', async () => {
    // ARRANGE
    mockAjax();
    const user = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ASSERT
    expect(Ajax().Methods.method).toHaveBeenCalledWith('namespace', 'test', 3);
    expect(mockWorkflowPermissions).toHaveBeenCalled();

    expect(screen.getByText('user1@foo.com'));
    expect(screen.getByText('user2@bar.com'));

    const user1RoleSelector = new SelectHelper(screen.getByLabelText('permissions for user1@foo.com'), user);

    expect(user1RoleSelector.getSelectedOptions()).toEqual(['Owner']);

    const user2RoleSelector = new SelectHelper(
      screen.getByRole('combobox', { name: 'permissions for user2@bar.com' }),
      user
    );

    expect(user2RoleSelector.getSelectedOptions()).toEqual(['Reader']);
  });

  it('adds a new user and permissions', async () => {
    // ARRANGE
    mockAjax();
    const user = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const textbox = screen.getByRole('textbox', { name: 'User' });
    const addButton = screen.getByRole('button', { name: 'Add' });
    const saveButton = screen.getByRole('button', { name: 'Save' });

    fireEvent.change(textbox, { target: { value: 'newuser@boo.com' } });
    expect(textbox).toHaveDisplayValue('newuser@boo.com');
    await user.click(addButton);
    expect(screen.getByText('newuser@boo.com'));
    expect(textbox).toHaveDisplayValue('');

    const roleSelector = new SelectHelper(
      screen.getByRole('combobox', { name: 'permissions for newuser@boo.com' }),
      user
    );
    expect(roleSelector.getSelectedOptions()).toEqual(['Reader']);
    await roleSelector.selectOption('Owner');
    await user.click(saveButton);

    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'READER', user: 'user2@bar.com' },
      { role: 'OWNER', user: 'newuser@boo.com' },
    ]);
  });

  it('removes a user and their permissions', async () => {
    // ARRANGE
    mockAjax();
    const user = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    const removableUserButton = removeButtons[removeButtons.length - 1]; // avoid possibility of this being undefined

    await user.click(removableUserButton);

    expect(screen.queryByText('user2@bar.com')).not.toBeInTheDocument();

    await user.click(saveButton);

    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'NO ACCESS', user: 'user2@bar.com' },
    ]);
  });

  it('does not allow the current user to edit their own permissions', async () => {
    // ARRANGE
    mockAjax();
    const user: UserEvent = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ASSERT
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons).toHaveLength(1);

    const roleSelector = new SelectHelper(screen.getByLabelText('permissions for user1@foo.com'), user);
    expect(roleSelector.inputElement).toBeDisabled();
  });

  it('gives an error with invalid user email', async () => {
    // ARRANGE
    mockAjax();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const textbox = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: 'Add' });

    expect(screen.queryByText('User is not a valid email')).not.toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-disabled', 'true');

    fireEvent.change(textbox, { target: { value: 'blahblah' } });

    expect(screen.getByText('User is not a valid email')).toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('gives an error with a user email that already exists', async () => {
    // ARRANGE
    mockAjax();
    const user: UserEvent = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const textbox = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(textbox, { target: { value: 'user1@foo.com' } });

    expect(screen.getByText('User has already been added')).toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-disabled', 'true');

    fireEvent.change(textbox, { target: { value: 'user3@test.com' } });

    expect(screen.queryByText('User has already been added')).not.toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-disabled', 'false');

    await user.click(addButton);

    fireEvent.change(textbox, { target: { value: 'user3@test.com' } });

    expect(screen.getByText('User has already been added')).toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('lets you make a public workflow private', async () => {
    // ARRANGE
    mockAjax({
      permissionsImpl: jest.fn().mockResolvedValue(mockPublicSnapshotPermissions),
    });
    const user: UserEvent = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const publiclyReadableButton = screen.getByLabelText('Make Publicly Readable?');
    expect(publiclyReadableButton).toBeChecked();

    await user.click(publiclyReadableButton);
    expect(publiclyReadableButton).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'NO ACCESS', user: 'public' },
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'READER', user: 'user2@bar.com' },
    ]);
  });

  it('lets you make a private workflow public', async () => {
    // ARRANGE
    mockAjax();
    const user: UserEvent = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={jest.fn()}
          refresh={jest.fn()}
        />
      );
    });

    // ACT/ASSERT
    const publiclyReadableButton = screen.getByLabelText('Make Publicly Readable?');
    expect(publiclyReadableButton).not.toBeChecked();

    await user.click(publiclyReadableButton);
    expect(publiclyReadableButton).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'READER', user: 'public' },
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'READER', user: 'user2@bar.com' },
    ]);
  });

  it('closes the modal when you press the cancel button', async () => {
    // ARRANGE
    mockAjax();
    const user: UserEvent = userEvent.setup();

    const mockSetPermissionsModalOpen = jest.fn();
    const mockRefresh = jest.fn();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={mockSetPermissionsModalOpen}
          refresh={mockRefresh}
        />
      );
    });

    // ACT
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // ASSERT
    expect(mockSetPermissionsModalOpen).toHaveBeenCalledWith(false);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockSetPermissions).not.toHaveBeenCalled();
  });

  it('closes the modal and calls the refresh callback when you save permissions', async () => {
    // ARRANGE
    mockAjax();
    const user: UserEvent = userEvent.setup();

    const mockSetPermissionsModalOpen = jest.fn();
    const mockRefresh = jest.fn();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={mockSetPermissionsModalOpen}
          refresh={mockRefresh}
        />
      );
    });

    // ACT
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // ASSERT
    expect(mockSetPermissionsModalOpen).toHaveBeenCalledWith(false);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('displays an error popup and closes the modal if there is an error loading permissions', async () => {
    // ARRANGE
    mockAjax({
      permissionsImpl: jest.fn().mockImplementation(() => {
        throw new Error('BOOM');
      }),
    });

    const mockSetPermissionsModalOpen = jest.fn();
    const mockRefresh = jest.fn();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={mockSetPermissionsModalOpen}
          refresh={mockRefresh}
        />
      );
    });

    // ASSERT
    expect(reportError).toHaveBeenCalledWith('Error loading permissions.', expect.anything());
    expect(mockSetPermissionsModalOpen).toHaveBeenCalledWith(false);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('displays an error popup and closes the modal if there is an error saving permissions', async () => {
    // ARRANGE
    mockAjax({
      setPermissionsImpl: jest.fn().mockImplementation(() => {
        throw new Error('BOOM');
      }),
    });
    const user: UserEvent = userEvent.setup();

    const mockSetPermissionsModalOpen = jest.fn();
    const mockRefresh = jest.fn();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          snapshotOrNamespace='Snapshot'
          selectedSnapshot={3}
          setPermissionsModalOpen={mockSetPermissionsModalOpen}
          refresh={mockRefresh}
        />
      );
    });

    // ACT
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // ASSERT
    expect(reportError).toHaveBeenCalledWith('Error saving permissions.', expect.anything());
    expect(mockSetPermissionsModalOpen).toHaveBeenCalledWith(false);
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
