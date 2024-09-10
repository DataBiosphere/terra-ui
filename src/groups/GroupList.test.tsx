import { DeepPartial } from '@terra-ui-packages/core-utils';
import { waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { GroupList } from 'src/groups/GroupList';
import { Ajax } from 'src/libs/ajax';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { get as getStateHistory, update as updateStateHistory } from 'src/libs/state-history';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/nav', (): typeof import('src/libs/nav') => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn((link) => link),
}));

type ErrorExports = typeof import('src/libs/error');
const mockReportError = jest.fn();

jest.mock(
  'src/libs/error',
  (): ErrorExports => ({
    ...jest.requireActual('src/libs/error'),
    reportError: (...args) => mockReportError(...args),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

jest.mock('src/libs/state-history', (): typeof import('src/libs/state-history') => ({
  ...jest.requireActual('src/libs/state-history'),
  get: jest.fn().mockReturnValue({}),
  update: jest.fn(),
}));

describe('GroupList', () => {
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

  it('renders the no groups message', async () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText } = render(<GroupList />);
    await waitFor(() => expect(getByText('Create a group to share your workspaces with others.')).toBeDefined());
  });

  it('renders all groups in the list', async () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([memberGroup, adminGroup]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText } = render(<GroupList />);
    await waitFor(() => expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined());
    await waitFor(() => expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined());
  });

  it('applies the filter from stored state history', async () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([memberGroup, adminGroup]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    asMockedFn(getStateHistory).mockReturnValue({ filter: adminGroup.groupName });
    const { getByText, queryByText } = render(<GroupList />);
    await waitFor(() => expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined());
    expect(queryByText(memberGroup.groupName, { exact: false })).toBeFalsy();
  });

  it('applies the filter when entered and stores it in state history', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([memberGroup, adminGroup]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    asMockedFn(getStateHistory).mockReturnValue({});
    const user = userEvent.setup();
    const { getByText, queryByText, getByLabelText } = render(<GroupList />);
    await waitFor(() => expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined());
    await waitFor(() => expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined());
    // Act
    await user.type(getByLabelText('Search groups'), memberGroup.groupName);
    // Assert
    await waitFor(() => expect(getByText(memberGroup.groupName, { exact: false })).toBeDefined());
    await waitFor(() => expect(queryByText(adminGroup.groupName, { exact: false })).toBeFalsy());
    await waitFor(() => expect(asMockedFn(updateStateHistory)).toHaveBeenCalledWith({ filter: memberGroup.groupName }));
  });

  it('sets the correct group to delete', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([memberGroup, adminGroup]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const user = userEvent.setup();
    const { getByText, queryByText, getByRole } = render(<GroupList />);
    await waitFor(() => expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined());
    const menuLabel = `Action Menu for Group: ${adminGroup.groupName}`;
    const menu = getByRole('button', { name: menuLabel });
    expect(menu).toBeDefined();

    // Act
    await user.click(menu);
    await waitFor(() => expect(getByText('Delete', { exact: false })).toBeDefined());
    const deleteButton = getByText('Delete', { exact: false });
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton);
    // Assert
    // waiting for the modal to appear
    waitFor(() => expect(queryByText('Delete group')).toBeDefined());
  });

  it('sets the correct group to leave', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([memberGroup, adminGroup]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const user = userEvent.setup();
    const { getByText, queryByText, getByRole } = render(<GroupList />);
    await waitFor(() => expect(getByText(adminGroup.groupName, { exact: false })).toBeDefined());
    const menuLabel = `Action Menu for Group: ${adminGroup.groupName}`;
    const menu = getByRole('button', { name: menuLabel });
    expect(menu).toBeDefined();

    // Act
    await user.click(menu);
    await waitFor(() => expect(getByText('Leave', { exact: false })).toBeDefined());
    const leaveButton = getByText('Leave', { exact: false });
    expect(leaveButton).toBeDefined();
    await user.click(leaveButton);

    // Assert
    // waiting for the modal to appear
    waitFor(() => expect(queryByText('Leave group')).toBeDefined());
  });

  it('opens the modal to create a new group', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText } = render(<GroupList />);
    const user = userEvent.setup();
    // Act
    const createNewGroupButton = getByText('Create a New Group');
    await user.click(createNewGroupButton);
    // Assert
    waitFor(() => expect(getByText('Create New Group')).toBeDefined());
  });
});
