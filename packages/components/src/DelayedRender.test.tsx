import { act, render, screen } from '@testing-library/react';

import { DelayedRender } from './DelayedRender';

describe('DelayedRender', () => {
  it('renders children after a delay', () => {
    // Arrange
    jest.useFakeTimers();

    // Act
    render(<DelayedRender delay={3000}>Hello world</DelayedRender>);

    const isRenderedInitially = screen.queryByText('Hello world') !== null;

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    const isRenderedAfterDelay = screen.queryByText('Hello world') !== null;

    // Assert
    expect(isRenderedInitially).toBe(false);
    expect(isRenderedAfterDelay).toBe(true);
  });
});
