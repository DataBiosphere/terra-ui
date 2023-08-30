import type { Theme } from '@terra-ui-packages/components';

// Basic Terra UI components access the current theme via React Context.
// To avoid having to wrap nearly every component rendered in a test in a ThemeProvider,
// this mocks useThemeFromContext to provide a default theme for tests.
type TerraUIComponentsExports = typeof import('@terra-ui-packages/components');
jest.mock('@terra-ui-packages/components', (): TerraUIComponentsExports => {
  const theme: Theme = {
    colorPalette: {
      primary: '#74ae43',
      secondary: '#6d6e70',
      accent: '#4d72aa',
      success: '#74ae43',
      warning: '#f7981c',
      danger: '#db3214',
      light: '#e9ecef',
      dark: '#333f52',
      grey: '#808080',
      disabled: '#b6b7b8',
    },
  };

  const actual = jest.requireActual<TerraUIComponentsExports>('@terra-ui-packages/components');
  const enrichedTheme = actual.enrichTheme(theme);
  return {
    ...actual,
    useThemeFromContext: () => enrichedTheme,
  };
});

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

jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));

export {};
