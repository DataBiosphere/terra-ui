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
});
