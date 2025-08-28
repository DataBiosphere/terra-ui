import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SpendReportDownloader } from 'src/billing/SpendReport/SpendReportDownloader';
import { WorkspaceInfo } from 'src/libs/ajax/workspaces/workspace-models';
import { renderWithAppContexts } from 'src/testing/test-utils';
import { makeGoogleWorkspace } from 'src/testing/workspace-fixtures';

const firstWorkspace = makeGoogleWorkspace({
  workspace: { name: 'firstWorkspace', workspaceId: 'firstId' },
}) as unknown as WorkspaceInfo;
const secondWorkspace = makeGoogleWorkspace({
  workspace: { name: 'secondWorkspace', workspaceId: 'secondId' },
}) as unknown as WorkspaceInfo;
const thirdWorkspace = makeGoogleWorkspace({
  workspace: { name: 'thirdWorkspace', workspaceId: 'thirdId' },
}) as unknown as WorkspaceInfo;

const mockWorkspaces = [firstWorkspace, secondWorkspace, thirdWorkspace];

describe('SpendReportDownloader', () => {
  it('renders the download button with the correct title', () => {
    // Arrange
    render(<SpendReportDownloader title='Test Report' filteredOwnedWorkspaces={mockWorkspaces} />);

    // Assert
    expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument();
  });

  it('disables the button when filteredOwnedWorkspaces is empty', () => {
    // Arrange
    render(<SpendReportDownloader title='Test Report' filteredOwnedWorkspaces={[]} />);

    // Assert
    expect(screen.getByRole('button', { name: /download report/i })).toBeDisabled();
  });

  it('enables the button when filteredOwnedWorkspaces is not empty', () => {
    // Arrange
    render(<SpendReportDownloader title='Test Report' filteredOwnedWorkspaces={mockWorkspaces} />);

    // Assert
    expect(screen.getByRole('button', { name: /download report/i })).not.toBeDisabled();
  });

  it('shows menu and triggers download on menu item click', async () => {
    // Arrange
    const createObjectURLMock = jest.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = jest.fn();
    const clickMock = jest.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const a = originalCreateElement('a');
        Object.defineProperty(a, 'click', { value: clickMock });
        return a;
      }
      return originalCreateElement(tagName);
    });

    renderWithAppContexts(<SpendReportDownloader title='Test Report' filteredOwnedWorkspaces={mockWorkspaces} />);

    // Act & Assert
    fireEvent.click(screen.getByRole('button', { name: /download report/i }));
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('TSV')).toBeInTheDocument();
    fireEvent.click(screen.getByText('CSV'));
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
