import { render } from '@testing-library/react';
import { useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';

import { computePopupPosition, Position, Size, useBoundingRects } from './popup-utils';

describe('computePopupPosition', () => {
  it('computes position of popup element based on position of target element', () => {
    // Arrange
    const elementSize: Size = { width: 300, height: 100 };
    const viewportSize: Size = {
      width: 1280,
      height: 960,
    };
    const targetPosition: Position = {
      top: 430,
      right: 690,
      bottom: 530,
      left: 590,
    };
    const gap = 10;

    // Act
    const topPopup = computePopupPosition({
      elementSize,
      gap,
      preferredSide: 'top',
      targetPosition,
      viewportSize,
    });

    const rightPopup = computePopupPosition({
      elementSize,
      gap,
      preferredSide: 'right',
      targetPosition,
      viewportSize,
    });

    const bottomPopup = computePopupPosition({
      elementSize,
      gap,
      preferredSide: 'bottom',
      targetPosition,
      viewportSize,
    });

    const leftPopup = computePopupPosition({
      elementSize,
      gap,
      preferredSide: 'left',
      targetPosition,
      viewportSize,
    });

    // Assert
    expect(topPopup.position).toEqual({ top: 320, right: 790, bottom: 420, left: 490 });
    expect(topPopup.side).toBe('top');

    expect(rightPopup.position).toEqual({ top: 430, right: 1000, bottom: 530, left: 700 });
    expect(rightPopup.side).toBe('right');

    expect(bottomPopup.position).toEqual({ top: 540, right: 790, bottom: 640, left: 490 });
    expect(bottomPopup.side).toBe('bottom');

    expect(leftPopup.position).toEqual({ top: 430, right: 580, bottom: 530, left: 280 });
    expect(leftPopup.side).toBe('left');
  });

  it('moves popup to opposite side if there is not enough space on preferred side', () => {
    // Arrange
    const elementSize: Size = { width: 300, height: 100 };
    const viewportSize: Size = {
      width: 1280,
      height: 960,
    };
    const targetPosition: Position = {
      top: 430,
      right: 1180,
      bottom: 530,
      left: 1080,
    };
    const gap = 10;

    // Act
    const popup = computePopupPosition({
      elementSize,
      gap,
      preferredSide: 'right',
      targetPosition,
      viewportSize,
    });

    // Assert
    expect(popup.position).toEqual({ top: 430, right: 1070, bottom: 530, left: 770 });
    expect(popup.side).toBe('left');
  });
});

describe('useBoundingRects', () => {
  beforeAll(() => {
    // JSDOM's getBoundingClientRect always returns all zeroes.
    jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      // @ts-ignore
      // eslint-disable-next-line
      const self: HTMLElement = this;

      const width = parseFloat(self.style.width) || 0;
      const height = parseFloat(self.style.height) || 0;
      const top = parseFloat(self.style.marginTop) || 0;
      const left = parseFloat(self.style.marginLeft) || 0;

      return {
        x: left,
        y: top,
        width,
        height,
        top,
        right: left + width,
        bottom: top + height,
        left,
      } as DOMRect;
    });
  });

  it('returns bounding rect for elements selected by ref', () => {
    // Arrange
    const receivedBoundingRect = jest.fn();

    const TestComponent = () => {
      const ref = useRef<HTMLDivElement>(null);

      const [boundingRect] = useBoundingRects([{ ref }]);
      receivedBoundingRect(boundingRect);

      return div({ ref, style: { width: 200, height: 100, margin: '100px 0 0 50px' } });
    };

    // Act
    render(h(TestComponent));

    // Assert
    expect(receivedBoundingRect).toHaveBeenCalledWith({
      width: 200,
      height: 100,
      top: 100,
      right: 250,
      bottom: 200,
      left: 50,
    });
  });

  it('returns bounding rect for elements selected by ID', () => {
    // Arrange
    const receivedBoundingRect = jest.fn();

    const TestComponent = () => {
      const [boundingRect] = useBoundingRects([{ id: 'test-element' }]);
      receivedBoundingRect(boundingRect);

      return div({ id: 'test-element', style: { width: 200, height: 100, margin: '100px 0 0 50px' } });
    };

    // Act
    render(h(TestComponent));

    // Assert
    expect(receivedBoundingRect).toHaveBeenCalledWith({
      width: 200,
      height: 100,
      top: 100,
      right: 250,
      bottom: 200,
      left: 50,
    });
  });

  it('returns bounding rect for the window', () => {
    // Arrange
    const receivedBoundingRect = jest.fn();

    const TestComponent = () => {
      const [boundingRect] = useBoundingRects([{ viewport: true }]);
      receivedBoundingRect(boundingRect);

      return null;
    };

    // Act
    render(h(TestComponent));

    // Assert
    expect(receivedBoundingRect).toHaveBeenCalledWith({
      width: 1024,
      height: 768,
      top: 0,
      right: 1024,
      bottom: 768,
      left: 0,
    });
  });
});
