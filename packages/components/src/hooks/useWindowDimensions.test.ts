import { act, renderHook } from '@testing-library/react';

import { useWindowDimensions } from './useWindowDimensions';

type MockWindowResult = {
  resizeWindow: (width: number, height: number) => void;
};

const mockWindow = (): MockWindowResult => {
  let originalWindowSize = [0, 0];

  beforeAll(() => {
    originalWindowSize = [window.innerWidth, window.innerHeight];
  });

  afterAll(() => {
    window.innerWidth = originalWindowSize[0];
    window.innerHeight = originalWindowSize[1];
  });

  const resizeWindow = (width: number, height: number): void => {
    window.innerWidth = width;
    window.innerHeight = height;

    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  };

  return { resizeWindow };
};

describe('useWindowDimensions', () => {
  const { resizeWindow } = mockWindow();

  it('returns window dimensions', () => {
    // Arrange
    resizeWindow(640, 480);

    // Act
    const { result: hookReturnRef } = renderHook(useWindowDimensions);

    // Assert
    expect(hookReturnRef.current).toEqual({ width: 640, height: 480 });
  });

  it('updates when window resizes', () => {
    // Arrange
    resizeWindow(640, 480);
    const { result: hookReturnRef } = renderHook(useWindowDimensions);

    // Act
    act(() => {
      resizeWindow(1280, 960);
    });

    // Assert
    expect(hookReturnRef.current).toEqual({ width: 1280, height: 960 });
  });
});
