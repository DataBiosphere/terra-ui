import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import * as Nav from 'src/libs/nav';
import { ImportWorkflowModal } from 'src/workflows-app/components/ImportWorkflowModal';
import { mockAzureWorkspace } from 'src/workflows-app/utils/mock-responses';

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  goToPath: jest.fn(),
}));

describe('Import Workflow Modal', () => {
  it('spinner if still importing', () => {
    render(
      h(ImportWorkflowModal, {
        importLoading: true,
        methodName: 'test method',
        onDismiss: jest.fn(),
        workspace: mockAzureWorkspace,
        namespace: 'test-azure-ws-namespace',
        setSelectedSubHeader: jest.fn(),
        methodId: '10000000-0000-0000-0000-000000000001',
        successfulImport: true,
        errorMessage: '',
      })
    );

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('render success message on good import', () => {
    render(
      h(ImportWorkflowModal, {
        importLoading: false,
        methodName: 'test method',
        onDismiss: jest.fn(),
        workspace: mockAzureWorkspace,
        namespace: 'test-azure-ws-namespace',
        setSelectedSubHeader: jest.fn(),
        methodId: '10000000-0000-0000-0000-000000000001',
        successfulImport: true,
        errorMessage: '',
      })
    );

    expect(screen.getByText('Success! test method has been added to your workspace.')).toBeInTheDocument();
  });

  it('render error message on bad import', () => {
    render(
      h(ImportWorkflowModal, {
        importLoading: false,
        methodName: 'test method',
        onDismiss: jest.fn(),
        workspace: mockAzureWorkspace,
        namespace: 'test-azure-ws-namespace',
        setSelectedSubHeader: jest.fn(),
        methodId: '10000000-0000-0000-0000-000000000001',
        successfulImport: false,
        errorMessage: 'bad import!',
      })
    );

    expect(screen.getByText('Error creating new method')).toBeInTheDocument();
    expect(screen.getByText('bad import!')).toBeInTheDocument();
  });

  it('modal is dismissed on click', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();

    render(
      h(ImportWorkflowModal, {
        importLoading: false,
        methodName: 'test method',
        onDismiss,
        workspace: mockAzureWorkspace,
        namespace: 'test-azure-ws-namespace',
        setSelectedSubHeader: jest.fn(),
        methodId: '10000000-0000-0000-0000-000000000001',
        successfulImport: true,
        errorMessage: '',
      })
    );

    const viewInWorkspaceButton = screen.getByText('View in my workspace');
    await user.click(viewInWorkspaceButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('navigate to submission config on click', async () => {
    const user = userEvent.setup();

    render(
      h(ImportWorkflowModal, {
        importLoading: false,
        methodName: 'test method',
        onDismiss: jest.fn(),
        workspace: mockAzureWorkspace,
        namespace: 'test-azure-ws-namespace',
        setSelectedSubHeader: jest.fn(),
        methodId: '10000000-0000-0000-0000-000000000001',
        successfulImport: true,
        errorMessage: '',
      })
    );

    const configureButton = screen.getByText('Start configuring now');
    await user.click(configureButton);

    expect(Nav.goToPath).toHaveBeenCalledWith('workspace-workflows-app-submission-config', {
      name: 'test-azure-ws-name',
      namespace: 'test-azure-ws-namespace',
      methodId: '10000000-0000-0000-0000-000000000001',
    });
  });
});
