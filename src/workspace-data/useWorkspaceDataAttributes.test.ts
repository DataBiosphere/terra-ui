import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { Ajax } from 'src/libs/ajax';
import { renderHookInActWithAppContexts } from 'src/testing/test-utils';

import { useWorkspaceDataAttributes } from './useWorkspaceDataAttributes';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock(
  'src/libs/ajax',
  (): AjaxExports => ({
    ...jest.requireActual<AjaxExports>('src/libs/ajax'),
    Ajax: jest.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;

describe('useWorkspaceDataAttributes', () => {
  it('should call Ajax.Workspaces.workspace with the correct arguments', async () => {
    // Arrange
    const workspaceDetails = jest.fn().mockResolvedValue({ workspace: { attributes: {} } });
    const workspace = jest.fn(() => ({ details: workspaceDetails }));

    asMockedFn(Ajax).mockImplementation(
      () => ({ Workspaces: { workspace } } as DeepPartial<AjaxContract> as AjaxContract)
    );

    // Act
    await renderHookInActWithAppContexts(() => useWorkspaceDataAttributes('namespace', 'name'));

    // Assert
    expect(workspace).toHaveBeenCalledWith('namespace', 'name');
    expect(workspaceDetails).toHaveBeenCalledWith(['workspace.attributes']);
  });

  it('extracts workspace data attributes from all workspace attributes', async () => {
    // Arrange
    const workspaceAttributes = {
      description: 'workspace description',
      'sys:attr': 'namespaced attribute',
      referenceData_attr: 'gs://bucket/path',
      attr1: 'value1',
      attr2: 'value2',
      __DESCRIPTION__attr1: 'description1',
    };

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Workspaces: {
            workspace: () => ({
              details: () => Promise.resolve({ workspace: { attributes: workspaceAttributes } }),
            }),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );

    // Act
    const { result: hookReturnRef } = await renderHookInActWithAppContexts(() =>
      useWorkspaceDataAttributes('namespace', 'name')
    );

    // Assert
    expect(hookReturnRef.current[0].state).toEqual([
      ['attr1', 'value1', 'description1'],
      ['attr2', 'value2', undefined],
    ]);
  });
});
