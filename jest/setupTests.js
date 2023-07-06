import '@testing-library/jest-dom';
import 'blob-polyfill';
import 'whatwg-fetch';

import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
