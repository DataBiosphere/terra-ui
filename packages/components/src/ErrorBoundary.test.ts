import { render, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';

import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children', () => {
    // Act
    render(h(ErrorBoundary, [div(['Hello world'])]));

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
    const { container } = render(h(ErrorBoundary, [h(TestComponent)]));

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
    render(h(ErrorBoundary, { onError }, [h(TestComponent)]));

    // Assert
    expect(onError).toHaveBeenCalledWith(new Error('Something went wrong!'));
  });
});
