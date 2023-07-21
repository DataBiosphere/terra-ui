import '@testing-library/jest-dom';
import 'blob-polyfill';

import { toHaveNoViolations } from 'jest-axe';
import failOnConsole from 'jest-fail-on-console';

// Fail tests that produce console logs.
// Console warnings or errors suggest there are issues with the test.
// Other console logs are noise that make it harder to find informative output when tests do fail.
failOnConsole({
  shouldFailOnAssert: true,
  shouldFailOnDebug: true,
  shouldFailOnInfo: true,
  shouldFailOnLog: true,
  shouldFailOnWarn: true,
  shouldFailOnError: true,
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

expect.extend(toHaveNoViolations);
