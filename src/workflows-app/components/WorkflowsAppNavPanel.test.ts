import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { WorkflowsAppNavPanel } from 'src/workflows-app/components/WorkflowsAppNavPanel';
import { mockAzureWorkspace } from 'src/workflows-app/utils/mock-responses';

const defaultAnalysesData: AnalysesData = {
  apps: [],
  refreshApps: jest.fn().mockReturnValue(Promise.resolve()),
  runtimes: [],
  refreshRuntimes: () => Promise.resolve(),
  appDataDisks: [],
  persistentDisks: [],
};

jest.mock('src/libs/ajax');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  useQueryParameter: jest.requireActual('react').useState,
}));

describe('Workflows App Navigation Panel', () => {
  it('renders headers', async () => {
    const user = userEvent.setup();

    render(
      h(WorkflowsAppNavPanel, {
        loading: false,
        launcherDisabled: true,
        createWorkflowsApp: jest.fn(),
        pageReady: true,
        name: 'test-azure-ws-name',
        namespace: 'test-azure-ws-namespace',
        workspace: mockAzureWorkspace,
        analysesData: defaultAnalysesData,
        setLoading: jest.fn(),
        signal: jest.fn(),
      })
    );

    // Assert
    // Using getAll because there will also be a header in the body. Wondering if this also points to a refactor -
    // where the panel and the content are on the same level, rather than the panel being a parent of the content
    screen.getAllByText('Workflows in this workspace');
    screen.getByText('Submission history');
    screen.getByText('Find & add workflows');
    screen.getByText('Featured workflows');
    screen.getByText('Import a workflow');
    screen.getByText('Dockstore');
    screen.getByText('Have questions?');

    // Act
    const findAndAddWorkflowsCollapse = screen.getByText('Find & add workflows');
    const featuredWorkflows = screen.getByText('Featured workflows');
    const importWorkflows = screen.getByText('Import a workflow');

    await user.click(findAndAddWorkflowsCollapse);

    expect(featuredWorkflows).not.toBeInTheDocument();
    expect(importWorkflows).not.toBeInTheDocument();
  });

  it('is disabled when page is not ready', () => {
    render(
      h(WorkflowsAppNavPanel, {
        loading: false,
        launcherDisabled: true,
        createWorkflowsApp: jest.fn(),
        pageReady: false,
        name: 'test-azure-ws-name',
        namespace: 'test-azure-ws-namespace',
        workspace: mockAzureWorkspace,
        analysesData: defaultAnalysesData,
        setLoading: jest.fn(),
        signal: jest.fn(),
      })
    );

    expect(screen.queryByText('Featured workflows')).not.toBeInTheDocument();
    expect(screen.queryByText('Import a workflow')).not.toBeInTheDocument();
    expect(screen.queryByText('Dockstore')).not.toBeInTheDocument();

    const workflowsInWorkspaceButton = screen.getAllByRole('button')[0];
    const submissionHistoryButton = screen.getAllByRole('button')[1];

    expect(workflowsInWorkspaceButton).toHaveAttribute('aria-disabled', 'true');
    expect(submissionHistoryButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders workflow launch card when page is not ready', async () => {
    const { rerender } = render(
      h(WorkflowsAppNavPanel, {
        loading: false,
        launcherDisabled: true,
        createWorkflowsApp: jest.fn(),
        pageReady: false,
        name: 'test-azure-ws-name',
        namespace: 'test-azure-ws-namespace',
        workspace: mockAzureWorkspace,
        analysesData: defaultAnalysesData,
        setLoading: jest.fn(),
        signal: jest.fn(),
      })
    );

    expect(screen.getByText('Launch Workflows app to run workflows')).toBeInTheDocument();

    // Re-render with pageReady: true
    await act(() => {
      rerender(
        h(WorkflowsAppNavPanel, {
          loading: false,
          launcherDisabled: true,
          createWorkflowsApp: jest.fn(),
          pageReady: true,
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          analysesData: defaultAnalysesData,
          setLoading: jest.fn(),
          signal: jest.fn(),
        })
      );
    });

    expect(screen.queryByText('Launch Workflows app to run workflows')).not.toBeInTheDocument();
  });
});
