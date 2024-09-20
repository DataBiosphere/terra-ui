import { Ajax, AjaxContract } from 'src/libs/ajax';
import { MethodsAjaxContract } from 'src/libs/ajax/methods/Methods';
import {
  makeExportWorkflowFromMethodsRepoProvider,
  makeExportWorkflowFromWorkspaceProvider,
} from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import { MethodConfiguration, MethodRepoMethod } from 'src/libs/ajax/workspaces/workspace-models';
import { WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn } from 'src/testing/test-utils';
import { WorkspaceInfo } from 'src/workspaces/utils';

jest.mock('src/libs/ajax');

type WorkspaceAjaxContract = WorkspacesAjaxContract['workspace'];
type MethodConfigAjaxContract = ReturnType<WorkspaceAjaxContract>['methodConfig'];
type TemplateAjaxContract = MethodsAjaxContract['template'];

const sourceWorkspace: WorkspaceInfo = {
  workspaceId: 'Workspace1',
  name: 'name1',
  namespace: 'namespace1',
  cloudPlatform: 'Azure',
  authorizationDomain: [],
  createdDate: '2023-02-15T19:17:15.711Z',
  createdBy: 'groot@gmail.com',
  lastModified: '2023-03-15T19:17:15.711Z',
};

const destWorkspace: WorkspaceInfo = {
  workspaceId: 'Workspace2',
  name: 'name2',
  namespace: 'namespace2',
  cloudPlatform: 'Azure',
  authorizationDomain: [],
  createdDate: '2023-02-15T19:17:15.711Z',
  createdBy: 'groot@gmail.com',
  lastModified: '2023-03-15T19:17:15.711Z',
};

const mockMethodRepoMethod: MethodRepoMethod = { methodVersion: 1 };

const mockMethodConfiguration: MethodConfiguration = {
  namespace: 'namespace',
  name: 'name',
  methodRepoMethod: mockMethodRepoMethod,
};

describe('export workflow from workspace provider', () => {
  it('handles export call', async () => {
    // Arrange
    const mockWorkspace: Partial<WorkspaceAjaxContract> = jest.fn(() => {
      return {
        methodConfig: mockMethodConfig,
      };
    });

    const mockMethodConfig: Partial<MethodConfigAjaxContract> = jest.fn(() => {
      return { copyTo: mockCopyTo };
    });

    const mockCopyTo = jest.fn();

    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: mockWorkspace as WorkspaceAjaxContract,
      } as WorkspacesAjaxContract,
    } as AjaxContract);
    const signal = new window.AbortController().signal;

    // Act
    await makeExportWorkflowFromWorkspaceProvider(sourceWorkspace, mockMethodConfiguration).export(
      destWorkspace,
      'newname',
      {
        signal,
      }
    );

    // Assert
    expect(Ajax).toHaveBeenCalledTimes(1);
    expect(Ajax).toHaveBeenCalledWith(signal);
    expect(mockWorkspace).toHaveBeenCalledTimes(1);
    expect(mockWorkspace).toHaveBeenCalledWith(sourceWorkspace.namespace, sourceWorkspace.name);
    expect(mockMethodConfig).toHaveBeenCalledTimes(1);
    expect(mockMethodConfig).toHaveBeenCalledWith(mockMethodConfiguration.namespace, mockMethodConfiguration.name);
    expect(mockCopyTo).toHaveBeenCalledTimes(1);
    expect(mockCopyTo).toHaveBeenCalledWith({
      destConfigNamespace: destWorkspace.namespace,
      destConfigName: 'newname',
      workspaceName: {
        namespace: destWorkspace.namespace,
        name: destWorkspace.name,
      },
    });
  });
});

describe('export workflow from methods repo provider', () => {
  it('handles export call', async () => {
    // Arrange
    const mockTemplate: Partial<TemplateAjaxContract> = jest.fn(() =>
      Promise.resolve({
        rootEntityType: 'shouldberemoved',
        inputs: {
          shouldBeKept: '',
        },
      })
    );

    const mockWorkspace: Partial<WorkspaceAjaxContract> = jest.fn(() => {
      return {
        importMethodConfig: mockImportMethodConfig,
      };
    });

    const mockImportMethodConfig = jest.fn();

    asMockedFn(Ajax).mockReturnValue({
      Methods: {
        template: mockTemplate as TemplateAjaxContract,
      } as MethodsAjaxContract,
      Workspaces: {
        workspace: mockWorkspace as WorkspaceAjaxContract,
      } as WorkspacesAjaxContract,
    } as AjaxContract);
    const signal = new window.AbortController().signal;

    // Act
    await makeExportWorkflowFromMethodsRepoProvider(mockMethodRepoMethod).export(destWorkspace, 'newname', {
      signal,
    });

    // Assert
    expect(Ajax).toHaveBeenCalledTimes(2);

    expect(Ajax).toHaveBeenNthCalledWith(1, signal);
    expect(mockTemplate).toHaveBeenCalledTimes(1);
    expect(mockTemplate).toHaveBeenCalledWith(mockMethodRepoMethod);

    expect(Ajax).toHaveBeenNthCalledWith(2, signal);
    expect(mockWorkspace).toHaveBeenCalledTimes(1);
    expect(mockWorkspace).toHaveBeenCalledWith(destWorkspace.namespace, destWorkspace.name);
    expect(mockImportMethodConfig).toHaveBeenCalledTimes(1);
    expect(mockImportMethodConfig).toHaveBeenCalledWith({
      inputs: {
        shouldBeKept: '',
      },
      name: 'newname',
      namespace: mockMethodRepoMethod.methodNamespace,
    });
  });
});
