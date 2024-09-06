import { DeepPartial } from '@terra-ui-packages/core-utils';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { get as getStateHistory, update as updateStateHistory } from 'src/libs/state-history';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { GroupList } from './GroupList';

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

  it('renders the no groups message', () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText } = render(<GroupList />);
    waitFor(() => expect(getByText('Create a group to share your workspaces with others.')).toBeDefined());
  });

  it('renders all groups in the list', () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([testGroup1, testGroup2]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText } = render(<GroupList />);
    waitFor(() => expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined());
    waitFor(() => expect(getByText(testGroup2.groupName, { exact: false })).toBeDefined());
  });

  it('applies the filter from stored state history', () => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([testGroup1, testGroup2]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    asMockedFn(getStateHistory).mockReturnValue({ filter: testGroup2.groupName });
    const { getByText, queryByText } = render(<GroupList />);
    waitFor(() => expect(getByText(testGroup2.groupName, { exact: false })).toBeDefined());
    expect(queryByText(testGroup1.groupName, { exact: false })).toBeFalsy();
  });

  it('applies the filter when entered and stores it in state history', () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Groups: {
            list: jest.fn().mockResolvedValue([testGroup1, testGroup2]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    const { getByText, queryByText, getByLabelText } = render(<GroupList />);
    waitFor(() => expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined());
    waitFor(() => expect(getByText(testGroup2.groupName, { exact: false })).toBeDefined());
    // Act
    fireEvent.change(getByLabelText('Search groups'), { target: { value: testGroup1.groupName } });
    // Assert
    waitFor(() => expect(getByText(testGroup1.groupName, { exact: false })).toBeDefined());
    waitFor(() => expect(queryByText(testGroup2.groupName, { exact: false })).toBeFalsy());
    waitFor(() => expect(asMockedFn(updateStateHistory)).toHaveBeenCalledWith({ filter: testGroup1.groupName }));
  });
});
