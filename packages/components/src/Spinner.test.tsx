import { withFakeTimers } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';

import { renderWithTheme } from './internal/test-utils';
import { Spinner } from './Spinner';
import { visuallyHidden } from './styles';

describe('Spinner', () => {
  it('renders a spinner icon', () => {
    // Act
    renderWithTheme(<Spinner />);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });

  it(
    'renders a visually hidden alert after a delay',
    withFakeTimers(() => {
      // Act
      renderWithTheme(<Spinner message='Loading the data' />);

      const isMessageRenderedImmediately = !!screen.queryByText('Loading the data');
      act(() => jest.advanceTimersByTime(150));

      // Assert
      expect(isMessageRenderedImmediately).toBe(false);

      const message = screen.getByText('Loading the data');
      expect(message).toHaveAttribute('role', 'alert');
      expect(message).toHaveStyle(visuallyHidden as Record<string, unknown>);
    })
  );
});
