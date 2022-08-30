import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { MenuTrigger } from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { useWorkspaceDetails } from 'src/components/workspace-utils'
import * as Utils from 'src/libs/utils'
import WorkspaceMenu, { TooltipText } from 'src/pages/workspaces/workspace/WorkspaceMenu'


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
  MenuTrigger.mockImplementation(({ content }) => { return div([content]) })
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

  it.each([
    'Clone', 'Share', 'Lock', 'Delete'
  ])('renders menu item %s as disabled', menuText => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText(menuText)
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it('renders Clone tooltip', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Clone'))
    // Assert
    expect(screen.queryByText(TooltipText.AzureCloneTooltip)).toBeNull()
  })

  it('renders Share tooltip', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Share'))
    // Assert
    expect(screen.queryByText(TooltipText.AzureShareTooltip)).toBeNull()
  })
})

describe('WorkspaceMenu - GCP workspace', () => {
  it('renders menu item Clone as enabled', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Clone')
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled')
  })

  it.each([
    true, false
  ])('enables Share menu item based on canShare: %s', canShare => {
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

  it('renders Share tooltip', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare: false, workspace: {} } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Share')
    fireEvent.mouseOver(menuItem)
    // Assert
    expect(screen.queryByText('You have not been granted permission to share this workspace')).not.toBeNull()
  })

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Delete', accessLevel: 'OWNER' },
    { menuText: 'Delete', accessLevel: 'READER' }
  ])('enables $menuText menu item based on access level $accessLevel (Unlocked workspace)', ({ menuText, accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: false }, accessLevel } })
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
    { accessLevel: 'OWNER' },
    { accessLevel: 'READER' }
  ])('enables Unlock menu item based on access level $accessLevel (Locked workspace)', ({ accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: true }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Unlock')
    // Assert
    if (Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it('renders Unlock tooltip for access level READER', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { accessLevel: 'READER', workspace: { isLocked: true } } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Unlock'))
    // Assert
    expect(screen.queryByText('You have not been granted permission to unlock this workspace')).not.toBeNull()
  })

  it('renders Lock tooltip for access level READER', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { accessLevel: 'READER', workspace: { isLocked: false } } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Lock'))
    // Assert
    expect(screen.queryByText('You have not been granted permission to lock this workspace')).not.toBeNull()
  })

  it.each([
    { accessLevel: 'READER' },
    { accessLevel: 'OWNER' }
  ])('renders Delete menu item as disabled for access level $accessLevel (Locked workspace)', ({ accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: true }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Delete')
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it.each([
    { accessLevel: 'OWNER' },
    { accessLevel: 'READER' }
  ])('renders Delete tooltip for access level $accessLevel (Locked workspace)', accessLevel => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { workspace: { isLocked: true }, accessLevel } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    expect(screen.queryByText('You cannot delete a locked workspace')).not.toBeNull()
  })

  it('renders Delete tooltip for access level READER (Unlocked workspace)', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({ workspace: { accessLevel: 'READER', workspace: { isLocked: false } } })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    expect(screen.queryByText('You must be an owner of this workspace or the underlying billing project')).not.toBeNull()
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

  it.each([
    'Clone', 'Share'
  ])('renders menu item %s as disabled', menuText => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText(menuText)
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it('renders Clone tooltip', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Clone'))
    // Assert
    expect(screen.queryByText(TooltipText.AzureCloneTooltip)).not.toBeNull()
  })

  it('renders Share tooltip', () => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Share'))
    // Assert
    expect(screen.queryByText(TooltipText.AzureShareTooltip)).not.toBeNull()
  })

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Delete', accessLevel: 'OWNER' },
    { menuText: 'Delete', accessLevel: 'READER' }
  ])('enables $menuText menu item based on access level $accessLevel (Unlocked workspace)', ({ menuText, accessLevel, isLocked }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        workspace: { isLocked },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
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
    { accessLevel: 'OWNER' },
    { accessLevel: 'READER' }
  ])('enables Unlock menu item based on access level $accessLevel (Locked workspace)', ({ accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        workspace: { isLocked: true },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Unlock')
    // Assert
    if (Utils.isOwner(accessLevel)) {
      expect(menuItem).not.toHaveAttribute('disabled')
    } else {
      expect(menuItem).toHaveAttribute('disabled')
    }
  })

  it('renders Unlock tooltip for access level READER', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        accessLevel: 'READER', workspace: { isLocked: true },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' }
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Unlock'))
    // Assert
    expect(screen.queryByText('You have not been granted permission to unlock this workspace')).not.toBeNull()
  })

  it('renders Lock tooltip for access level READER', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        accessLevel: 'READER', workspace: { isLocked: false },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' }
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Lock'))
    // Assert
    expect(screen.queryByText('You have not been granted permission to lock this workspace')).not.toBeNull()
  })

  it.each([
    { accessLevel: 'READER' },
    { accessLevel: 'OWNER' }
  ])('renders Delete menu item as disabled for all access level $accessLevel (Locked workspace)', ({ accessLevel }) => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        workspace: { isLocked: true },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    const menuItem = screen.getByText('Delete')
    // Assert
    expect(menuItem).toHaveAttribute('disabled')
  })

  it.each([
    { accessLevel: 'OWNER' },
    { accessLevel: 'READER' }
  ])('renders Delete tooltip for access level $accessLevel (Locked workspace)', accessLevel => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        workspace: { isLocked: true },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
        accessLevel
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    expect(screen.queryByText('You cannot delete a locked workspace')).not.toBeNull()
  })

  it('renders Delete tooltip for access level READER (Unlocked workspace)', () => {
    // Arrange
    useWorkspaceDetails.mockReturnValue({
      workspace: {
        accessLevel: 'READER', workspace: { isLocked: false },
        azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' }
      }
    })
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps))
    fireEvent.mouseOver(screen.getByText('Delete'))
    // Assert
    expect(screen.queryByText('You must be an owner of this workspace or the underlying billing project')).not.toBeNull()
  })
})

