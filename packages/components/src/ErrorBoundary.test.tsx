import { render, screen } from '@testing-library/react';

import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children', () => {
    // Act
    render(<ErrorBoundary>Hello world</ErrorBoundary>);

    // Assert
    screen.getByText('Hello world');
  });

  it('catches render error and renders nothing', () => {
    // Arrange
    const TestComponent = () => {
      throw new Error('Something went wrong!');
    };

    // Prevent React from logging the error.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { container } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onError callback with error', () => {
    // Arrange
    const TestComponent = () => {
      throw new Error('Something went wrong!');
    };

    const onError = jest.fn();

    // Prevent React from logging the error.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    render(
      <ErrorBoundary onError={onError}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Assert
    expect(onError).toHaveBeenCalledWith(new Error('Something went wrong!'));
  });
});
