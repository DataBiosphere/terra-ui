import { fireEvent, getByRole, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Dispatch, SetStateAction } from 'react';
import { getTerraUser } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
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

// Tests rendering a Collaborator component that update state based on interactions.
const CollaboratorWithState = ({ aclItem, acl, originalAcl, workspace, lastAddedEmail, expectedModifiedAcl }) => {
  const [aclItemState, setAclItemState] = React.useState(aclItem);
  const setAcl = jest.fn((val) => {
    // Length 2 because the first one represents the user who opened the modal.
    expect(val).toHaveLength(2);
    expect(val[0]).toEqual(originalAcl[0]);
    // The second one is the item being modified.
    expect(val[1]).toEqual(expectedModifiedAcl);
    setAclItemState(val[1]);
  });

  return (
    <Collaborator
      aclItem={aclItemState}
      acl={acl}
      setAcl={setAcl}
      originalAcl={originalAcl}
      workspace={workspace}
      lastAddedEmail={lastAddedEmail}
    />
  );
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
    // Arrange
    const item: AccessEntry = {
      email: 'user@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];

    // Act
    render(
      <Collaborator
        aclItem={item}
        acl={acl}
        setAcl={setAcl}
        originalAcl={acl}
        workspace={workspace}
        lastAddedEmail={undefined}
      />
    );

    // Assert
    expect(screen.queryByRole('listitem')).not.toBeNull();
    expect(screen.queryByText(item.email)).not.toBeNull();
  });

  it('shows the role selection as disabled for the current user ', () => {
    // Arrange
    const item: AccessEntry = {
      email: 'owner@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];

    // Act
    render(
      <Collaborator
        aclItem={item}
        acl={acl}
        setAcl={setAcl}
        originalAcl={acl}
        workspace={workspace}
        lastAddedEmail={undefined}
      />
    );

    // Assert
    const select = screen.getByLabelText(`permissions for ${item.email}`);
    expect(select).not.toBeNull();
    expect(select).toBeDisabled();
  });

  it('shows a selection of available access levels', async () => {
    // Arrange
    const user = userEvent.setup();
    const item: AccessEntry = {
      email: 'abc@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'OWNER',
    };
    const setAcl: Dispatch<SetStateAction<WorkspaceAcl>> = asMockedFn(jest.fn());
    const acl = [item];

    // Act
    render(
      <Collaborator
        aclItem={item}
        acl={acl}
        setAcl={setAcl}
        originalAcl={acl}
        workspace={{ ...workspace, accessLevel: 'PROJECT_OWNER' }}
        lastAddedEmail={undefined}
      />
    );

    // Assert
    const dropdown = screen.getByLabelText(`permissions for ${item.email}`);
    const dropdownHelper = new SelectHelper(dropdown, user);
    expect(dropdownHelper.getSelectedOptions()).toEqual(['Owner']);
    const options = await dropdownHelper.getOptions();
    expect(options).toEqual(['Reader', 'Writer', 'Owner']);
  });

  it('removes a user with setAcl with the x is selected', async () => {
    // Arrange
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

    // Act
    render(
      <Collaborator
        aclItem={removeItem}
        acl={acl}
        setAcl={aclMock}
        originalAcl={acl}
        workspace={{ ...workspace, accessLevel: 'PROJECT_OWNER' }}
        lastAddedEmail={undefined}
      />
    );

    // Assert
    expect(screen.getByLabelText(`permissions for ${removeItem.email}`)).not.toBeNull();
    const removeButton = screen.getByRole('button'); // this appears to be the only button in the component
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton);
    expect(setAcl).toHaveBeenCalledTimes(1);
  });

  it('can change the permission of the user with setAcl', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspaceUser: AccessEntry = {
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
    const acl = [workspaceUser, currentItem];

    // Act
    render(
      <CollaboratorWithState
        aclItem={currentItem}
        acl={acl}
        originalAcl={acl}
        workspace={{ ...workspace, accessLevel: workspaceUser.accessLevel }}
        lastAddedEmail={undefined}
        expectedModifiedAcl={{ ...currentItem, accessLevel: 'WRITER', canShare: false }}
      />
    );

    // Assert
    const dropdown = screen.getByLabelText(`permissions for ${currentItem.email}`);
    const dropdownHelper = new SelectHelper(dropdown, user);
    await dropdownHelper.selectOption('Writer');
    expect(dropdownHelper.getSelectedOptions()).toEqual(['Writer']);

    const canCompute = screen.getByLabelText('Can compute');
    // Since an owner is changing the permission, canCompute will be selected by default.
    expect(canCompute).toBeChecked();
    expect(canCompute).not.toHaveAttribute('disabled');
  });

  it('does not allow writers to share with canCompute true', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspaceUser: AccessEntry = {
      email: 'user1@test.com',
      pending: false,
      canShare: true,
      canCompute: true,
      accessLevel: 'WRITER',
    };
    const currentItem: AccessEntry = {
      email: 'user2@test.com',
      pending: false,
      canShare: false,
      canCompute: false,
      accessLevel: 'READER',
    };
    const acl = [workspaceUser, currentItem];

    // Act
    render(
      <CollaboratorWithState
        aclItem={currentItem}
        acl={acl}
        originalAcl={acl}
        workspace={{ ...workspace, accessLevel: workspaceUser.accessLevel }}
        lastAddedEmail={undefined}
        expectedModifiedAcl={{ ...currentItem, accessLevel: 'WRITER' }}
      />
    );

    // Assert
    const dropdown = screen.getByLabelText(`permissions for ${currentItem.email}`);
    const dropdownHelper = new SelectHelper(dropdown, user);
    await dropdownHelper.selectOption('Writer');
    expect(dropdownHelper.getSelectedOptions()).toEqual(['Writer']);

    const canCompute = screen.getByText('Can compute');
    // Since a writer is changing the permission, canCompute will be disabled. We can't
    // verify that it is not checked because we can't get the checkbox input element for a disabled item.
    // However, expectModifiedAcl includes canCompute: false, so we can verify that it is not changed.
    expect(canCompute).toHaveAttribute('disabled');
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
        <Collaborator
          aclItem={item}
          acl={acl}
          setAcl={setAcl}
          originalAcl={acl}
          workspace={{ ...workspace, accessLevel: 'WRITER' }}
          lastAddedEmail={undefined}
        />
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
        <Collaborator
          aclItem={item}
          acl={acl}
          setAcl={setAcl}
          originalAcl={acl}
          workspace={{ ...workspace, accessLevel }}
          lastAddedEmail={undefined}
        />
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

  describe('the Can Compute option', () => {
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
      'is hidden for readers when pending is $item.pending and Can Share is $item.canShare',
      ({ item }) => {
        const acl = [item];

        // Act
        render(
          <Collaborator
            aclItem={item}
            acl={acl}
            setAcl={setAcl}
            originalAcl={acl}
            workspace={{ ...workspace, accessLevel: 'OWNER' }}
            lastAddedEmail={undefined}
          />
        );

        // Assert
        expect(screen.queryByText('Can compute')).not.toBeInTheDocument();
        expect(screen.queryByText('Can share')).toBeInTheDocument();
      }
    );
  });
});
