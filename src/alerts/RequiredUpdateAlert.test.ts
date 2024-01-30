import { h } from 'react-hyperscript-helpers';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

import { RequiredUpdateAlert } from './RequiredUpdateAlert';
import { useTimeUntilRequiredUpdate } from './version-alerts';

type VersionAlertsExports = typeof import('./version-alerts');
jest.mock('./version-alerts', (): VersionAlertsExports => {
  return {
    ...jest.requireActual<VersionAlertsExports>('./version-alerts'),
    useTimeUntilRequiredUpdate: jest.fn(),
  };
});

describe('RequiredUpdateAlert', () => {
  it('renders nothing if no update is required', () => {
    // Arrange
    asMockedFn(useTimeUntilRequiredUpdate).mockReturnValue(undefined);

    // Act
    const { container } = renderWithAppContexts(h(RequiredUpdateAlert));

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it('renders time until required update', () => {
    // Arrange
    asMockedFn(useTimeUntilRequiredUpdate).mockReturnValue(90);

    // Act
    const { container } = renderWithAppContexts(h(RequiredUpdateAlert));

    // Assert
    expect(container).toHaveTextContent(
      'A required update is available. Terra will automatically refresh your browser in 1 minute 30 seconds.'
    );
  });
});
