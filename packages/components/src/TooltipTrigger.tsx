import _ from 'lodash/fp';
import { Children, cloneElement, CSSProperties, ReactElement, ReactNode, useEffect, useRef, useState } from 'react';

import { useUniqueId } from './hooks/useUniqueId';
import { containsOnlyUnlabelledIcon } from './internal/a11y-utils';
import { computePopupPosition, Side, useBoundingRects } from './internal/popup-utils';
import { PopupPortal } from './internal/PopupPortal';
import { useThemeFromContext } from './theme';

const styles = {
  tooltip: {
    position: 'fixed',
    top: 0,
    left: 0,
    maxWidth: 400,
    padding: '1rem',
    borderRadius: 4,
    background: '#FFFFFF',
    boxShadow: '0 1px 3px 2px rgba(0,0,0,0.3)',
    lineHeight: 1.5,
    pointerEvents: 'none',
  },
  notch: {
    position: 'absolute',
    width: 17,
    height: 8,
    marginLeft: -8,
    marginRight: -8,
    marginTop: -8,
    transformOrigin: 'bottom',
    filter: 'drop-shadow(0px -2px 1px rgba(0,0,0,0.3))',
    fill: '#FFFFFF',
  },
} as const satisfies Record<string, CSSProperties>;

interface TooltipProps {
  children?: ReactNode;
  delay?: number;
  id: string;
  side?: Side;
  targetId: string;
}

const Tooltip = (props: TooltipProps): ReactNode => {
  const { children, delay, id, side = 'bottom', targetId } = props;

  const theme = useThemeFromContext();

  const [shouldRender, setShouldRender] = useState(!delay);
  const elementRef = useRef<HTMLDivElement>(null);
  const [targetBounds, tooltipBounds, viewportBounds] = useBoundingRects([
    { id: targetId },
    { ref: elementRef },
    { viewport: true },
  ]);

  useEffect(() => {
    if (delay) {
      const renderTimeout = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(renderTimeout);
    }
  }, [delay]);

  const { position, side: finalSide } = computePopupPosition({
    elementSize: tooltipBounds,
    gap: 10,
    targetPosition: targetBounds,
    preferredSide: side,
    viewportSize: viewportBounds,
  });

  const getNotchPositionStyle = (): CSSProperties => {
    const left = _.clamp(12, tooltipBounds.width - 12, (targetBounds.left + targetBounds.right) / 2 - position.left);
    const top = _.clamp(12, tooltipBounds.height - 12, (targetBounds.top + targetBounds.bottom) / 2 - position.top);

    // Use 1 in placement below to to avoid a faint line along the base of the triangle, where it meets up with the tooltip rectangle.
    switch (finalSide) {
      case 'top':
        return { bottom: 1, left, transform: 'rotate(180deg)' };
      case 'right':
        return { left: 1, top, transform: 'rotate(270deg)' };
      case 'bottom':
        return { top: 1, left };
      case 'left':
        return { right: 1, top, transform: 'rotate(90deg)' };
      default:
        throw new Error('Invalid side');
    }
  };

  return (
    <PopupPortal>
      <div
        id={id}
        role="tooltip"
        ref={elementRef}
        style={{
          ...styles.tooltip,
          display: shouldRender ? undefined : 'none',
          transform: `translate(${position.left}px, ${position.top}px)`,
          color: theme.colors.dark(),
          borderColor: theme.colors.secondary(),
        }}
      >
        {children}
        <svg viewBox="0 0 2 1" style={{ ...styles.notch, ...getNotchPositionStyle() }}>
          <path d="M0,1l1,-1l1,1Z" />
        </svg>
      </div>
    </PopupPortal>
  );
};

export interface TooltipTriggerProps extends Pick<TooltipProps, 'delay' | 'side'> {
  children: ReactElement;
  content?: ReactNode;
  useTooltipAsLabel?: boolean;
}

export const TooltipTrigger = (props: TooltipTriggerProps): ReactNode => {
  const { children, content, delay, side, useTooltipAsLabel } = props;
  const hasTooltipContent = !!content;

  const [isOpen, setIsOpen] = useState(false);

  const id = useUniqueId();
  const tooltipId = useUniqueId();
  const descriptionId = useUniqueId();

  const child = Children.only(children);
  const childId = child.props.id || id;

  // To support accessibility, every link must have a label or contain text or a labeled child.
  // If an unlabeled link contains just a single unlabeled icon, then we should use the tooltip as the label,
  // rather than as the description as we otherwise would.
  //
  // If the auto-detection can't make the proper determination, for example, because the icon is wrapped in other elements,
  // you can explicitly pass in a boolean as `useTooltipAsLabel` to force the correct behavior.
  const useAsLabel = _.isNil(useTooltipAsLabel) ? containsOnlyUnlabelledIcon(child.props) : useTooltipAsLabel;

  return (
    <>
      {cloneElement(child, {
        id: childId,
        'aria-labelledby': hasTooltipContent && useAsLabel ? descriptionId : undefined,
        'aria-describedby': hasTooltipContent && !useAsLabel ? descriptionId : undefined,
        onMouseEnter: (...args) => {
          child.props.onMouseEnter?.(...args);
          setIsOpen(true);
        },
        onMouseLeave: (...args) => {
          child.props.onMouseLeave?.(...args);
          setIsOpen(false);
        },
        onFocus: (...args) => {
          child.props.onFocus?.(...args);
          setIsOpen(true);
        },
        onBlur: (...args) => {
          child.props.onBlur?.(...args);
          setIsOpen(false);
        },
      })}
      {hasTooltipContent && (
        <>
          {isOpen && (
            <Tooltip delay={delay} id={tooltipId} side={side} targetId={childId}>
              {content}
            </Tooltip>
          )}
          <div id={descriptionId} style={{ display: 'none' }}>
            {content}
          </div>
        </>
      )}
    </>
  );
};
