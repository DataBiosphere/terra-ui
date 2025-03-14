// VirtualizedSelect uses react-virtualized's AutoSizer to size the options menu.
// Left to its own devices, in the unit test environment, AutoSizer makes the menu
// list 0px wide and no options are rendered. Mocking AutoSizer makes the virtualized
// window large enough for options to be rendered.
type ReactVirtualizedExports = typeof import('react-virtualized');
type VirtualizedSelectAutoSizerExports = typeof import('src/components/common/VirtualizedSelectAutoSizer');
jest.mock('src/components/common/VirtualizedSelectAutoSizer', (): VirtualizedSelectAutoSizerExports => {
  const actual = jest.requireActual<VirtualizedSelectAutoSizerExports>(
    'src/components/common/VirtualizedSelectAutoSizer'
  );

  const { AutoSizer } = jest.requireActual<ReactVirtualizedExports>('react-virtualized');
  class MockAutoSizer extends AutoSizer {
    state = {
      height: 0,
      width: 300,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

type ConfigStoreExports = typeof import('src/libs/startup/configStore');
jest.mock('src/libs/startup/configStore', (): ConfigStoreExports => {
  return {
    loadedConfigStore: jest.fn(() => ({ brand: 'terra' } as ReturnType<ConfigStoreExports['loadedConfigStore']>)),
    setLoadedConfigStore: jest.fn(),
    resetConfigStore: jest.fn(),
  };
});

export {};
