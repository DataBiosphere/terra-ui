import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';

import { ImportDataDestination } from './ImportDataDestination';

type WorkspaceUtilsExports = typeof import('src/components/workspace-utils');
jest.mock(
  'src/components/workspace-utils',
  (): WorkspaceUtilsExports => ({
    ...jest.requireActual<WorkspaceUtilsExports>('src/components/workspace-utils'),
    useWorkspaces: jest.fn().mockReturnValue({
      loading: false,
      workspaces: [
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'protected-google',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-1',
            workspaceId: 'ws-1',
            bucketName: 'fc-secure-ws-1',
          },
          accessLevel: 'PROJECT_OWNER',
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'unprotected-google',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-2',
            workspaceId: 'ws-2',
            bucketName: 'fc-ws-2',
          },
          accessLevel: 'OWNER',
        },
        {
          workspace: { namespace: 'test-namespace', name: 'azure', cloudPlatform: 'Azure', workspaceId: 'ws-3' },
          accessLevel: 'WRITER',
        },
      ],
    }),
  })
);

describe('ImportDataDestination', () => {
  it('should explain protected data restricts eligible workspaces', async () => {
    const user = userEvent.setup();

    render(
      h(ImportDataDestination, {
        workspaceId: undefined,
        templateWorkspaces: {},
        template: undefined,
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isProtectedData: true,
      })
    );
    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace

    const protectedWarning = screen.queryByText(
      'You may only import to workspaces with an Authorization Domain and/or protected data setting.',
      {
        exact: false,
      }
    );
    expect(protectedWarning).not.toBeNull();
  });

  it('should not inform about protected data', async () => {
    const user = userEvent.setup();

    render(
      h(ImportDataDestination, {
        workspaceId: undefined,
        templateWorkspaces: {},
        template: undefined,
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isProtectedData: false,
      })
    );
    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace
    const protectedWarning = screen.queryByText(
      'You may only import to workspaces with an Authorization Domain and/or protected data setting.',
      {
        exact: false,
      }
    );
    expect(protectedWarning).toBeNull();
  });

  it('should disable noncompliant workspaces', async () => {
    const user = userEvent.setup();

    render(
      h(ImportDataDestination, {
        workspaceId: undefined,
        templateWorkspaces: {},
        template: undefined,
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isProtectedData: true,
      })
    );

    const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
    await user.click(existingWorkspace); // select start with existing workspace

    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls')!;
    const listbox = document.getElementById(listboxId)!;

    const options = getAllByRole(listbox, 'option');

    // only the google protected workspace should be enabled
    const protectedOpt = options.find((opt) => opt.textContent === 'protected-google');
    expect(protectedOpt).not.toBeNull();
    expect(protectedOpt!.getAttribute('aria-disabled')).toBe('false');

    const unprotected1 = options.find((opt) => opt.textContent === 'unprotected-google');
    expect(unprotected1).not.toBeNull();
    expect(unprotected1!.getAttribute('aria-disabled')).toBe('true');

    const unprotected2 = options.find((opt) => opt.textContent === 'azure');
    expect(unprotected2).not.toBeNull();
    expect(unprotected2!.getAttribute('aria-disabled')).toBe('true');
  });
});
