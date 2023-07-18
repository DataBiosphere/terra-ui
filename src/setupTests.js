import '@testing-library/jest-dom';
import 'blob-polyfill';

import { toHaveNoViolations } from 'jest-axe';

// VirtualizedSelect uses react-virtualized's AutoSizer to size the options menu.
// Left to its own devices, in the unit test environment, AutoSizer makes the menu
// list 0px wide and no options are rendered. Mocking AutoSizer makes the virtualized
// window large enough for options to be rendered.
jest.mock('src/components/common/VirtualizedSelectAutoSizer', () => {
  return {
    AutoSizer: ({ children }) => children({ width: 300 }),
  };
});

jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));

expect.extend(toHaveNoViolations);
