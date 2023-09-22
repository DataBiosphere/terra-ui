import { Ajax, useReplaceableAjaxExperimental } from 'src/libs/ajax';
import { asMockedFn } from 'src/testing/test-utils';

import { workspaceProvider } from './WorkspaceProvider';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type WorkspacesAjaxContract = Pick<AjaxContract, 'Workspaces'>['Workspaces'];
type WorkspacesAjaxNeeds = Pick<WorkspacesAjaxContract, 'list'>;

interface AjaxMockNeeds {
  workspaces: WorkspacesAjaxNeeds;
}

/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-saftely as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialWorkspaces: WorkspacesAjaxNeeds = {
    list: jest.fn(),
  };
  const mockWorkspaces = partialWorkspaces as WorkspacesAjaxContract;

  asMockedFn(Ajax).mockReturnValue({ Workspaces: mockWorkspaces } as AjaxContract);

  // also need to mock this to simplify testing
  asMockedFn(useReplaceableAjaxExperimental).mockReturnValue(Ajax);

  return {
    workspaces: partialWorkspaces,
  };
};
describe('workspacesProvider', () => {
  it('handles list call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.workspaces.list).mockResolvedValue([]);
    const signal = new window.AbortController().signal;

    // Act
    const result = await workspaceProvider.list(['field1', 'field2'], { stringAttributeMaxLength: 50, signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(signal);
    expect(ajaxMock.workspaces.list).toBeCalledTimes(1);
    expect(ajaxMock.workspaces.list).toBeCalledWith(['field1', 'field2'], 50);
    expect(result).toEqual([]);
  });
});
