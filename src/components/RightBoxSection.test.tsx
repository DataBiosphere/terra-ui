import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceRightBoxSection } from 'src/workspaces/dashboard/WorkspaceRightBoxSection';

import { RightBoxSection } from './RightBoxSection';

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

describe('RightBoxSection', () => {
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

  it('displays the title', async () => {
    // Arrange
    // Act
    await act(async () => {
      render(<RightBoxSection title='Test Title' persistenceId='testId' />);
    });
    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('toggles panel open state when clicked', async () => {
    // Arrange
    // Act
    render(
      <RightBoxSection title='Test Title' persistenceId='testId'>
        Panel Content
      </RightBoxSection>
    );
    const titleElement = screen.getByText('Test Title');
    expect(screen.queryByText('Panel Content')).toBeNull(); // ensuring the panel is closed
    fireEvent.click(titleElement);

    // Assert
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('fires a metrics event when the panel is toggled', async () => {
    // Arrange
    // Act
    render(
      <>
        <WorkspaceRightBoxSection title='Test Title' persistenceId='metricsId' workspace={workspace} />
        <RightBoxSection title='Test Title' persistenceId='metricsId' onOpenChangedCallback={captureEvent}>
          Panel Content
        </RightBoxSection>
      </>
    );
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
