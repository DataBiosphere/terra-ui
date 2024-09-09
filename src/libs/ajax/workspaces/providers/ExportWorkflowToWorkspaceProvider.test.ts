import { Ajax } from 'src/libs/ajax';
import { makeExportWorkflowFromWorkspaceProvider } from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import { MethodConfiguration } from 'src/libs/ajax/workspaces/workspace-models';
import { asMockedFn } from 'src/testing/test-utils';
import { WorkspaceInfo } from 'src/workspaces/utils';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type WorkspacesAjaxContract = AjaxContract['Workspaces'];
type WorkspaceAjaxContract = WorkspacesAjaxContract['workspace'];
type MethodConfigAjaxContract = ReturnType<WorkspaceAjaxContract>['methodConfig'];

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

const mockMethodConfiguration: MethodConfiguration = {
  namespace: 'namespace',
  name: 'name',
  methodRepoMethod: { methodVersion: 1 },
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
