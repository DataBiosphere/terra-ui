import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { MenuTrigger } from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { useWorkspaceDetails } from 'src/components/workspace-utils'
import * as Utils from 'src/libs/utils'
import WorkspaceMenu, { tooltipText } from 'src/pages/workspaces/workspace/WorkspaceMenu'


jest.mock('src/components/workspace-utils', () => {
  const originalModule = jest.requireActual('src/components/workspace-utils')
  return {
    ...originalModule,
    useWorkspaceDetails: jest.fn()
  }
})

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger')
  return {
    ...originalModule,
    MenuTrigger: jest.fn()
  }
})

// Mocking TooltipTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
jest.mock('src/components/TooltipTrigger', () => ({
  ...jest.requireActual('src/components/TooltipTrigger'),
  __esModule: true,
  default: jest.fn()
}))

const workspaceMenuProps = {
  iconSize: 20, popupLocation: 'left',
  callbacks: {},
  workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
}

beforeEach(() => {
  MenuTrigger.mockImplementation(({ content }) => { return div({ role: 'menu' }, [content]) })
  TooltipTrigger.mockImplementation(({ content, children }) => {
    const [open, setOpen] = useState(false)
    return (div([
      div(
        {
          onMouseEnter: () => {
            setOpen(true)
          },
          onMouseLeave: () => {
            setOpen(false)
          }
        },
        [children]
      ),
      open && !!content && div([content])
    ]))
  })
})

describe('WorkspaceMenu - undefined workspace', () => {
  beforeEach(() => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: undefined })
  })

  it('should not fail any accessibility tests', async () => {
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps))
    // Assert
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    'Clone', 'Share', 'Lock', 'Leave', 'Delete'
  ])('renders menu item %s as disabled', menuText => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText(menuText)
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it.each([
    { menuText: 'Clone', tooltipText: tooltipText.cloneAzureUnsupported },
    { menuText: 'Share', tooltipText: tooltipText.shareNoPermission },
    { menuText: 'Delete', tooltipText: tooltipText.deleteLocked },
    { menuText: 'Delete', tooltipText: tooltipText.deleteNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission }
  ])('does not render tooltip text "$tooltipText" for menu item $menuText', ({ menuText, tooltipText }) => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText(menuText))
    // Assert
    expect(screen.queryByText(tooltipText)).toBeNull()
  })
})

describe('WorkspaceMenu - GCP workspace', () => {
  it('should not fail any accessibility tests', async () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare: true, workspace: {} }, accessLevel: 'OWNER' })
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps))
    // Assert
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders menu item Clone as enabled', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Clone')
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled')
  })

  it('renders menu item Leave as enabled', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Leave')
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled')
  })

  it.each([
    true, false
  ])('enables/disables Share menu item based on canShare: %s', canShare => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare, workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Share')
    // Assert
    if (canShare) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    true, false
  ])('renders Share tooltip based on canShare: %s', canShare => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare, workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Share')
    fireEvent.mouseOver(menuItem)
    // Assert
    if (canShare) {
      expect(screen.queryByText(tooltipText.shareNoPermission)).toBeNull()
    } else {
      expect(screen.queryByText(tooltipText.shareNoPermission)).not.toBeNull()
    }
  })

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Unlock', accessLevel: 'OWNER' },
    { menuText: 'Unlock', accessLevel: 'READER' }
  ])('enables/disables $menuText menu item based on access level $accessLevel', ({ menuText, accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: menuText === 'Unlock' }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText(menuText)
    // Assert
    if (Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    { menuText: 'Unlock', tooltipText: tooltipText.unlockNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission }
  ])('renders $menuText menu item tooltip "$tooltipText" for access level READER', ({ menuText, tooltipText }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { accessLevel: 'READER', workspace: { isLocked: menuText === 'Unlock' } } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText(menuText))
    // Assert
    expect(screen.queryByText(tooltipText)).not.toBeNull()
  })

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false }
  ])('renders Delete menu item as enabled/disabled for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: locked }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Delete')
    // Assert
    if (!locked && Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false }
  ])('renders Delete tooltip for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: locked }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    if (!locked && Utils.isOwner(accessLevel)) {
      expect(screen.queryByText(tooltipText.deleteLocked)).toBeNull()
      expect(screen.queryByText(tooltipText.deleteNoPermission)).toBeNull()
    } else if (locked) {
      expect(screen.queryByText(tooltipText.deleteLocked)).not.toBeNull()
    } else {
      expect(screen.queryByText(tooltipText.deleteNoPermission)).not.toBeNull()
    }
  })
})

describe('WorkspaceMenu - Azure workspace', () => {
  beforeEach(() => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: {}
      }
    })
  })

  it('should not fail any accessibility tests', async () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: {},
        canShare: true,
        accessLevel: 'OWNER'
      }
    })
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps))
    // Assert
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders menu item Clone as disabled', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Clone')
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it('renders Clone menu item tooltip', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Clone'))
    // Assert
    expect(screen.queryByText(tooltipText.cloneAzureUnsupported)).not.toBeNull()
  })

  it('renders menu item Leave as enabled', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Leave')
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled')
  })

  it.each([
    true, false
  ])('enables/disables Share menu item based on canShare: %s', canShare => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: {},
        canShare
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Share')
    // Assert
    if (canShare) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    true, false
  ])('renders Share tooltip based on canShare: %s', canShare => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: {},
        canShare
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Share')
    fireEvent.mouseOver(menuItem)
    // Assert
    if (canShare) {
      expect(screen.queryByText(tooltipText.shareNoPermission)).toBeNull()
    } else {
      expect(screen.queryByText(tooltipText.shareNoPermission)).not.toBeNull()
    }
  })

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Unlock', accessLevel: 'OWNER' },
    { menuText: 'Unlock', accessLevel: 'READER' }
  ])('enables/disables $menuText menu item based on access level $accessLevel', ({ menuText, accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: { isLocked: menuText === 'Unlock' },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText(menuText)
    // Assert
    if (Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    { menuText: 'Unlock', tooltipText: tooltipText.unlockNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission }
  ])('renders $menuText menu item tooltip "$tooltipText" for access level READER', ({ menuText, tooltipText }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: { isLocked: menuText === 'Unlock' },
        accessLevel: 'READER'
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText(menuText))
    // Assert
    expect(screen.queryByText(tooltipText)).not.toBeNull()
  })

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false }
  ])('renders Delete menu item as enabled/disabled for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: { isLocked: locked },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Delete')
    // Assert
    if (!locked && Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false }
  ])('renders Delete tooltip for access level $accessLevel and locked status $locked', ({ accessLevel, locked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        workspace: { isLocked: locked },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    if (!locked && Utils.isOwner(accessLevel)) {
      expect(screen.queryByText(tooltipText.deleteLocked)).toBeNull()
      expect(screen.queryByText(tooltipText.deleteNoPermission)).toBeNull()
    } else if (locked) {
      expect(screen.queryByText(tooltipText.deleteLocked)).not.toBeNull()
    } else {
      expect(screen.queryByText(tooltipText.deleteNoPermission)).not.toBeNull()
    }
  })
})
