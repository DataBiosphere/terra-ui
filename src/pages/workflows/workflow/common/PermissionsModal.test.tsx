import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { PermissionsModal } from 'src/pages/workflows/workflow/common/PermissionsModal';
import { asMockedFn, renderWithAppContexts, SelectHelper } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

type StateExports = typeof import('src/libs/state');
jest.mock('src/libs/state', (): StateExports => {
  return {
    ...jest.requireActual('src/libs/state'),
    getTerraUser: jest.fn(() => ({ email: 'user1@foo.com' })),
  };
});

const mockPermissions = [
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

describe('PermissionsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockAjax: DeepPartial<AjaxContract> = {
      Methods: {
        method: (_namespace, _name, _snapshotId) => ({
          permissions: mockWorkflowPermissions,
          setPermissions: mockSetPermissions,
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
  });

  it('loads the correct title', async () => {
    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          methodOrNamespace='method'
          selectedSnapshot='3'
          setPermissionsModalOpen={jest.fn()}
        />
      );
    });

    expect(screen.getByText('Permissions for workflow namespace/test'));
    expect(screen.getByText('User'));
    expect(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Current Users'));
    expect(screen.getByRole('button', { name: 'Save' }));
  });

  it('loads users with proper permissions', async () => {
    // ARRANGE
    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          methodOrNamespace='method'
          selectedSnapshot='3'
          setPermissionsModalOpen={jest.fn()}
        />
      );
    });

    // ASSERT
    expect(screen.getByText('user1@foo.com'));
    expect(screen.getByText('user2@bar.com'));
    expect(screen.getByText('Owner'));
    expect(screen.getByText('Reader'));
  });

  it('adds a new user and permissions', async () => {
    // ARRANGE
    const user = userEvent.setup();
    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          methodOrNamespace='method'
          selectedSnapshot='3'
          setPermissionsModalOpen={jest.fn()}
        />
      );
    });

    // ASSERT
    const textbox = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: 'Add' });
    const saveButton = screen.getByRole('button', { name: 'Save' });

    fireEvent.change(textbox, { target: { value: 'newuser@boo.com' } });
    await act(() => fireEvent.click(addButton));
    expect(screen.getByText('newuser@boo.com'));

    const roleSelector = new SelectHelper(
      screen.getByRole('combobox', { name: 'permissions for newuser@boo.com' }),
      user
    );
    await roleSelector.selectOption('Owner');
    await act(() => fireEvent.click(saveButton));

    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'READER', user: 'user2@bar.com' },
      { role: 'OWNER', user: 'newuser@boo.com' },
    ]);
  });

  it('removes a user and their permissions', async () => {
    // ARRANGE
    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          methodOrNamespace='method'
          selectedSnapshot='3'
          setPermissionsModalOpen={jest.fn()}
        />
      );
    });

    // ASSERT
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    const removableUserButton = removeButtons[removeButtons.length - 1]; // avoid possibility of this being undefined

    await act(() => fireEvent.click(removableUserButton));

    expect(screen.queryByText('user2@bar.com')).not.toBeInTheDocument();

    await act(() => fireEvent.click(saveButton));

    expect(mockSetPermissions).toHaveBeenCalledTimes(1);
    expect(mockSetPermissions).toHaveBeenCalledWith([
      { role: 'OWNER', user: 'user1@foo.com' },
      { role: 'NO ACCESS', user: 'user2@bar.com' },
    ]);
  });

  it('current user cannot edit their own permissions', async () => {
    // ARRANGE
    const user: UserEvent = userEvent.setup();

    await act(async () => {
      renderWithAppContexts(
        <PermissionsModal
          name='test'
          namespace='namespace'
          methodOrNamespace='method'
          selectedSnapshot='3'
          setPermissionsModalOpen={jest.fn()}
        />
      );
    });

    // ASSERT
    const roleSelector = new SelectHelper(await screen.findByLabelText('permissions for user1@foo.com'), user);
    expect(roleSelector.inputElement).toBeDisabled();
  });
});
