import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { div, h } from 'react-hyperscript-helpers';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { useWorkspaceDetails } from 'src/components/workspace-utils';
import * as WorkspaceUtils from 'src/libs/workspace-utils';
import WorkspaceMenu, { tooltipText } from 'src/pages/workspaces/workspace/WorkspaceMenu';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/components/workspace-utils', () => {
  const originalModule = jest.requireActual('src/components/workspace-utils');
  return {
    ...originalModule,
    useWorkspaceDetails: jest.fn(),
  };
});

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger');
  return {
    ...originalModule,
    MenuTrigger: jest.fn(),
  };
});

const workspaceMenuProps = {
  iconSize: 20,
  popupLocation: 'left',
  callbacks: {},
  workspaceInfo: { name: 'example1', namespace: 'example-billing-project' },
};

beforeEach(() => {
  MenuTrigger.mockImplementation(({ content }) => {
    return div({ role: 'menu' }, [content]);
  });
});

describe('WorkspaceMenu - undefined workspace', () => {
  beforeEach(() => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: undefined });
  });

  it('should not fail any accessibility tests', async () => {
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps));
    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['Clone', 'Share', 'Lock', 'Leave', 'Delete'])('renders menu item %s as disabled', (menuText) => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText(menuText);
    // Assert
    expect(menuItem).toHaveAttribute('disabled');
  });

  it.each([
    { menuText: 'Share', tooltipText: tooltipText.shareNoPermission },
    { menuText: 'Delete', tooltipText: tooltipText.deleteLocked },
    { menuText: 'Delete', tooltipText: tooltipText.deleteNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission },
  ])('does not render tooltip text "$tooltipText" for menu item $menuText', ({ menuText, tooltipText }) => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    fireEvent.mouseOver(screen.getByText(menuText));
    // Assert
    expect(screen.queryByText(tooltipText)).toBeNull();
  });
});

describe('WorkspaceMenu - defined workspace (GCP or Azure)', () => {
  it('should not fail any accessibility tests', async () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare: true, workspace: {} }, accessLevel: 'OWNER' });
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps));
    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders menu item Clone as enabled', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: {} } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Clone');
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled');
  });

  it('renders menu item Leave as enabled', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: {} } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Leave');
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled');
  });

  it.each([true, false])('enables/disables Share menu item based on canShare: %s', (canShare) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare, workspace: {} } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Share');
    // Assert
    if (canShare) {
      expect(menuItem).not.toHaveAttribute('disabled');
    } else {
      expect(menuItem).toHaveAttribute('disabled');
    }
  });

  it.each([true, false])('renders Share tooltip based on canShare: %s', (canShare) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare, workspace: {} } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Share');
    fireEvent.mouseOver(menuItem);
    // Assert
    if (canShare) {
      expect(screen.queryByRole('tooltip', { name: tooltipText.shareNoPermission })).toBeNull();
    } else {
      expect(screen.queryByRole('tooltip', { name: tooltipText.shareNoPermission })).not.toBeNull();
    }
  });

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Unlock', accessLevel: 'OWNER' },
    { menuText: 'Unlock', accessLevel: 'READER' },
  ])('enables/disables $menuText menu item based on access level $accessLevel', ({ menuText, accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: menuText === 'Unlock' }, accessLevel } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText(menuText);
    // Assert
    if (WorkspaceUtils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled');
    } else {
      expect(menuItem).toHaveAttribute('disabled');
    }
  });

  it.each([
    { menuText: 'Unlock', tooltipText: tooltipText.unlockNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission },
  ])('renders $menuText menu item tooltip "$tooltipText" for access level READER', ({ menuText, tooltipText }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { accessLevel: 'READER', workspace: { isLocked: menuText === 'Unlock' } } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    fireEvent.mouseOver(screen.getByText(menuText));
    // Assert
    expect(screen.queryByRole('tooltip', { name: tooltipText })).not.toBeNull();
  });

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false },
  ])('renders Delete menu item as enabled/disabled for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: locked }, accessLevel } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Delete');
    // Assert
    if (!locked && WorkspaceUtils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled');
    } else {
      expect(menuItem).toHaveAttribute('disabled');
    }
  });

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false },
  ])('renders Delete tooltip for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: locked }, accessLevel } });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    fireEvent.mouseOver(screen.getByText('Delete'));
    // Assert
    if (!locked && WorkspaceUtils.isOwner(accessLevel)) {
      expect(screen.queryByRole('tooltip', { name: tooltipText.deleteLocked })).toBeNull();
      expect(screen.queryByRole('tooltip', { name: tooltipText.deleteNoPermission })).toBeNull();
    } else if (locked) {
      expect(screen.queryByRole('tooltip', { name: tooltipText.deleteLocked })).not.toBeNull();
    } else {
      expect(screen.queryByRole('tooltip', { name: tooltipText.deleteNoPermission })).not.toBeNull();
    }
  });
});