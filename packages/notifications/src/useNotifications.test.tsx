import { ErrorBoundary } from '@terra-ui-packages/components';
import { render } from '@testing-library/react';
import React from 'react';

import {
  NotificationsContextProvider,
  NotificationsProvider,
  text,
  useNotificationsFromContext,
} from './useNotifications';

describe('useNotificationsFromContext', () => {
  it('gets notifications provider from context', () => {
    // Arrange
    const onRenderWithReporter = jest.fn();

    const TestComponent = () => {
      const reporter = useNotificationsFromContext();
      onRenderWithReporter(reporter);
      return null;
    };

    const reporter: NotificationsProvider = {
      notify: jest.fn(),
      reportError: jest.fn(),
      withErrorReporting: jest.fn(),
    };

    // Act
    render(
      <NotificationsContextProvider notifications={reporter}>
        <TestComponent />
      </NotificationsContextProvider>
    );

    // Assert
    expect(onRenderWithReporter).toHaveBeenCalledWith(expect.objectContaining(reporter));
  });

  it('throw an error if no notifications provider is provided', () => {
    // Arrange
    const onRenderError = jest.fn();

    const TestComponent = () => {
      useNotificationsFromContext();
      return null;
    };

    // Prevent React from logging the error.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    render(
      <ErrorBoundary onError={onRenderError}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Assert
    expect(onRenderError).toHaveBeenCalledWith(new Error(text.error.noProvider));
  });
});
