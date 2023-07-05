import '@testing-library/jest-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getUser } from 'src/libs/state';
import { DeepPartial } from 'src/libs/type-utils/deep-partial';
import { GoogleWorkspace } from 'src/libs/workspace-utils';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import { AccessEntry, RawWorkspaceAcl } from 'src/pages/workspaces/workspace/WorkspaceAcl';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));

type ModalMockExports = typeof import('src/components/Modal.mock');

jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

jest.mock('src/libs/ajax');

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

/**
 * Select and open the permissions menu for the email passed
 * The ArrowDown input is needed because the select component doesn't render its options until opened
 */

describe('the share workspace modal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(getUser).mockReturnValue({
      email: 'owner@test.com',
    });
  });

  const workspace: GoogleWorkspace = {
    accessLevel: 'PROJECT_OWNER',
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

  const mockAjax = (
    acl: RawWorkspaceAcl,
    shareLog: string[],
    groups: string[],
    updateAcl?: (aclUpdates: Partial<AccessEntry>[]) => Promise<any>
  ) => {
    const updateFn: (aclUpdates: Partial<AccessEntry>[]) => Promise<any> =
      updateAcl ?? jest.fn(() => Promise.resolve({ success: true }));
    const mockWorkspaceAjax: DeepPartial<ReturnType<AjaxContract['Workspaces']['workspace']>> = {
      getAcl: jest.fn(() => Promise.resolve({ acl })),
      updateAcl: updateFn,
    };

    const workspaceAjax = jest.fn().mockReturnValue(mockWorkspaceAjax);
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: workspaceAjax,
        getShareLog: jest.fn(() => Promise.resolve(shareLog)),
      },
      Groups: { list: jest.fn(() => Promise.resolve(groups)) },
      Metrics: { captureEvent: jest.fn(() => Promise.resolve({ success: true })) },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
  };

  it('shows a list of all users with access', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };
    mockAjax(acl, [], []);
    act(() => {
      render(
        h(ShareWorkspaceModal, {
          onDismiss: jest.fn(),
          workspace,
        })
      );
    });
    const email1 = await screen.findByText('user1@test.com');
    expect(email1).not.toBeNull();
    const email2 = await screen.findByText('user2@test.com');
    expect(email2).not.toBeNull();
  });

  it('saving updates only updates changed items ', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };

    const updateAcl = jest.fn((aclUpdates: Partial<AccessEntry>[]) => {
      expect(aclUpdates).toHaveLength(2);

      const user1 = _.find({ email: 'user1@test.com' }, aclUpdates);
      expect(user1?.accessLevel).toEqual('OWNER');

      const user2 = _.find({ email: 'user2@test.com' }, aclUpdates);
      expect(user2?.accessLevel).toEqual('WRITER');
      return Promise.resolve({ success: true });
    });
    mockAjax(acl, [], [], updateAcl);

    act(() => {
      render(
        h(ShareWorkspaceModal, {
          onDismiss: () => {},
          workspace,
        })
      );
    });
    const permissionSelect = await screen.findByLabelText(`permissions for ${'user2@test.com'}`);
    expect(permissionSelect).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelect);
      fireEvent.keyDown(permissionSelect, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const permissionSelection = await screen.findByText('Writer');
    expect(permissionSelection).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelection);
    });
    const saveButton = await screen.findByText('Save');
    expect(saveButton).not.toBeNull();
    act(() => {
      fireEvent.click(saveButton);
    });

    expect(updateAcl).toHaveBeenCalledTimes(1);
  });

  it('displays the error if saving updates fails', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };

    const expectedErrorText = 'This is the expected error';
    const updateAcl = jest.fn(() => {
      const err = { text: () => Promise.resolve(expectedErrorText), message: expectedErrorText };
      throw err;
    });
    mockAjax(acl, [], [], updateAcl);
    act(() => {
      render(
        h(ShareWorkspaceModal, {
          onDismiss: () => {},
          workspace,
        })
      );
    });

    const permissionSelect = await screen.findByLabelText(`permissions for ${'user2@test.com'}`);
    expect(permissionSelect).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelect);
      fireEvent.keyDown(permissionSelect, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const permissionSelection = await screen.findByText('Writer');
    expect(permissionSelection).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelection);
    });
    const saveButton = await screen.findByText('Save');
    expect(saveButton).not.toBeNull();
    act(() => {
      fireEvent.click(saveButton);
    });

    const errorMessage = await screen.findByText(expectedErrorText);
    expect(errorMessage).not.toBeNull();
  });
});
