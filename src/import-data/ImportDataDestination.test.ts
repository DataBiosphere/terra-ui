import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useWorkspaces } from 'src/components/workspace-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, SelectHelper } from 'src/testing/test-utils';
import { makeGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { canImportIntoWorkspace, ImportOptions } from './import-utils';
import { ImportDataDestination } from './ImportDataDestination';

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

describe('ImportDataDestination', () => {
  it.each([true, false])('should explain protected data restricts eligible workspaces', async (isProtectedData) => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(useWorkspaces).mockReturnValue({
      loading: false,
      refresh: () => Promise.resolve(),
      workspaces: [],
    });

    render(
      h(ImportDataDestination, {
        initialSelectedWorkspaceId: undefined,
        templateWorkspaces: {},
        template: undefined,
        userHasBillingProjects: true,
        importMayTakeTime: true,
        requiredAuthorizationDomain: undefined,
        onImport: () => {},
        isProtectedData,
      })
    );

    // Act
    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace

    // Assert
    const protectedWarning = screen.queryByText(
      'You may only import to workspaces with an Authorization Domain and/or protected data setting.',
      {
        exact: false,
      }
    );

    const isWarningShown = !!protectedWarning;
    expect(isWarningShown).toEqual(isProtectedData);
  });

  it('should filters workspaces through canImportIntoWorkspace', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(useWorkspaces).mockReturnValue({
      loading: false,
      refresh: () => Promise.resolve(),
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

    asMockedFn(canImportIntoWorkspace).mockImplementation(
      (_importOptions: ImportOptions, workspace: WorkspaceWrapper): boolean => {
        return workspace.workspace.name === 'allowed-workspace';
      }
    );

    // Act
    render(
      h(ImportDataDestination, {
        initialSelectedWorkspaceId: undefined,
        templateWorkspaces: {},
        template: undefined,
        userHasBillingProjects: true,
        importMayTakeTime: true,
        requiredAuthorizationDomain: 'test-auth-domain',
        onImport: () => {},
        isProtectedData: true,
      })
    );

    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace

    const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);
    const workspaces = await workspaceSelect.getOptions();

    // Assert
    expect(canImportIntoWorkspace).toHaveBeenCalledWith(
      {
        isProtectedData: true,
        requiredAuthorizationDomain: 'test-auth-domain',
      },
      expect.anything()
    );
    expect(workspaces).toEqual(['allowed-workspace']);
  });
});
