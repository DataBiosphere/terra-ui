import { fireEvent, getByRole, screen } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import { h } from 'react-hyperscript-helpers';
import { getTerraUser } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { AccessEntry, WorkspaceAcl } from 'src/workspaces/acl-utils';
import { Collaborator } from 'src/workspaces/ShareWorkspaceModal/Collaborator';
import { BaseWorkspace, WorkspaceAccessLevel } from 'src/workspaces/utils';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));

jest.mock('src/components/popup-utils', () => ({
  ...jest.requireActual('src/libs/state'),
  getPopupRoot: jest.fn(),
}));

/**
 * Select and open the permissions menu for the email passed
 * The ArrowDown input is needed because the select component doesn't render it's options until opened
 */
const openMenu = (email: string) => {
  const permissionSelect = screen.getByLabelText(`permissions for ${email}`);
  fireEvent.keyDown(permissionSelect, { key: 'ArrowDown', code: 'ArrowDown' });
};

describe('a Collaborator component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'owner@test.com',
    });
  });

  const workspace: BaseWorkspace = defaultGoogleWorkspace;

  it('displays the email of the access item', () => {
    const item: AccessEntry = {
      email: 'user@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];
    render(
      h(Collaborator, {
        aclItem: item,
        acl,
        setAcl,
        originalAcl: acl,
        workspace,
        lastAddedEmail: undefined,
      })
    );
    expect(screen.queryByRole('listitem')).not.toBeNull();
    expect(screen.queryByText(item.email)).not.toBeNull();
  });

  it('shows the role selection as disabled for the current user ', () => {
    const item: AccessEntry = {
      email: 'owner@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];

    render(
      h(Collaborator, {
        aclItem: item,
        acl,
        setAcl,
        originalAcl: acl,
        workspace,
        lastAddedEmail: undefined,
      })
    );

    const select = screen.getByLabelText(`permissions for ${item.email}`);
    expect(select).not.toBeNull();
    expect(select).toBeDisabled();
  });

  it('shows a selection of available access levels', async () => {
    const item: AccessEntry = {
      email: 'abc@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];

    render(
      h(Collaborator, {
        aclItem: item,
        acl,
        setAcl,
        originalAcl: acl,
        workspace: { ...workspace, accessLevel: 'PROJECT_OWNER' },
      })
    );
    const select = screen.getByLabelText(`permissions for ${item.email}`);
    expect(select).not.toBeNull();
    expect(select).not.toBeDisabled();

    // The user's current permission is displayed by default in the select component
    // Opening the menu causes it to be rendered twice in the DOM:
    // once for the default display, and once for the menu option
    expect(screen.queryByText('Owner')).not.toBeNull();
    await openMenu(item.email);
    expect(screen.queryByText('Writer')).not.toBeNull();
    expect(screen.queryByText('Reader')).not.toBeNull();
    expect(screen.queryByText('Project Owner')).toBeNull();
  });

  it('removes a user with setAcl with the x is selected', async () => {
    const removeItem: AccessEntry = {
      email: 'user1@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const item: AccessEntry = {
      email: 'user2@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };

    const setAcl = jest.fn((val) => {
      expect(val).not.toContainEqual(removeItem);
    });
    const aclMock = asMockedFn(setAcl);
    const acl = [item, removeItem];

    render(
      h(Collaborator, {
        aclItem: removeItem,
        acl,
        setAcl: aclMock,
        originalAcl: acl,
        workspace: { ...workspace, accessLevel: 'PROJECT_OWNER' },
      })
    );

    expect(screen.getByLabelText(`permissions for ${removeItem.email}`)).not.toBeNull();
    const removeButton = screen.getByRole('button'); // this appears to be the only button in the component
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton);
    expect(setAcl).toHaveBeenCalledTimes(1);
  });

  it('can change the permission of the user with setAcl', async () => {
    const item: AccessEntry = {
      email: 'user1@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const currentItem: AccessEntry = {
      email: 'user2@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };

    const setAcl = jest.fn((val) => {
      expect(val).toHaveLength(2);
      expect(val[0]).toBe(item);
      expect(val[1].email).toEqual(currentItem.email);
      expect(val[1].accessLevel).toEqual('READER');
      // .toContainEqual(item);
      expect(val).not.toContainEqual(currentItem);
    });
    const aclMock = asMockedFn(setAcl);
    const acl = [item, currentItem];

    render(
      h(Collaborator, {
        aclItem: currentItem,
        acl,
        setAcl: aclMock,
        originalAcl: acl,
        workspace: { ...workspace, accessLevel: 'PROJECT_OWNER' },
      })
    );

    expect(screen.getByLabelText(`permissions for ${currentItem.email}`)).not.toBeNull();
    openMenu(currentItem.email);

    const writterPermission = screen.getByText('Reader');
    expect(writterPermission).not.toBeNull();
    fireEvent.click(writterPermission);
    expect(setAcl).toHaveBeenCalledTimes(1);
  });

  describe('only allows owners and project owners to share with additional permissions', () => {
    const setAcl = jest.fn();
    const item: AccessEntry = {
      email: 'user1@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'WRITER',
    };
    const acl = [item];

    it('displays a tooltip when the user cannot share with additional permissions', () => {
      // Arrange
      render(
        h(Collaborator, {
          aclItem: item,
          acl,
          setAcl,
          originalAcl: acl,
          workspace: { ...workspace, accessLevel: 'WRITER' },
        })
      );

      // Act
      const canShareCheckbox = getByRole(screen.getByText('Can share').parentElement!, 'checkbox');
      fireEvent.mouseOver(canShareCheckbox);

      // Assert
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('Only Owners and Project Owners can share additional permissions');
    });

    test.each([
      {
        accessLevel: 'OWNER' as WorkspaceAccessLevel,
        descriptor: 'allows',
        shouldDisableCheckbox: false,
      },
      {
        accessLevel: 'PROJECT_OWNER' as WorkspaceAccessLevel,
        descriptor: 'allows',
        shouldDisableCheckbox: false,
      },
      {
        accessLevel: 'WRITER' as WorkspaceAccessLevel,
        descriptor: 'does not allow',
        shouldDisableCheckbox: true,
      },
    ])('$descriptor an $accessLevel to share with additional permissions', ({ accessLevel, shouldDisableCheckbox }) => {
      // Act
      render(
        h(Collaborator, {
          aclItem: item,
          acl,
          setAcl,
          originalAcl: acl,
          workspace: { ...workspace, accessLevel },
        })
      );

      // Assert
      const canCompute = screen.getByText('Can compute');
      const canShare = screen.getByText('Can share');

      if (shouldDisableCheckbox) {
        expect(canCompute).toHaveAttribute('disabled');
        expect(canShare).toHaveAttribute('disabled');
      } else {
        expect(canCompute).not.toHaveAttribute('disabled');
        expect(canShare).not.toHaveAttribute('disabled');
      }
    });
  });

  describe('hides the Can Compute option for collaborators with Reader access', () => {
    // Arrange
    const setAcl = jest.fn();
    const item1: AccessEntry = {
      email: 'user1@test.com',
      pending: true,
      canShare: true,
      canCompute: false,
      accessLevel: 'READER',
    };
    const item2: AccessEntry = {
      email: 'user2@test.com',
      pending: false,
      canShare: false,
      canCompute: false,
      accessLevel: 'READER',
    };

    test.each([{ item: item1 }, { item: item2 }])(
      'hides Can Compute when pending is $item.pending and Can Share is $item.canShare',
      ({ item }) => {
        const acl = [item];

        // Act
        render(
          h(Collaborator, {
            aclItem: item,
            acl,
            setAcl,
            originalAcl: acl,
            workspace: { ...workspace, accessLevel: 'OWNER' },
          })
        );

        // Assert
        expect(screen.queryByText('Can compute')).not.toBeInTheDocument();
        expect(screen.queryByText('Can share')).toBeInTheDocument();
      }
    );
  });
});
