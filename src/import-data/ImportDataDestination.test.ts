import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Snapshot } from 'src/libs/ajax/DataRepo';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
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

      setup({
        props: {
          importRequest,
        },
      });

      // Act
      const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
      await user.click(existingWorkspace); // select start with existing workspace

      // Assert
      const protectedDataWarning = screen.queryByText(
        'You may only import to workspaces with an Authorization Domain and/or protected data setting.',
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
      expectedArgs: { isProtectedData: true, requiredAuthorizationDomain: 'test-auth-domain' },
    },
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      requiredAuthorizationDomain: undefined,
      expectedArgs: { isProtectedData: false, requiredAuthorizationDomain: undefined },
    },
  ] as {
    importRequest: ImportRequest;
    requiredAuthorizationDomain?: string;
    expectedArgs: { isProtectedData: boolean; requiredAuthorizationDomain?: string };
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
      expect(workspaces).toEqual(['allowed-workspace']);
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
});
