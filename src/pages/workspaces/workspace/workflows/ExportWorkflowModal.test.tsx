import { act, fireEvent, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import _ from 'lodash';
import React from 'react';
import { ExportWorkflowToWorkspaceProvider } from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import ExportWorkflowModal from 'src/pages/workspaces/workspace/workflows/ExportWorkflowModal';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';

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

const mockOnSuccess = jest.fn();
const mockOnDismiss = jest.fn();
const mockOnGoToExportedWorkflow = jest.fn();

const emptyExportProvider = {} as ExportWorkflowToWorkspaceProvider;

const errorExportProvider: ExportWorkflowToWorkspaceProvider = {
  export: jest.fn(() => {
    throw new Error('You must obtain true power before you can make API calls.');
  }),
};

const thrownResponseExportProvider: ExportWorkflowToWorkspaceProvider = {
  export: jest.fn(() => {
    throw new Response('This is an error');
  }),
};

const successExportProvider: ExportWorkflowToWorkspaceProvider = {
  export: jest.fn(),
};

const mockWorkspaceFilter = () => true;

const mockWorkspace = {
  workspaceId: 'Workspace1',
  name: 'name1',
  namespace: 'good namespace',
  cloudPlatform: 'Azure',
  authorizationDomain: [],
  createdDate: '2023-02-15T19:17:15.711Z',
  createdBy: 'groot@gmail.com',
  lastModified: '2023-03-15T19:17:15.711Z',
} as WorkspaceInfo;

const mockWorkspaces: Partial<WorkspaceWrapper>[] = [
  {
    workspace: mockWorkspace,
  },
  {
    workspace: {
      workspaceId: 'Workspace2',
      name: 'name2',
      namespace: 'bad namespace',
      cloudPlatform: 'Azure',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
  },
  {
    workspace: {
      workspaceId: 'Workspace3',
      name: 'name3',
      namespace: 'good namespace',
      cloudPlatform: 'Azure',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
  },
];

describe('export workflow main modal', () => {
  it('renders correct elements when destination workspace is pre-selected', async () => {
    // Arrange
    mockUseWorkspaces([]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='title'
          exportButtonText='export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert
    expect(screen.getByText('Name *')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name *' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    expect(screen.queryByText('Destination *')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Select a workspace' })).not.toBeInTheDocument();
  });

  it('renders correct elements when destination workspace is not pre-selected', async () => {
    // Arrange
    mockUseWorkspaces([]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='title'
          exportButtonText='export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert
    expect(screen.getByText('Name *')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name *' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    expect(screen.getByText('Destination *')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select a workspace' })).toBeInTheDocument();
  });

  it('renders custom title and button text', async () => {
    // Arrange
    mockUseWorkspaces([]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Custom Button Text'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom Button Text' })).toBeInTheDocument();
  });

  it('prefills the default workflow name', async () => {
    // Arrange
    mockUseWorkspaces([]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Custom Button Text'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert
    expect(screen.getByRole('textbox', { name: 'Name *' })).toHaveDisplayValue('defaultname');
  });

  it('filters destination workspace options', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={(workspace) => workspace.workspace.namespace === 'good namespace'}
          title='Custom Title'
          exportButtonText='Custom Button Text'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert
    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    const workspaceOptions = await workspaceSelector.getOptions();

    expect(workspaceOptions).toEqual([expect.stringMatching('name1'), expect.stringMatching('name3')]);
  });

  it('validates that the destination workspace cannot be blank', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    // Assert

    // Error message in button tooltip
    expect(screen.getByText("Selected workspace id can't be blank")).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('disabled');
  });

  it('validates that the workflow name cannot be blank', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: '' } });

    // Assert

    // Error message under input and in button tooltip
    expect(screen.getAllByText("Workflow name can't be blank")).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('disabled');
  });

  it('validates that the workflow name cannot contain invalid symbols', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: 'myworkflow!' } });

    // Assert

    // Error message under input and in button tooltip
    expect(
      screen.getAllByText('Workflow name can only contain letters, numbers, underscores, dashes, and periods')
    ).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('disabled');
  });

  it('validates that the workflow name cannot exceed 254 characters in length', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={emptyExportProvider}
          onDismiss={_.noop}
        />
      );
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: _.repeat('a', 255) } });

    // Assert

    // Error message under input and in button tooltip
    expect(screen.getAllByText('Workflow name is too long (maximum is 254 characters)')).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('disabled');
  });

  it('handles pressing the cancel button', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_azure_icon.svg name1');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(successExportProvider.export).not.toHaveBeenCalled();
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('successfully exports a workflow', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_azure_icon.svg name1');

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(successExportProvider.export).toHaveBeenCalledWith(mockWorkspaces[0].workspace, 'defaultname');
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('successfully exports a workflow with a predetermined destination workspace and custom name', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: 'customname' } });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(successExportProvider.export).toHaveBeenCalledWith(mockWorkspace, 'customname');
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('handles errors from the export provider', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={errorExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_azure_icon.svg name1');

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(errorExportProvider.export).toHaveBeenCalledWith(mockWorkspaces[0].workspace, 'defaultname');
    expect(screen.getByText('You must obtain true power before you can make API calls.')).toBeInTheDocument();
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('handles thrown responses from the export provider', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={thrownResponseExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_azure_icon.svg name1');

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(thrownResponseExportProvider.export).toHaveBeenCalledWith(mockWorkspaces[0].workspace, 'defaultname');
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('handles errors from the destination workspace not being found', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const missingWorkspace = { workspaceId: 'abc123' } as WorkspaceInfo;

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={missingWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={errorExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(screen.getByText('Cannot find destination workspace')).toBeInTheDocument();
    expect(errorExportProvider.export).not.toHaveBeenCalled();
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });
});

describe('export workflow post-export modal', () => {
  it('does not appear if onGoToExportedWorkflow is not provided', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(screen.queryByRole('button', { name: /stay here/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go to exported workflow/i })).not.toBeInTheDocument();
  });

  it('renders key elements', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onDismiss={_.noop}
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stay here/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to exported workflow/i })).toBeInTheDocument();
  });

  it('renders destination workspace name and selected workflow name', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspaceFilter}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onDismiss={_.noop}
        />
      );
    });

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_azure_icon.svg name1');

    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: 'customname' } });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    // Assert
    expect(screen.getByText('name1', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('customname', { exact: false })).toBeInTheDocument();
  });

  it('handles pressing the stay here button', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    await user.click(screen.getByRole('button', { name: /stay here/i }));

    // Assert
    expect(mockOnDismiss).toHaveBeenCalled();
    expect(mockOnGoToExportedWorkflow).not.toHaveBeenCalled();

    // The only call is from when the export succeeds
    expect(successExportProvider.export).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it('handles pressing the go to exported workflow button', async () => {
    // Arrange
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <ExportWorkflowModal
          defaultWorkflowName='defaultname'
          destinationWorkspace={mockWorkspace}
          title='Custom Title'
          exportButtonText='Export'
          exportProvider={successExportProvider}
          onGoToExportedWorkflow={mockOnGoToExportedWorkflow}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    await user.click(screen.getByRole('button', { name: /go to exported workflow/i }));

    // Assert
    expect(mockOnDismiss).not.toHaveBeenCalled();
    expect(mockOnGoToExportedWorkflow).toHaveBeenCalled();

    // The only call is from when the export succeeds
    expect(successExportProvider.export).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
