import { withFakeTimers } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import React from 'react';

import { renderWithTheme } from '../internal/test-utils';
import { visuallyHidden } from '../styles';
import { CenteredSpinner } from './CenteredSpinner';

describe('CenteredSpinner', () => {
  it('renders a spinner icon', () => {
    // Act
    renderWithTheme(<CenteredSpinner />);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });

  it(
    'renders a visually hidden alert after a delay',
    withFakeTimers(() => {
      // Act
      renderWithTheme(<CenteredSpinner message='Loading the data' />);

      const isMessageRenderedImmediately = !!screen.queryByText('Loading the data');
      act(() => jest.advanceTimersByTime(150));

      // Assert
      expect(isMessageRenderedImmediately).toBe(false);

      const message = screen.getByText('Loading the data');
      expect(message).toHaveAttribute('role', 'alert');
      expect(message).toHaveStyle(visuallyHidden as Record<string, unknown>);
    })
  );

  it('renders a spinner icon - no args', () => {
    // Act
    // call as raw function to ensure no args in call (React jsx version seems to not ensure this)
    renderWithTheme(<div>{CenteredSpinner()}</div>);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });
});
