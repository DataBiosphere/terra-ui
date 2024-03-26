import { ErrorBoundary } from '@terra-ui-packages/components';
import { render } from '@testing-library/react';
import React from 'react';

import { NotificationsContract, NotificationsProvider, text, useNotificationsFromContext } from './useNotifications';

describe('useNotificationsFromContext', () => {
  it('gets notifications provider from context', () => {
    // Arrange
    const onRenderWithReporter = jest.fn();

    const TestComponent = () => {
      const reporter = useNotificationsFromContext();
      onRenderWithReporter(reporter);
      return null;
    };

    const reporter: NotificationsContract = {
      notify: jest.fn(),
    };

    // Act
    render(
      <NotificationsProvider notifications={reporter}>
        <TestComponent />
      </NotificationsProvider>
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
