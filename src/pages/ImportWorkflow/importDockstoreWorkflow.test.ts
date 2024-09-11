import { DeepPartial } from '@terra-ui-packages/core-utils';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn } from 'src/testing/test-utils';

import { importDockstoreWorkflow } from './importDockstoreWorkflow';

jest.mock('src/libs/ajax');

describe('importDockstoreWorkflow', () => {
  const testWorkspace = {
    namespace: 'test',
    name: 'import-workflow',
  };

  const testWorkflow = {
    path: 'github.com/DataBiosphere/test-workflows/test-workflow',
    version: 'v1.0.0',
    source: 'dockstore',
  };

  let workspaceAjax;
  let workspaceMethodConfigAjax;
  let methodConfigInputsOutputs;
  let importMethodConfig;
  let deleteMethodConfig;

  beforeEach(() => {
    // Arrange
    importMethodConfig = jest.fn().mockResolvedValue(undefined);
    deleteMethodConfig = jest.fn().mockResolvedValue(undefined);

    const mockWorkspaceMethodConfigAjax: Partial<ReturnType<WorkspacesAjaxContract['workspace']>['methodConfig']> = {
      delete: deleteMethodConfig,
    };

    workspaceMethodConfigAjax = jest.fn().mockReturnValue(mockWorkspaceMethodConfigAjax);

    const mockWorkspaceAjax: DeepPartial<ReturnType<WorkspacesAjaxContract['workspace']>> = {
      entityMetadata: () =>
        Promise.resolve({
          participant: { count: 1, idName: 'participant_id', attributeNames: [] },
          sample: { count: 1, idName: 'sample_id', attributeNames: [] },
        }),
      importMethodConfig,
      methodConfig: workspaceMethodConfigAjax,
    };

    workspaceAjax = jest.fn().mockReturnValue(mockWorkspaceAjax);

    methodConfigInputsOutputs = jest.fn().mockResolvedValue({
      inputs: [],
      outputs: [
        { name: 'taskA.output1', outputType: 'String' },
        { name: 'taskA.output2', outputType: 'String' },
      ],
    });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: { workspace: workspaceAjax },
      Methods: { configInputsOutputs: methodConfigInputsOutputs },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
  });

  it('imports workflow into workspace', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' });

    // Assert
    expect(importMethodConfig).toHaveBeenCalledWith(
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
    );
  });

  it('sets a default root entity type', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' });

    // Assert
    expect(importMethodConfig).toHaveBeenCalledWith(expect.objectContaining({ rootEntityType: 'participant' }));
  });

  it('configures default outputs', async () => {
    // Act
    await importDockstoreWorkflow({ workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' });

    // Assert
    expect(importMethodConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        outputs: {
          'taskA.output1': 'this.output1',
          'taskA.output2': 'this.output2',
        },
      })
    );
  });

  describe('when overwriting an existing workflow', () => {
    it('attempts to delete existing workflow', async () => {
      // Act
      await importDockstoreWorkflow(
        { workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' },
        { overwrite: true }
      );

      // Assert
      expect(workspaceMethodConfigAjax).toHaveBeenCalledWith('test', 'test-workflow');
      expect(deleteMethodConfig).toHaveBeenCalled();
    });

    it('does not error if workflow does not exist', async () => {
      // Arrange
      deleteMethodConfig.mockRejectedValue(new Response('{}', { status: 404 }));

      // Act
      const result = importDockstoreWorkflow(
        { workspace: testWorkspace, workflow: testWorkflow, workflowName: 'test-workflow' },
        { overwrite: true }
      );

      // Assert
      await expect(result).resolves.toEqual(undefined);
    });
  });
});
