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

  const spinnerModesTestArg: [SpinnerOverlayMode][] = [
    ['Absolute'],
    ['Fixed'],
    ['Top'],
    ['Transparent'],
    ['FullScreen'],
    ['Default'],
  ];
  it.each(spinnerModesTestArg)('renders mode %s', (mode: SpinnerOverlayMode) => {
    // Act
    renderWithTheme(<SpinnerOverlay mode={mode} />);

    // Assert
    const icon = document.querySelector('[data-icon="loadingSpinner"]');
    expect(icon).toBeInTheDocument();
  });
});
