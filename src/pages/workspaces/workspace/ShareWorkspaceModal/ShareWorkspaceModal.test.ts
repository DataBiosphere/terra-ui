import '@testing-library/jest-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { getPopupRoot } from 'src/components/popup-utils';
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

jest.mock('src/components/popup-utils', () => ({
  ...jest.requireActual('src/libs/state'),
  getPopupRoot: jest.fn(),
}));

jest.mock('src/libs/ajax');

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

/**
 * Select and open the permissions menu for the email passed
 * The ArrowDown input is needed because the select component doesn't render it's options until opened
 */

describe('the share workspace modal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(getUser).mockReturnValue({
      email: 'owner@test.com',
    });

    const popupResult = render(div({ id: 'modal-root', role: 'complementary' }));
    asMockedFn(getPopupRoot).mockReturnValue(popupResult.baseElement);
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
    const mockWorkspaceAjax: DeepPartial<ReturnType<AjaxContract['Workspaces']['workspace']>> = {
      getAcl: jest.fn(() => Promise.resolve({ acl })),
      updateAcl,
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

    render(
      h(ShareWorkspaceModal, {
        onDismiss: () => {},
        workspace,
      })
    );

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

    render(
      h(ShareWorkspaceModal, {
        onDismiss: jest.fn(() => {}),
        workspace,
      })
    );

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
});
