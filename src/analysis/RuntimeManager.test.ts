import { h } from 'react-hyperscript-helpers';
import { getGoogleDataProcRuntime } from 'src/analysis/_testData/testData';
import { runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { errorNotifiedRuntimes } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import RuntimeManager from './RuntimeManager';

// Mocking for terminalLaunchLink using Nav.getLink
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getPath: jest.fn(() => '/test/'),
    getLink: jest.fn(() => '/'),
  })
);

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
  errorNotifiedRuntimes.reset();
});

describe('RuntimeManager', () => {
  it('will update errorNotifiedRuntimes when there is currently a runtime in error state but no previous runtimes', () => {
    // Arrange
    const runtime: Runtime = { ...getGoogleDataProcRuntime(), status: runtimeStatuses.error.leoLabel };
    const runtimeManagerProps = {
      namespace: 'test-namespace',
      name: 'test-name',
      runtimes: [runtime],
      apps: [],
    };

    // Act
    const { container } = render(h(RuntimeManager, runtimeManagerProps));

    // Assert
    expect(container).toBeEmptyDOMElement();
    expect(errorNotifiedRuntimes.get()).toEqual([runtime.id]);
  });
});
