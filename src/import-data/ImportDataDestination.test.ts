import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Snapshot } from 'src/libs/ajax/DataRepo';
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

import { ImportRequest } from './import-types';
import { canImportIntoWorkspace, ImportOptions } from './import-utils';
import {
  ImportDataDestination,
  ImportDataDestinationProps,
  selectExistingWorkspacePrompt,
} from './ImportDataDestination';

type ImportUtilsExports = typeof import('./import-utils');
jest.mock('./import-utils', (): ImportUtilsExports => {
  return {
    ...jest.requireActual<ImportUtilsExports>('./import-utils'),
    canImportIntoWorkspace: jest.fn().mockReturnValue(true),
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
}

const setup = (opts: SetupOptions): void => {
  const { props = {}, workspaces = [] } = opts;

  asMockedFn(useWorkspaces).mockReturnValue({
    loading: false,
    refresh: () => Promise.resolve(),
    workspaces,
  });

  render(
    h(ImportDataDestination, {
      importRequest: {
        type: 'pfb',
        url: new URL('https://example.com/path/to/file.pfb'),
      },
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
      importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
      shouldShowProtectedDataWarning: true,
    },
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      shouldShowProtectedDataWarning: false,
    },
  ] as {
    importRequest: ImportRequest;
    shouldShowProtectedDataWarning: boolean;
  }[])(
    'should explain protected data restricts eligible workspaces',
    async ({ importRequest, shouldShowProtectedDataWarning }) => {
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
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      // Assert
      const protectedDataWarning = screen.queryByText(
        'You may only import into workspaces that have additional security monitoring enabled.',
        {
          exact: false,
        }
      );

      const isWarningShown = !!protectedDataWarning;
      expect(isWarningShown).toEqual(shouldShowProtectedDataWarning);
    }
  );

  it.each([
    {
      importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
      shouldSelectExisting: false,
    },
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      shouldSelectExisting: true,
    },
  ] as {
    importRequest: ImportRequest;
    shouldSelectExisting: boolean;
  }[])('should disable select an existing workspace option', async ({ importRequest, shouldSelectExisting }) => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(canImportIntoWorkspace).mockReturnValue(false);

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
    });
    // Act
    const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
    await user.click(existingWorkspaceButton);

    // Assert
    const selectWorkspace = screen.queryByText('Select a workspace', {
      exact: false,
    });

    const isSelectWorkspaceShown = !!selectWorkspace;
    expect(isSelectWorkspaceShown).toEqual(shouldSelectExisting);
  });

  it.each([
    {
      importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
      requiredAuthorizationDomain: 'test-auth-domain',
      expectedArgs: {
        cloudPlatform: 'GCP',
        isProtectedData: true,
        requiredAuthorizationDomain: 'test-auth-domain',
      },
    },
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      requiredAuthorizationDomain: undefined,
      expectedArgs: { cloudPlatform: 'GCP', isProtectedData: false, requiredAuthorizationDomain: undefined },
    },
    {
      importRequest: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshot: {
          id: '00001111-2222-3333-aaaa-bbbbccccdddd',
          name: 'test-snapshot',
          source: [
            {
              dataset: {
                id: '00001111-2222-3333-aaaa-bbbbccccdddd',
                name: 'test-dataset',
                secureMonitoringEnabled: false,
              },
            },
          ],
          cloudPlatform: 'gcp',
        },
        syncPermissions: false,
      },
      requiredAuthorizationDomain: undefined,
      expectedArgs: { cloudPlatform: 'GCP', isProtectedData: false, requiredAuthorizationDomain: undefined },
    },
    {
      importRequest: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshot: {
          id: '00001111-2222-3333-aaaa-bbbbccccdddd',
          name: 'test-snapshot',
          source: [
            {
              dataset: {
                id: '00001111-2222-3333-aaaa-bbbbccccdddd',
                name: 'test-dataset',
                secureMonitoringEnabled: false,
              },
            },
          ],
          cloudPlatform: 'azure',
        },
        syncPermissions: false,
      },
      requiredAuthorizationDomain: undefined,
      expectedArgs: { cloudPlatform: 'AZURE', isProtectedData: false, requiredAuthorizationDomain: undefined },
    },
  ] as {
    importRequest: ImportRequest;
    requiredAuthorizationDomain?: string;
    expectedArgs: { cloudPlatform?: CloudProvider; isProtectedData: boolean; requiredAuthorizationDomain?: string };
  }[])(
    'should filter workspaces through canImportIntoWorkspace',
    async ({ importRequest, requiredAuthorizationDomain, expectedArgs }) => {
      // Arrange
      const user = userEvent.setup();

      asMockedFn(canImportIntoWorkspace).mockImplementation(
        (_importOptions: ImportOptions, workspace: WorkspaceWrapper): boolean => {
          return workspace.workspace.name === 'allowed-workspace';
        }
      );

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
      });

      // Act
      const existingWorkspaceButton = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
      await user.click(existingWorkspaceButton);

      const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);
      const workspaces = await workspaceSelect.getOptions();

      // Assert
      expect(canImportIntoWorkspace).toHaveBeenCalledWith(expectedArgs, expect.anything());
      expect(workspaces).toEqual([expect.stringMatching(/allowed-workspace/)]);
    }
  );

  const snapshotFixture: Snapshot = {
    id: '00001111-2222-3333-aaaa-bbbbccccdddd',
    name: 'test-snapshot',
    source: [
      {
        dataset: {
          id: '00001111-2222-3333-aaaa-bbbbccccdddd',
          name: 'test-dataset',
          secureMonitoringEnabled: false,
        },
      },
    ],
    cloudPlatform: 'gcp',
  };

  it.each([
    {
      importRequest: {
        type: 'pfb',
        url: new URL('https://example.com/path/to/file.pfb'),
      },
      shouldShowNotice: true,
    },
    {
      importRequest: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshot: snapshotFixture,
        syncPermissions: true,
      },
      shouldShowNotice: true,
    },
    {
      importRequest: {
        type: 'tdr-snapshot-reference',
        snapshot: snapshotFixture,
      },
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
      displayExtraAccessControlNotice: false, // don't display if the data isn't protected
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
    'displays additional access controls message when importing protected data into a protected workspace',
    async ({ url, workspace, displayExtraAccessControlNotice }) => {
      // Arrange
      const user = userEvent.setup();
      const workspaceName = workspace.workspace.name;
      const importRequest: ImportRequest = {
        type: 'pfb',
        url,
      };

      asMockedFn(canImportIntoWorkspace).mockReturnValue(true);

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
      const importNoticeHeader = screen.queryByText('Importing this data may add:', {
        exact: false,
      });

      const accessControlNotice = screen.queryByText('Additional access controls', { exact: false });

      expect(!!importNoticeHeader).toEqual(displayExtraAccessControlNotice);
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
      asMockedFn(canImportIntoWorkspace).mockReturnValue(true);

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
      const policyHeader = screen.queryByText('This workspace has the following', { exact: false });
      const policyDetail = screen.queryByText('Additional security monitoring', { exact: false });

      expect(!!policyHeader).toEqual(shouldDisplayPolicies);
      expect(!!policyDetail).toEqual(shouldDisplayPolicies);
    }
  );

  it.each([
    // Unprotected data, no auth domain
    {
      props: {
        importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
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
        importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
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
        importRequest: {
          type: 'tdr-snapshot-export',
          manifestUrl: new URL('https://example.com/path/to/manifest.json'),
          snapshot: {
            id: '00001111-2222-3333-aaaa-bbbbccccdddd',
            name: 'test-snapshot',
            source: [
              {
                dataset: {
                  id: '00001111-2222-3333-aaaa-bbbbccccdddd',
                  name: 'test-dataset',
                  secureMonitoringEnabled: false,
                },
              },
            ],
            cloudPlatform: 'azure',
          },
          syncPermissions: false,
        },
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
        importRequest: {
          type: 'tdr-snapshot-export',
          manifestUrl: new URL('https://example.com/path/to/manifest.json'),
          snapshot: {
            id: '00001111-2222-3333-aaaa-bbbbccccdddd',
            name: 'test-snapshot',
            source: [
              {
                dataset: {
                  id: '00001111-2222-3333-aaaa-bbbbccccdddd',
                  name: 'test-dataset',
                  secureMonitoringEnabled: false,
                },
              },
            ],
            cloudPlatform: 'gcp',
          },
          syncPermissions: false,
        },
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
    // Unprotected data, no auth domain
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      noticeExpected: false,
    },
    // Protected data, required auth domain
    {
      importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
      noticeExpected: true,
    },
  ] as { importRequest: ImportRequest; noticeExpected: boolean }[])(
    'shows a notice when importing protected data into a new workspace',
    async ({ importRequest, noticeExpected }) => {
      // Arrange
      const user = userEvent.setup();

      setup({ props: { importRequest } });

      // Act
      const newWorkspaceButton = screen.getByText('Create a new workspace');
      await user.click(newWorkspaceButton);

      const { renderNotice } = asMockedFn(NewWorkspaceModal).mock.lastCall[0];

      const isNoticeShown = (): boolean => {
        const { container: noticeContainer } = render(
          renderNotice?.({ selectedBillingProject: undefined }) as JSX.Element
        );
        const isNoticeShown = !!within(noticeContainer).queryByText(
          'Importing controlled access data will apply any additional access controls associated with the data to this workspace.'
        );
        return isNoticeShown;
      };

      // Assert
      expect(isNoticeShown()).toBe(noticeExpected);
    }
  );
});
