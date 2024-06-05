import React from 'react';

import { renderWithTheme } from '../internal/test-utils';
import { SpinnerOverlay, SpinnerOverlayMode } from './SpinnerOverlay';

describe('SpinnerOverlay', () => {
  it('renders a spinner icon', () => {
    // Act
    renderWithTheme(<SpinnerOverlay />);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });
  it.each(['Absolute', 'Fixed', 'Top', 'Transparent', 'FullScreen', 'Default'] satisfies SpinnerOverlayMode[])(
    'renders mode',
    (mode: SpinnerOverlayMode) => {
      // Act
      renderWithTheme(<SpinnerOverlay mode={mode} />);

      // Assert
      const icon = document.querySelector('[data-icon="loadingSpinner"]');
      expect(icon).toBeInTheDocument();
    }
  );

  it('renders a spinner icon - no args', () => {
    // Act
    // call as raw function to ensure no args in call (React jsx version seems to not ensure this)
    renderWithTheme(<div>{SpinnerOverlay()}</div>);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });
});
