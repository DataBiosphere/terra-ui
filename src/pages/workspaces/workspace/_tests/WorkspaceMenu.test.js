import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { MenuTrigger } from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { useWorkspaceDetails } from 'src/components/workspace-utils'
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu'


jest.mock('src/components/workspace-utils', () => {
  const originalModule = jest.requireActual('src/components/workspace-utils')
  return {
    ...originalModule,
    useWorkspaceDetails: jest.fn()
  }
})

jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger')
  return {
    ...originalModule,
    MenuTrigger: jest.fn()
  }
})

jest.mock('src/components/TooltipTrigger', () => ({
  ...jest.requireActual('src/components/TooltipTrigger'),
  __esModule: true,
  default: jest.fn()
}))


describe('WorkspaceMenu - undefined workspace', () => {
  beforeEach(() => {
    useWorkspaceDetails.mockReturnValue({ workspace: undefined })
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

  it('renders Clone menu item as disabled', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Clone')
    expect(menuText).toHaveAttribute('disabled')
  })

  it('renders Clone tooltip', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Clone'))
    expect(screen.queryByText('Cloning is not currently supported on Azure Workspaces')).toBeNull()
  })

  it('renders Share menu item as disabled', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Share')
    expect(menuText).toHaveAttribute('disabled')
  })

  it('renders Share tooltip', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Share'))
    expect(screen.queryByText('Sharing is not currently supported on Azure Workspaces')).toBeNull()
  })
})


describe('WorkspaceMenu - GCP workspace', () => {
  beforeEach(() => {
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare: false, workspace: { isLocked: false } } })
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

  it('renders Clone menu item as disabled', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Clone')
    expect(menuText).not.toHaveAttribute('disabled')
  })

  it('renders Clone tooltip', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Clone'))
    expect(screen.queryByText('Cloning is not currently supported on Azure Workspaces')).toBeNull()
  })

  it('renders Share menu item as disabled', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Share')
    expect(menuText).toHaveAttribute('disabled')
  })

  it('renders Share menu item as enabled', () => {
    useWorkspaceDetails.mockReturnValue({ workspace: { canShare: true, workspace: { isLocked: false } } })
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Share')
    expect(menuText).not.toHaveAttribute('disabled')
  })

  it('renders Share tooltip', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Share'))
    screen.getByText('You have not been granted permission to share this workspace')
    expect(screen.queryByText('Sharing is not currently supported on Azure Workspaces')).toBeNull()
  })
})

describe('WorkspaceMenu - Azure workspace', () => {
  beforeEach(() => {
    useWorkspaceDetails.mockReturnValue({
      workspace:
        {
          azureContext: { managedResourceGroupId: 'mrg', subscriptionId: 'subscription', tenantId: 'tenant' },
          workspace: { isLocked: false }
        }
    })
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

  it('renders Clone menu item as disabled', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Clone')
    expect(menuText).toHaveAttribute('disabled')
  })

  it('renders Clone tooltip', () => {
    const onClone = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onClone },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Clone'))
    screen.getByText('Cloning is not currently supported on Azure Workspaces')
  })

  it('renders Share menu item as disabled', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    const menuText = screen.getByText('Share')
    expect(menuText).toHaveAttribute('disabled')
  })

  it('renders Share tooltip', () => {
    const onShare = jest.fn()
    render(h(WorkspaceMenu, {
      iconSize: 20, popupLocation: 'left',
      callbacks: { onShare },
      workspaceInfo: { name: 'example1', namespace: 'example-billing-project' }
    }))
    fireEvent.mouseOver(screen.getByText('Share'))
    screen.getByText('Sharing is not currently supported on Azure Workspaces')
  })
})

