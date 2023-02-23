import { Ajax } from 'src/libs/ajax'
import { DeepPartial } from 'src/libs/type-utils/deep-partial'
import { asMockedFn } from 'src/testing/test-utils'

import { importDockstoreWorkflow } from './importDockstoreWorkflow'


jest.mock('src/libs/ajax')

type AjaxExports = typeof import('src/libs/ajax')
type AjaxContract = ReturnType<AjaxExports['Ajax']>

describe('importDockstoreWorkflow', () => {
  const testWorkspace = {
    namespace: 'test',
    name: 'import-workflow',
  }

  const testWorkflow = {
    path: 'github.com/DataBiosphere/test-workflows/test-workflow',
    version: 'v1.0.0',
    source: 'dockstore',
  }

  let workspaceAjax
  let methodConfigInputsOutputs
  let importMethodConfigFromDocker

  beforeEach(() => {
    // Arrange
    importMethodConfigFromDocker = jest.fn().mockResolvedValue(undefined)

    const mockWorkspaceAjax: DeepPartial<ReturnType<AjaxContract['Workspaces']['workspace']>> = {
      entityMetadata: () => Promise.resolve({
        participant: { count: 1, idName: 'participant_id', attributeNames: [] },
        sample: { count: 1, idName: 'sample_id', attributeNames: [] },
      }),
      importMethodConfigFromDocker,
    }

    workspaceAjax = jest.fn().mockReturnValue(mockWorkspaceAjax)

    methodConfigInputsOutputs = jest.fn().mockResolvedValue({
      inputs: [],
      outputs: [
        { name: 'taskA.output1', outputType: 'String' },
        { name: 'taskA.output2', outputType: 'String' },
      ],
    })

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: { workspace: workspaceAjax },
      Methods: { configInputsOutputs: methodConfigInputsOutputs },
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)
  })

  it('imports workflow into workspace', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' })

    // Assert
    expect(importMethodConfigFromDocker).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: testWorkspace.namespace,
        name: 'test-workflow',
        methodConfigVersion: 1,
        deleted: false,
        methodRepoMethod: {
          sourceRepo: testWorkflow.source,
          methodPath: testWorkflow.path,
          methodVersion: testWorkflow.version,
        },
      })
    )
  })

  it('sets a default root entity type', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' })

    // Assert
    expect(importMethodConfigFromDocker).toHaveBeenCalledWith(
      expect.objectContaining({ rootEntityType: 'participant' })
    )
  })

  it('configures default outputs', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' })

    // Assert
    expect(importMethodConfigFromDocker).toHaveBeenCalledWith(
      expect.objectContaining({
        outputs: {
          'taskA.output1': 'this.output1',
          'taskA.output2': 'this.output2',
        },
      })
    )
  })
})
