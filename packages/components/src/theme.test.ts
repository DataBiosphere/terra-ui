import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';

import { ErrorBoundary } from './ErrorBoundary';
import { Theme, ThemeProvider, useThemeFromContext } from './theme';

describe('useThemeFromContext', () => {
  it('gets theme from context', () => {
    // Arrange
    const onRenderWithTheme = jest.fn();

    const TestComponent = () => {
      const theme = useThemeFromContext();
      onRenderWithTheme(theme);
      return null;
    };

    const theme: Theme = {
      colorPalette: {
        primary: '#74ae43',
        secondary: '#6d6e70',
        accent: '#4d72aa',
        success: '#74ae43',
        warning: '#f7981c',
        danger: '#db3214',
        light: '#e9ecef',
        dark: '#333f52',
        grey: '#808080',
        disabled: '#b6b7b8',
      },
    };

    // Act
    render(h(ThemeProvider, { theme }, [h(TestComponent)]));

    // Assert
    expect(onRenderWithTheme).toHaveBeenCalledWith(expect.objectContaining(theme));
  });

  it('throw an error if no theme is provided', () => {
    // Arrange
    const onRenderError = jest.fn();

    const TestComponent = () => {
      useThemeFromContext();
      return null;
    };

    // Prevent React from logging the error.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    render(h(ErrorBoundary, { onError: onRenderError }, [h(TestComponent)]));

    // Assert
    expect(onRenderError).toHaveBeenCalledWith(
      new Error('No theme provided. Components using useThemeFromContext must be descendants of ThemeProvider.')
    );
  });
});
