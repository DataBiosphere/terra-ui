import '@testing-library/jest-dom';
import 'blob-polyfill';

import { toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';

vi.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));

expect.extend(toHaveNoViolations);
