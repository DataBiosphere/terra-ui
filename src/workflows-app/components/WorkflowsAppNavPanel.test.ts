import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { WorkflowsAppNavPanel } from 'src/workflows-app/components/WorkflowsAppNavPanel';

describe('Left Navigation Panel', () => {
  it('renders headers', async () => {
    const user = userEvent.setup();

    render(
      h(WorkflowsAppNavPanel, {
        loading: false,
        launcherDisabled: true,
        createWorkflowsApp: jest.fn(),
        pageReady: true,
      })
    );

    // Assert
    screen.getByText('Workflows in this workspace');
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
});
