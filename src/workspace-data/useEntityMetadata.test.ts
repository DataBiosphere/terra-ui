type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');

type AjaxExports = typeof import('src/libs/ajax');
jest.mock(
  'src/libs/ajax',
  (): AjaxExports => ({
    ...jest.requireActual<AjaxExports>('src/libs/ajax'),
    Ajax: jest.fn(),
  })
);

jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchWDS: jest.fn(),
  };
});

// type AjaxContract = ReturnType<typeof Ajax>;

// describe('useEntityMetadata', () => {
//   it('should call checkCWDS only when useCWDS is undefined', async () => {
//     // Arrange
//     const workspaceDetails = jest.fn().mockResolvedValue({ workspace: { attributes: {} } });
//     const workspace = jest.fn(() => ({ details: workspaceDetails }));
//     const workspaceId = 'workspaceId';

//     asMockedFn(fetchWDS).mockImplementation((wdsProxyUrlRoot: string) => {
//       return Promise.resolve({});
//     });

//     // Act
//     await renderHookInActWithAppContexts(() => useEntityMetadata(workspaceId));

//     // Assert
//     expect(workspace).toHaveBeenCalledWith('namespace', 'name');
//     expect(workspaceDetails).toHaveBeenCalledWith(['workspace.attributes']);
//   });
//   // TODO should wdsApp be included here
//   it('should call loadWdsData when one of wdsTypes, wdsCapabilities, wdsDataTableProvider is not ready', async () => {
//     // Arrange
//     const workspaceAttributes = {
//       description: 'workspace description',
//       'sys:attr': 'namespaced attribute',
//       referenceData_attr: 'gs://bucket/path',
//       attr1: 'value1',
//       attr2: 'value2',
//       __DESCRIPTION__attr1: 'description1',
//     };

//     asMockedFn(Ajax).mockImplementation(
//       () =>
//         ({
//           Workspaces: {
//             workspace: () => ({
//               details: () => Promise.resolve({ workspace: { attributes: workspaceAttributes } }),
//             }),
//           },
//         } as DeepPartial<AjaxContract> as AjaxContract)
//     );

//     // Act
//     const { result: hookReturnRef } = await renderHookInActWithAppContexts(() =>
//       useWorkspaceDataAttributes('namespace', 'name')
//     );

//     // Assert
//     expect(hookReturnRef.current[0].state).toEqual([
//       ['attr1', 'value1', 'description1'],
//       ['attr2', 'value2', undefined],
//     ]);
//   });
// });
