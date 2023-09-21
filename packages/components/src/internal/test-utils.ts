// This file is only used by tests thus is allowed to import from dev dependencies.
// eslint-disable-next-line import/no-extraneous-dependencies
import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { h } from 'react-hyperscript-helpers';

import { Theme, ThemeProvider } from '../theme';

const terraTheme: Theme = {
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

export const TestThemeProvider = (props) => {
  return h(ThemeProvider, {
    ...props,
    theme: terraTheme,
  });
};

export const renderWithTheme = (ui: ReactElement) => {
  return render(ui, { wrapper: TestThemeProvider });
};

/**
 * Wrap a test function in useFakeTimers/useRealTimers.
 */
export const withFakeTimers =
  <F extends (...args: any[]) => any>(fn: F) =>
  (...args: Parameters<F>): ReturnType<F> => {
    try {
      jest.useFakeTimers();
      return fn(...args);
    } finally {
      // "It's important to also call runOnlyPendingTimers before switching to real timers.
      // This will ensure you flush all the pending timers before you switch to real timers."
      // -- https://testing-library.com/docs/using-fake-timers/
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  };
