import '@testing-library/jest-dom';
import 'blob-polyfill';

import { toHaveNoViolations } from 'jest-axe';

jest.mock('src/components/common/VirtualizedSelectAutoSizer', () => {
  return {
    AutoSizer: ({ children }) => children({ width: 300 }),
  };
});

jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));

expect.extend(toHaveNoViolations);
