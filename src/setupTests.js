import '@testing-library/jest-dom';
import 'blob-polyfill';
import 'whatwg-fetch';

import { toHaveNoViolations } from 'jest-axe';

jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));

expect.extend(toHaveNoViolations);
