import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { WorkspaceTabs } from 'src/pages/workspaces/workspace/WorkspaceTabs';
import { asMockedFn } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// Mocking for Nav.getLink
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
}));
// Mocking feature preview setup
jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

const mockWorkspaceMenu = jest.fn();
jest.mock(
  'src/pages/workspaces/workspace/WorkspaceMenu',
  () =>
    function (props) {
      mockWorkspaceMenu(props);
      return null;
    }
);

describe('WorkspaceTabs', () => {
  it('renders subset of tabs if workspace is unknown, with no accessibility issues', async () => {
    // Arrange
    const props = {
      workspace: undefined,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };

    // Act
    const { container } = render(h(WorkspaceTabs, props));

    // Assert
    const tabs = screen.getAllByRole('menuitem');
    expect(tabs.length).toBe(3);
    expect(within(tabs[0]).getByText('dashboard')).not.toBeNull();
    expect(within(tabs[1]).getByText('data')).not.toBeNull();
    expect(within(tabs[2]).getByText('analyses')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders subset of tabs for Azure workspace, with no accessibility issues', async () => {
    // Arrange
    const props = {
      workspace: defaultAzureWorkspace,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };
    // Act
    const { container } = render(h(WorkspaceTabs, props));
    // Assert
    const tabs = screen.getAllByRole('menuitem');
    expect(tabs.length).toBe(4);
    expect(within(tabs[0]).getByText('dashboard')).not.toBeNull();
    expect(within(tabs[1]).getByText('data')).not.toBeNull();
    expect(within(tabs[2]).getByText('analyses')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders subset of tabs for Azure workspace with flag enabled, with no accessibility issues', async () => {
    // Enable config
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(true);
    // isFeaturePreviewEnabled.mockReturnValue(true);
    // Arrange
    const props = {
      workspace: defaultAzureWorkspace,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };
    // Act
    const { container } = render(h(WorkspaceTabs, props));
    // Assert
    const tabs = screen.getAllByRole('menuitem');
    expect(tabs.length).toBe(4);
    expect(within(tabs[0]).getByText('dashboard')).not.toBeNull();
    expect(within(tabs[1]).getByText('data')).not.toBeNull();
    expect(within(tabs[2]).getByText('analyses')).not.toBeNull();
    expect(within(tabs[3]).getByText('workflows')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders subset of tabs for Gcp workspace, with no accessibility issues', async () => {
    // Arrange
    const props = {
      workspace: defaultGoogleWorkspace,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };
    // Act
    const { container } = render(h(WorkspaceTabs, props));
    // Assert
    const tabs = screen.getAllByRole('menuitem');
    expect(tabs.length).toBe(5);
    expect(within(tabs[0]).getByText('dashboard')).not.toBeNull();
    expect(within(tabs[1]).getByText('data')).not.toBeNull();
    expect(within(tabs[2]).getByText('analyses')).not.toBeNull();
    expect(within(tabs[3]).getByText('workflows')).not.toBeNull();
    expect(within(tabs[4]).getByText('job history')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes workspaceInfo to the workspaceMenu (OWNER, canShare)', () => {
    // Arrange
    const props = {
      workspace: defaultGoogleWorkspace,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };
    // Act
    render(h(WorkspaceTabs, props));
    // Assert
    expect(mockWorkspaceMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceInfo: { canShare: true, isLocked: false, isOwner: true, workspaceLoaded: true },
      })
    );
  });

  it('passes default workspaceInfo to the workspaceMenu if workspace is not loaded', () => {
    // Arrange
    const props = {
      workspace: undefined,
      setDeletingWorkspace: () => {},
      setCloningWorkspace: () => {},
      setSharingWorkspace: () => {},
      setShowLockWorkspaceModal: () => {},
      setLeavingWorkspace: () => {},
      refresh: () => {},
    };
    // Act
    render(h(WorkspaceTabs, props));
    // Assert
    expect(mockWorkspaceMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceInfo: { canShare: false, isLocked: false, isOwner: false, workspaceLoaded: false },
      })
    );
  });
});
