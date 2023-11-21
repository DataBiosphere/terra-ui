import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Snapshot } from 'src/libs/ajax/DataRepo';
import { CloudProvider, WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { makeGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { ImportRequest } from './import-types';
import { canImportIntoWorkspace, ImportOptions } from './import-utils';
import { ImportDataDestination, ImportDataDestinationProps } from './ImportDataDestination';

type ImportUtilsExports = typeof import('./import-utils');
jest.mock('./import-utils', (): ImportUtilsExports => {
  return {
    ...jest.requireActual<ImportUtilsExports>('./import-utils'),
    canImportIntoWorkspace: jest.fn().mockReturnValue(true),
  };
});

type NewWorkspaceModalExports = typeof import('src/components/NewWorkspaceModal') & { __esModule: true };
jest.mock('src/components/NewWorkspaceModal', (): NewWorkspaceModalExports => {
  return {
    ...jest.requireActual<NewWorkspaceModalExports>('src/components/NewWorkspaceModal'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type WorkspaceUtilsExports = typeof import('src/components/workspace-utils');
jest.mock('src/components/workspace-utils', (): WorkspaceUtilsExports => {
  return {
    ...jest.requireActual<WorkspaceUtilsExports>('src/components/workspace-utils'),
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
      const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
      await user.click(existingWorkspace); // select start with existing workspace

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
      const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
      await user.click(existingWorkspace); // select start with existing workspace

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
    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace

    // Assert
    const notice = screen.queryByText(
      'Note that the import process may take some time after you are redirected into your destination workspace.'
    );

    const isNoticeShown = !!notice;
    expect(isNoticeShown).toBe(shouldShowNotice);
  });

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
      const newWorkspaceButton = screen.getByText('Start with a new workspace');
      await user.click(newWorkspaceButton);

      // Assert
      expect(NewWorkspaceModal).toHaveBeenCalledWith(
        expect.objectContaining(expectedNewWorkspaceModalProps),
        expect.anything()
      );
    }
  );

  it('hides new workspace option for imports of protected Azure snapshots', async () => {
    // Arrange
    setup({
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
                  secureMonitoringEnabled: true,
                },
              },
            ],
            cloudPlatform: 'azure',
          },
          syncPermissions: false,
        },
      },
    });

    // Assert
    expect(screen.queryByText('Start with a new workspace')).toBeNull();
  });
});
