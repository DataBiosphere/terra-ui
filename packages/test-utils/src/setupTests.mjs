/* eslint-env jest */
import '@testing-library/jest-dom';
import 'blob-polyfill';
import 'whatwg-fetch';

import { toHaveNoViolations } from 'jest-axe';
import failOnConsole from 'jest-fail-on-console';

// Fail tests that produce console logs.
// Console warnings or errors suggest there are issues with the test.
// Other console logs are noise that make it harder to find informative output when tests do fail.
if (!process.env.ALLOW_LOGS) {
  failOnConsole({
    shouldFailOnAssert: true,
    shouldFailOnDebug: true,
    shouldFailOnInfo: true,
    shouldFailOnLog: true,
    shouldFailOnWarn: true,
    shouldFailOnError: true,
  });
}

expect.extend(toHaveNoViolations);
