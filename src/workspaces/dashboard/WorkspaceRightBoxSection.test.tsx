import { asMockedFn } from '@terra-ui-packages/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceRightBoxSection } from 'src/workspaces/dashboard/WorkspaceRightBoxSection';

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

describe('WorkspaceRightBoxSection', () => {
  const workspace = defaultAzureWorkspace;
  const captureEvent = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  it('fires a metrics event when the panel is toggled', async () => {
    // Arrange
    // Act
    render(<WorkspaceRightBoxSection title='Test Title' persistenceId='metricsId' workspace={workspace} />);

    const titleElement = screen.getAllByText('Test Title');
    fireEvent.click(titleElement[0]);
    fireEvent.click(titleElement[0]);

    // Assert
    expect(captureEvent).toHaveBeenNthCalledWith(1, Events.workspaceDashboardToggleSection, {
      opened: true,
      title: 'Test Title',
      ...extractWorkspaceDetails(workspace),
    });
    expect(captureEvent).toHaveBeenNthCalledWith(2, Events.workspaceDashboardToggleSection, {
      opened: false,
      title: 'Test Title',
      ...extractWorkspaceDetails(workspace),
    });
  });
});
