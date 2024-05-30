import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import {
  makeAzureWorkspace,
  makeGoogleProtectedWorkspace,
  makeGoogleWorkspace,
  protectedDataPolicy,
} from 'src/testing/workspace-fixtures';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import NewWorkspaceModal from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import { CloudProvider, WorkspaceWrapper } from 'src/workspaces/utils';

import {
  anvilPfbImportRequests,
  azureTdrSnapshotImportRequest,
  gcpTdrSnapshotImportRequest,
  gcpTdrSnapshotReferenceImportRequest,
  genericPfbImportRequest,
} from './__fixtures__/import-request-fixtures';
import { ImportRequest } from './import-types';
import { buildDestinationWorkspaceFilter } from './import-utils';
import {
  ImportDataDestination,
  ImportDataDestinationProps,
  selectExistingWorkspacePrompt,
} from './ImportDataDestination';

type ImportUtilsExports = typeof import('./import-utils');
jest.mock('./import-utils', (): ImportUtilsExports => {
  return {
    ...jest.requireActual<ImportUtilsExports>('./import-utils'),
    buildDestinationWorkspaceFilter: jest.fn(),
  };
});

type NewWorkspaceModalExports = typeof import('src/workspaces/NewWorkspaceModal/NewWorkspaceModal') & {
  __esModule: true;
};
jest.mock('src/workspaces/NewWorkspaceModal/NewWorkspaceModal', (): NewWorkspaceModalExports => {
  return {
    ...jest.requireActual<NewWorkspaceModalExports>('src/workspaces/NewWorkspaceModal/NewWorkspaceModal'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock('src/workspaces/common/state/useWorkspaces', (): UseWorkspacesExports => {
  return {
    ...jest.requireActual<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces'),
    useWorkspaces: jest.fn(),
  };
});

interface SetupOptions {
  props?: Partial<ImportDataDestinationProps>;
  workspaces?: WorkspaceWrapper[];
  workspaceFilter?: (workspace: WorkspaceWrapper) => boolean;
}

const setup = (opts: SetupOptions): void => {
  const { props = {}, workspaces = [], workspaceFilter = () => true } = opts;

  asMockedFn(useWorkspaces).mockReturnValue({
    loading: false,
    refresh: () => Promise.resolve(),
    status: 'Ready',
    workspaces,
  });

  asMockedFn(buildDestinationWorkspaceFilter).mockReturnValue(workspaceFilter);

  render(
    h(ImportDataDestination, {
      importRequest: genericPfbImportRequest,
      initialSelectedWorkspaceId: undefined,
      requiredAuthorizationDomain: undefined,
      templateWorkspaces: {},
      template: undefined,
      userHasBillingProjects: true,
      onImport: () => {},
      ...props,
    })
  );
};

describe('ImportDataDestination', () => {
  it.each([
    {
      importRequest: genericPfbImportRequest,
      workspacesFiltered: true,
    },
    {
      importRequest: genericPfbImportRequest,
      workspacesFiltered: false,
    },
  ] as {
    importRequest: ImportRequest;
    workspacesFiltered: boolean;
  }[])(
    'should explain data selection requirements restrict eligible workspaces',
    async ({ importRequest, workspacesFiltered }) => {
      // Arrange
      const user = userEvent.setup();

      setup({
        props: {
          importRequest,
        },
        workspaces: [
          makeGoogleWorkspace({
            workspace: {
              name: 'allowed-workspace',
            },
          }),
          makeGoogleWorkspace({
            workspace: {
              name: 'other-workspace',
            },
          }),
        ],
        workspaceFilter: workspacesFiltered
          ? (workspace) => workspace.workspace.name === 'allowed-workspace'
          : () => true,
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      // Assert
      const isRequirementsMessageShown = !!screen.queryByText(
        'Only workspaces that meet the data selection requirements are shown.'
      );

      expect(isRequirementsMessageShown).toBe(workspacesFiltered);
    }
  );

  it.each([
    {
      importRequest: genericPfbImportRequest,
      isWorkspaceAvailable: false,
    },
    {
      importRequest: genericPfbImportRequest,
      isWorkspaceAvailable: true,
    },
  ] as {
    importRequest: ImportRequest;
    isWorkspaceAvailable: boolean;
  }[])(
    'should disable select an existing workspace option when no suitable workspaces are available',
    async ({ importRequest, isWorkspaceAvailable }) => {
      // Arrange
      const user = userEvent.setup();

      setup({
        props: {
          importRequest,
        },
        workspaces: [
          makeGoogleWorkspace({
            workspace: {
              name: 'other-workspace',
            },
          }),
        ],
        workspaceFilter: isWorkspaceAvailable ? () => true : () => false,
      });
      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      // Assert
      const selectWorkspace = screen.queryByText('Select a workspace', {
        exact: false,
      });

      const isSelectWorkspaceShown = !!selectWorkspace;
      expect(isSelectWorkspaceShown).toBe(isWorkspaceAvailable);
    }
  );

  it.each([
    {
      importRequest: anvilPfbImportRequests[0],
      requiredAuthorizationDomain: 'test-auth-domain',
      expectedOptions: { requiredAuthorizationDomain: 'test-auth-domain' },
    },
    {
      importRequest: genericPfbImportRequest,
      requiredAuthorizationDomain: undefined,
      expectedOptions: { requiredAuthorizationDomain: undefined },
    },
    {
      importRequest: gcpTdrSnapshotImportRequest,
      requiredAuthorizationDomain: undefined,
      expectedOptions: { requiredAuthorizationDomain: undefined },
    },
    {
      importRequest: azureTdrSnapshotImportRequest,
      requiredAuthorizationDomain: undefined,
      expectedOptions: { requiredAuthorizationDomain: undefined },
    },
  ] as {
    importRequest: ImportRequest;
    requiredAuthorizationDomain?: string;
    expectedOptions: { cloudPlatform?: CloudProvider; isProtectedData: boolean; requiredAuthorizationDomain?: string };
  }[])(
    'should filter workspaces through buildDestinationWorkspaceFilter',
    async ({ importRequest, requiredAuthorizationDomain, expectedOptions }) => {
      // Arrange
      const user = userEvent.setup();

      setup({
        props: {
          importRequest,
          requiredAuthorizationDomain,
        },
        workspaces: [
          makeGoogleWorkspace({
            workspace: {
              name: 'allowed-workspace',
            },
          }),
          makeGoogleWorkspace({
            workspace: {
              name: 'other-workspace',
            },
          }),
        ],
        workspaceFilter: (workspace: WorkspaceWrapper): boolean => {
          return workspace.workspace.name === 'allowed-workspace';
        },
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);
      const workspaces = await workspaceSelect.getOptions();

      // Assert
      expect(buildDestinationWorkspaceFilter).toHaveBeenCalledWith(importRequest, expectedOptions);
      expect(workspaces).toEqual([expect.stringMatching(/allowed-workspace/)]);
    }
  );

  it.each([
    {
      importRequest: genericPfbImportRequest,
      shouldShowNotice: true,
    },
    {
      importRequest: gcpTdrSnapshotImportRequest,
      shouldShowNotice: true,
    },
    {
      importRequest: gcpTdrSnapshotReferenceImportRequest,
      shouldShowNotice: false,
    },
  ] as {
    importRequest: ImportRequest;
    shouldShowNotice: boolean;
  }[])('should show a notice when an import may take time', async ({ importRequest, shouldShowNotice }) => {
    // Arrange
    const user = userEvent.setup();

    setup({
      props: {
        importRequest,
      },
      workspaces: [makeGoogleWorkspace()],
    });

    // Act
    const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
    await user.click(existingWorkspaceButton);

    // Assert
    const notice = screen.queryByText(
      'Note that the import process may take some time after you are redirected into your destination workspace.'
    );

    const isNoticeShown = !!notice;
    expect(isNoticeShown).toBe(shouldShowNotice);
  });

  it.each([
    {
      url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb'),
      workspace: makeAzureWorkspace(),
      displayExtraAccessControlNotice: true,
    },
    {
      url: new URL('https://example.com/path/to/file.pfb'),
      workspace: makeAzureWorkspace(),
      displayExtraAccessControlNotice: false,
    },
    {
      url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb'),
      workspace: makeGoogleWorkspace(),
      displayExtraAccessControlNotice: true,
    },
  ] as {
    url: URL;
    workspace: WorkspaceWrapper;
    displayExtraAccessControlNotice: boolean;
  }[])(
    'displays access controls message when importing data that may add access controls to workspace',
    async ({ url, workspace, displayExtraAccessControlNotice }) => {
      // Arrange
      const user = userEvent.setup();
      const workspaceName = workspace.workspace.name;
      const importRequest: ImportRequest = {
        type: 'pfb',
        url,
      };

      setup({
        props: {
          importRequest,
        },
        workspaces: [workspace],
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);

      await workspaceSelect.selectOption(new RegExp(workspaceName));

      // Assert
      const accessControlNotice = screen.queryByText(/Importing this data (will|may) add additional access controls/);

      expect(!!accessControlNotice).toEqual(displayExtraAccessControlNotice);
    }
  );

  it.each([
    {
      workspace: makeAzureWorkspace({ policies: [] }),
      shouldDisplayPolicies: false,
    },
    {
      workspace: makeAzureWorkspace({ policies: [protectedDataPolicy] }),
      shouldDisplayPolicies: true,
    },
    {
      workspace: makeGoogleProtectedWorkspace({ policies: [protectedDataPolicy] }),
      shouldDisplayPolicies: true,
    },
  ] as {
    workspace: WorkspaceWrapper;
    shouldDisplayPolicies: boolean;
  }[])(
    'displays workspace policies on import if present on target workspace',
    async ({ workspace, shouldDisplayPolicies }) => {
      // Arrange
      const user = userEvent.setup();
      const workspaceName = workspace.workspace.name;

      setup({
        props: {
          importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
        },
        workspaces: [workspace],
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);

      await workspaceSelect.selectOption(new RegExp(workspaceName));

      // Assert
      const policyHeader = screen.queryByText('Security and controls on this workspace:');
      const policyDetail = screen.queryByText('Additional security monitoring', { exact: false });

      expect(!!policyHeader).toEqual(shouldDisplayPolicies);
      expect(!!policyDetail).toEqual(shouldDisplayPolicies);
    }
  );

  it.each([
    // Unprotected data, no auth domain
    {
      props: {
        importRequest: genericPfbImportRequest,
        requiredAuthorizationDomain: undefined,
      },
      expectedNewWorkspaceModalProps: {
        cloudPlatform: 'GCP',
        requiredAuthDomain: undefined,
        requireEnhancedBucketLogging: false,
      },
    },
    // Protected data, required auth domain
    {
      props: {
        importRequest: anvilPfbImportRequests[0],
        requiredAuthorizationDomain: 'test-auth-domain',
      },
      expectedNewWorkspaceModalProps: {
        cloudPlatform: 'GCP',
        requiredAuthDomain: 'test-auth-domain',
        requireEnhancedBucketLogging: true,
      },
    },
    // Snapshot requiring an Azure workspace
    {
      props: {
        importRequest: azureTdrSnapshotImportRequest,
        requiredAuthorizationDomain: undefined,
      },
      expectedNewWorkspaceModalProps: {
        cloudPlatform: 'AZURE',
        requiredAuthDomain: undefined,
        requireEnhancedBucketLogging: false,
      },
    },
    // Snapshot requiring a GCP workspace
    {
      props: {
        importRequest: gcpTdrSnapshotImportRequest,
        requiredAuthorizationDomain: undefined,
      },
      expectedNewWorkspaceModalProps: {
        cloudPlatform: 'GCP',
        requiredAuthDomain: undefined,
        requireEnhancedBucketLogging: false,
      },
    },
  ] as { props: Partial<ImportDataDestinationProps>; expectedNewWorkspaceModalProps: Record<string, any> }[])(
    'passes workspaces requirements to NewWorkspaceModal',
    async ({ props, expectedNewWorkspaceModalProps }) => {
      // Arrange
      const user = userEvent.setup();

      setup({ props });

      // Act
      const newWorkspaceButton = screen.getByText('Create a new workspace');
      await user.click(newWorkspaceButton);

      // Assert
      expect(NewWorkspaceModal).toHaveBeenCalledWith(
        expect.objectContaining(expectedNewWorkspaceModalProps),
        expect.anything()
      );
    }
  );

  it.each([
    // No access controls
    {
      importRequest: genericPfbImportRequest,
      noticeExpected: false,
    },
    // May have access controls
    {
      importRequest: anvilPfbImportRequests[0],
      noticeExpected: true,
    },
  ] as { importRequest: ImportRequest; noticeExpected: boolean }[])(
    'shows a notice when importing data that may have access controls into a new workspace',
    async ({ importRequest, noticeExpected }) => {
      // Arrange
      const user = userEvent.setup();

      setup({ props: { importRequest } });

      // Act
      const newWorkspaceButton = screen.getByText('Create a new workspace');
      await user.click(newWorkspaceButton);

      const { renderNotice } = asMockedFn(NewWorkspaceModal).mock.lastCall[0];
      const { container: noticeContainer } = render(
        renderNotice?.({ selectedBillingProject: undefined }) as JSX.Element
      );

      const controlledAccessText = !!within(noticeContainer).queryByText(
        /Importing controlled access data (will|may) apply any additional access controls associated with the data to this workspace./
      );

      // Assert
      expect(controlledAccessText).toBe(noticeExpected);
    }
  );
});
