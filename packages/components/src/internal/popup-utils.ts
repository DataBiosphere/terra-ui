import _ from 'lodash/fp';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'right-aligned-bottom';

export const sideOptions: Record<Side, Side> = {
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  'right-aligned-bottom': 'right-aligned-bottom',
};

export interface ComputePopupPositionArgs {
  /* Size of the popup element. */
  elementSize: Size;

  /* Gap between popup and target elements. */
  gap: number;

  /* Preferred side of the target element to place the popup element on. */
  preferredSide: Side;

  /* Position of the target element. */
  targetPosition: Position;

  /* Size of the window. */
  viewportSize: Size;
}

interface ComputePopupPositionResult {
  position: Position;
  side: Side;
}

/**
 * Compute a popup's position based on its target element.
 */
export const computePopupPosition = (args: ComputePopupPositionArgs): ComputePopupPositionResult => {
  const { elementSize, gap, preferredSide, targetPosition, viewportSize } = args;

  const getPosition = (s: Side): Pick<Position, 'left' | 'top'> => {
    const left = _.flow(
      _.clamp(0, viewportSize.width - elementSize.width),
      _.clamp(targetPosition.left - elementSize.width + 16, targetPosition.right - 16)
    )((targetPosition.left + targetPosition.right) / 2 - elementSize.width / 2);

    const top = _.flow(
      _.clamp(0, viewportSize.height - elementSize.height),
      _.clamp(targetPosition.top - elementSize.height + 16, targetPosition.bottom - 16)
    )((targetPosition.top + targetPosition.bottom) / 2 - elementSize.height / 2);

    switch (s) {
      case 'top':
        return { top: targetPosition.top - elementSize.height - gap, left };
      case 'right':
        return { left: targetPosition.right + gap, top };
      case 'bottom':
        return { top: targetPosition.bottom + gap, left };
      case 'left':
        return { left: targetPosition.left - elementSize.width - gap, top };
      case 'right-aligned-bottom':
        return { left: targetPosition.right - elementSize.width, top: targetPosition.bottom + gap };
      default:
        throw new Error('Invalid side');
    }
  };

  const position = getPosition(preferredSide);

  // If the popup would overflow the viewport when placed on the preferred side of the target
  // element, "flip" it to the other side of the element.
  const maybeFlip = (d: Side): Side => {
    switch (d) {
      case 'top':
        return position.top < 0 ? 'bottom' : 'top';
      case 'right':
        return position.left + elementSize.width >= viewportSize.width ? 'left' : 'right';
      case 'bottom':
        return position.top + elementSize.height >= viewportSize.height ? 'top' : 'bottom';
      case 'left':
        return position.left < 0 ? 'right' : 'left';
      case 'right-aligned-bottom':
        return 'right-aligned-bottom'; // don't flip
      default:
        throw new Error('Invalid side');
    }
  };

  const finalSide = maybeFlip(preferredSide);

  // Recompute position after side may have changed.
  const finalPosition = getPosition(finalSide);

  return {
    position: {
      ...finalPosition,
      right: finalPosition.left + elementSize.width,
      bottom: finalPosition.top + elementSize.height,
    },
    side: finalSide,
  };
};

type BoundingRect = Size & Position;

const toBoundingRect: (domRect: DOMRect) => BoundingRect = _.pick([
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
]);

export type UseBoundingRectsSelector =
  | { ref: RefObject<HTMLElement | null | undefined> }
  | { id: string }
  | { viewport: true };

/**
 * Returns the bounding rectangles of specified elements.
 * @param selectors - Selectors for elements. Selectors can be by ref, ID, or the viewport/window.
 */
export const useBoundingRects = (selectors: UseBoundingRectsSelector[]): BoundingRect[] => {
  const [dimensions, setDimensions] = useState<BoundingRect[]>(
    selectors.map(() => ({ width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }))
  );

  const dimensionsRef = useRef<BoundingRect[]>();
  dimensionsRef.current = dimensions;

  // The selectors argument is likely to be an array defined inline, and thus change identity every render.
  // Thus, we don't want to make computePosition depend on it because the requestAnimationFrame effect hook
  // depends on computePosition.
  //
  // To avoid that, we have computePosition access the current selectors value via a ref.
  const selectorsRef = useRef<UseBoundingRectsSelector[]>(selectors);
  selectorsRef.current = selectors;

  const animationRef = useRef<number>();

  const computePosition = useCallback(() => {
    const newDimensions: BoundingRect[] = selectorsRef.current.map((selector) => {
      if ('ref' in selector && selector.ref.current) {
        return toBoundingRect(selector.ref.current.getBoundingClientRect());
      }

      if ('id' in selector) {
        const element = document.getElementById(selector.id);
        if (element) {
          return toBoundingRect(element.getBoundingClientRect());
        }
      }

      if ('viewport' in selector) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        return { width, height, top: 0, right: width, bottom: height, left: 0 };
      }

      return { width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    });

    if (!_.isEqual(newDimensions, dimensionsRef.current)) {
      setDimensions(newDimensions);
    }

    animationRef.current = requestAnimationFrame(computePosition);
  }, []);

  useEffect(() => {
    computePosition();
    return () => {
      // animationRef.current is set in computePosition, so it will be non-null here.
      cancelAnimationFrame(animationRef.current!);
    };
  }, [computePosition]);

  return dimensions;
};
