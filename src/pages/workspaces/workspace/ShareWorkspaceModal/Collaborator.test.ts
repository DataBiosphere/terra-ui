import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { getPopupRoot } from 'src/components/popup-utils';
import { getUser } from 'src/libs/state';
import { BaseWorkspace } from 'src/libs/workspace-utils';
import { Collaborator } from 'src/pages/workspaces/workspace/ShareWorkspaceModal/Collaborator';
import { AccessEntry, WorkspaceAcl } from 'src/pages/workspaces/workspace/WorkspaceAcl';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
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
    asMockedFn(getUser).mockReturnValue({
      email: 'owner@test.com',
    });

    const popupResult = render(div({ id: 'modal-root', role: 'complementary' }));
    asMockedFn(getPopupRoot).mockReturnValue(popupResult.baseElement);
  });

  const workspace: BaseWorkspace = {
    accessLevel: 'OWNER',
    canShare: true,
    canCompute: true,
    workspace: {
      namespace: 'namespace',
      name: 'name',
      workspaceId: 'test-ws-id',
      cloudPlatform: 'Gcp',
      authorizationDomain: [],
      createdDate: '',
      createdBy: '',
      googleProject: 'test-project',
      bucketName: 'test-bucket',
    },
  };

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
});
