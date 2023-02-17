import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'

import { ImportWorkflow } from './ImportWorkflow'
import { useDockstoreWdl } from './useDockstoreWdl'


// Avoid WorkspaceImporter attempting to load workspaces.
// Preferably, we could mock useWorkspaces here, but that doesn't work because it's in the same module as WorkspaceImpoter.
jest.mock('src/components/workspace-utils', () => ({
  ...jest.requireActual('src/components/workspace-utils'),
  WorkspaceImporter: () => null,
}))

jest.mock('./useDockstoreWdl', () => ({
  useDockstoreWdl: jest.fn().mockReturnValue({
    status: 'Ready',
    wdl: 'workflow TestWorkflow {}',
  })
}))

describe('ImportWorkflow', () => {
  it('fetches and renders WDL', () => {
    // Act
    render(h(ImportWorkflow, {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      source: 'dockstore',
    }))

    // Assert
    expect(useDockstoreWdl).toHaveBeenCalledWith({
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    })

    const wdlContainer = document.querySelector('code')!
    expect(wdlContainer).toHaveTextContent('workflow TestWorkflow {}')
  })

  describe('workflow name', () => {
    it('defaults workflow name based on path', () => {
      // Act
      render(h(ImportWorkflow, {
        path: 'github.com/DataBiosphere/test-workflows/test-workflow',
        version: 'v1.0.0',
        source: 'dockstore',
      }))

      // Assert
      const nameInput = screen.getByLabelText('Workflow Name')
      expect(nameInput).toHaveValue('test-workflow')
    })

    it('validates name', async () => {
      // Arrange
      const user = userEvent.setup()

      render(h(ImportWorkflow, {
        path: 'github.com/DataBiosphere/test-workflows/test-workflow',
        version: 'v1.0.0',
        source: 'dockstore',
      }))

      const nameInput = screen.getByLabelText('Workflow Name')

      // Act
      await user.clear(nameInput)
      await user.type(nameInput, 'a new workflow name')

      // Assert
      screen.getByText('Workflow name can only contain letters, numbers, underscores, dashes, and periods')
    })
  })
})
