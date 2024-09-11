import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { MethodsAjaxContract } from 'src/libs/ajax/methods/Methods';
import * as ExportWorkflowToWorkspaceProvider from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import { WorkflowsContainer } from 'src/pages/workflows/workflow/WorkflowWrapper';
import { Snapshot } from 'src/snapshots/Snapshot';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { AzureContext, WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications');

type NavExports = typeof import('src/libs/nav');

const mockGoToPath = jest.fn();

jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(),
    // Additional lambda function is necessary to avoid issues with Jest
    // hoisting (the mock is hoisted above the mockGoToPath initialization)
    goToPath: (...args) => mockGoToPath(...args),
  })
);

const mockSnapshot: Snapshot = {
  managers: ['hello@world.org'],
  name: 'testname',
  createDate: '2024-09-04T15:37:57Z',
  documentation: '',
  entityType: 'Workflow',
  snapshotComment: '',
  snapshotId: '1',
  namespace: 'testnamespace',
  payload:
    // eslint-disable-next-line no-template-curly-in-string
    'task echo_files {\\n  String? input1\\n  String? input2\\n  String? input3\\n  \\n  output {\\n    String out = read_string(stdout())\\n  }\\n\\n  command {\\n    echo \\"result: ${input1} ${input2} ${input3}\\"\\n  }\\n\\n  runtime {\\n    docker: \\"ubuntu:latest\\"\\n  }\\n}\\n\\nworkflow echo_strings {\\n  call echo_files\\n}',
  url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/sschu/echo-strings-test/1',
  public: true,
  synopsis: '',
};

const mockAjax = () =>
  asMockedFn(Ajax).mockReturnValue({
    Methods: {
      method: jest.fn(() => {
        return { get: jest.fn(() => mockSnapshot) };
      }) as Partial<MethodsAjaxContract>,
    } as MethodsAjaxContract,
  } as AjaxContract);

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock('src/workspaces/common/state/useWorkspaces', (): UseWorkspacesExports => {
  return {
    ...jest.requireActual<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces'),
    useWorkspaces: jest.fn(),
  };
});

const mockUseWorkspaces = (workspaces: WorkspaceWrapper[]) => {
  asMockedFn(useWorkspaces).mockReturnValue({
    workspaces,
    loading: false,
    refresh: jest.fn(),
    status: 'Ready',
  });
};

const mockWorkspace: WorkspaceInfo = {
  workspaceId: 'Workspace1',
  name: 'name1',
  namespace: 'namespace',
  cloudPlatform: 'Gcp',
  googleProject: 'project',
  billingAccount: 'account',
  bucketName: 'bucket',
  authorizationDomain: [],
  createdDate: '2023-02-15T19:17:15.711Z',
  createdBy: 'groot@gmail.com',
  lastModified: '2023-03-15T19:17:15.711Z',
};

const mockWorkspaces: Partial<WorkspaceWrapper>[] = [
  {
    workspace: mockWorkspace,
    accessLevel: 'WRITER',
  },
  {
    workspace: {
      workspaceId: 'Workspace2',
      name: 'name2',
      namespace: 'namespace',
      cloudPlatform: 'Gcp',
      googleProject: 'project',
      billingAccount: 'account',
      bucketName: 'bucket',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    accessLevel: 'OWNER',
  },
  {
    workspace: {
      workspaceId: 'Workspace3',
      name: 'name3',
      namespace: 'namespace',
      cloudPlatform: 'Gcp',
      googleProject: 'project',
      billingAccount: 'account',
      bucketName: 'bucket',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    accessLevel: 'READER',
  },
  {
    workspace: {
      workspaceId: 'Workspace4',
      name: 'name4',
      namespace: 'namespace',
      cloudPlatform: 'Azure',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    azureContext: {} as AzureContext,
    accessLevel: 'PROJECT_OWNER',
  },
];

describe('workflows container', () => {
  it('displays export to workspace modal when export button is pressed', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces([]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    const dialog = screen.getByRole('dialog', { name: /export to workspace/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Export to Workspace')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('hides export to workspace modal when it is dismissed', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces([]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByRole('dialog', { name: /export to workspace/i })).not.toBeInTheDocument();
  });

  it('properly filters destination workspace options in export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    const workspaceOptions = await workspaceSelector.getOptions();

    // should display GCP workspace with WRITER access level and GCP workspace
    // with OWNER access level; should not display GCP workspace with READER
    // access level or Azure workspace
    expect(workspaceOptions).toEqual([expect.stringMatching('name1'), expect.stringMatching('name2')]);
  });

  it('uses the workflow name as the default name in the export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    expect(screen.getByRole('textbox', { name: 'Name *' })).toHaveDisplayValue(mockSnapshot.name);
  });

  it('uses the correct export provider for the export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const exportWorkflowFromMethodsRepoProviderFactory = jest.spyOn(
      ExportWorkflowToWorkspaceProvider,
      'makeExportWorkflowFromMethodsRepoProvider'
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    expect(exportWorkflowFromMethodsRepoProviderFactory).toHaveBeenCalledWith({
      methodNamespace: mockSnapshot.namespace,
      methodName: mockSnapshot.name,
      methodVersion: Number(mockSnapshot.snapshotId),
    });
  });

  it('navigates to the correct location when viewing an exported workflow', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // So that clicking the export button does not fail
    jest.spyOn(ExportWorkflowToWorkspaceProvider, 'makeExportWorkflowFromMethodsRepoProvider').mockReturnValue({
      export: () => Promise.resolve(),
    });

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={mockSnapshot.snapshotId}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_google_icon.svg name1');
    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: 'newname' } });

    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('button', { name: /go to exported workflow/i }));

    // Assert
    expect(mockGoToPath).toHaveBeenCalledWith('workflow', {
      namespace: mockWorkspace.namespace,
      name: mockWorkspace.name,
      workflowNamespace: mockSnapshot.namespace,
      workflowName: 'newname',
    });
  });
});
