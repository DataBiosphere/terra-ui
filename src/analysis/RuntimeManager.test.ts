import { h } from 'react-hyperscript-helpers';
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

afterEach(() => {
  jest.clearAllMocks();
});

describe('RuntimeManager', () => {
  it('will render nothing if there is nothing appropriate to show', () => {
    // Arrange
    const runtimeManagerProps = {
      namespace: 'test-namespace',
      name: 'test-name',
      runtimes: [],
      apps: [],
    };

    // Act
    const { container } = render(h(RuntimeManager, runtimeManagerProps));

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
