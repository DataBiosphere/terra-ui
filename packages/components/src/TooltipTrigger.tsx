import _ from 'lodash/fp';
import {
  Children,
  cloneElement,
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useUniqueId } from './hooks/useUniqueId';
import { Icon } from './Icon';
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
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  },
  copyableTooltip: {
    display: 'flex',
    pointerEvents: 'auto',
    userSelect: 'text',
    alignItems: 'flex-start',
  },
  copyButton: {
    flexShrink: 0,
    marginRight: '0.75rem',
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    lineHeight: 0,
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

// For copyable tooltips: how long the tooltip stays open after the pointer leaves the trigger, so the pointer
// can cross the gap into the tooltip.
const copyableCloseDelay = 150;

// How long the copy button shows a check mark after copying.
const copiedConfirmationDuration = 1500;

interface TooltipProps {
  children?: ReactNode;
  copyable?: boolean;
  delay?: number;
  id: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  side?: Side;
  targetId: string;
}

const Tooltip = (props: TooltipProps): ReactNode => {
  const { children, copyable, delay, id, onMouseEnter, onMouseLeave, side = 'bottom', targetId } = props;

  const theme = useThemeFromContext();

  const [shouldRender, setShouldRender] = useState(!delay);
  const [isCopied, setIsCopied] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (isCopied) {
      const copiedTimeout = setTimeout(() => setIsCopied(false), copiedConfirmationDuration);
      return () => clearTimeout(copiedTimeout);
    }
  }, [isCopied]);

  // If the pointer leaves mid-drag (e.g. while selecting text), wait for the drag to end, and only close if
  // the pointer didn't come back.
  const handleMouseLeave = (e: MouseEvent) => {
    if (e.buttons) {
      document.addEventListener(
        'mouseup',
        () => {
          if (!elementRef.current?.matches(':hover')) onMouseLeave?.();
        },
        { once: true }
      );
    } else {
      onMouseLeave?.();
    }
  };

  const copyContent = async () => {
    // innerText keeps the visible line breaks; textContent is a fallback where innerText isn't implemented (jsdom)
    const text = contentRef.current?.innerText ?? contentRef.current?.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch {
      // Clipboard access can be denied; the text is still selectable as a fallback.
    }
  };

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
        role='tooltip'
        ref={elementRef}
        onMouseEnter={copyable ? onMouseEnter : undefined}
        onMouseLeave={copyable ? handleMouseLeave : undefined}
        style={{
          ...styles.tooltip,
          ...(copyable ? styles.copyableTooltip : {}),
          ...(shouldRender ? {} : { display: 'none' }),
          transform: `translate(${position.left}px, ${position.top}px)`,
          color: theme.colors.dark(),
          borderColor: theme.colors.secondary(),
        }}
      >
        {copyable && (
          <button
            type='button'
            aria-label={isCopied ? 'Copied' : 'Copy to clipboard'}
            title={isCopied ? 'Copied' : 'Copy to clipboard'}
            onClick={copyContent}
            style={{ ...styles.copyButton, color: theme.colors.accent() }}
          >
            <Icon icon={isCopied ? 'check' : 'copy'} size={16} />
          </button>
        )}
        {copyable ? <div ref={contentRef}>{children}</div> : children}
        <svg viewBox='0 0 2 1' style={{ ...styles.notch, ...getNotchPositionStyle() }}>
          <path d='M0,1l1,-1l1,1Z' />
        </svg>
      </div>
    </PopupPortal>
  );
};

export interface TooltipTriggerProps extends Pick<TooltipProps, 'delay' | 'side'> {
  children: ReactElement;
  content?: ReactNode;
  /**
   * Lets the user move into the tooltip to select its text, and adds a button to copy all of it.
   * Off by default, since an interactive tooltip covers whatever is beneath it while hovered.
   */
  copyable?: boolean;
  useTooltipAsLabel?: boolean;
}

export const TooltipTrigger = (props: TooltipTriggerProps): ReactNode => {
  const { children, content, copyable, delay, side, useTooltipAsLabel } = props;
  const hasTooltipContent = !!content;

  const [isOpen, setIsOpen] = useState(false);

  const closeTimeout = useRef<ReturnType<typeof setTimeout>>();
  const cancelClose = useCallback(() => clearTimeout(closeTimeout.current), []);
  const close = useCallback(() => {
    clearTimeout(closeTimeout.current);
    if (copyable) {
      closeTimeout.current = setTimeout(() => setIsOpen(false), copyableCloseDelay);
    } else {
      setIsOpen(false);
    }
  }, [copyable]);
  useEffect(() => cancelClose, [cancelClose]);

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
        onMouseEnter: (...args: unknown[]) => {
          child.props.onMouseEnter?.(...args);
          cancelClose();
          setIsOpen(true);
        },
        onMouseLeave: (...args: unknown[]) => {
          child.props.onMouseLeave?.(...args);
          close();
        },
        onFocus: (...args: unknown[]) => {
          child.props.onFocus?.(...args);
          cancelClose();
          setIsOpen(true);
        },
        onBlur: (...args: unknown[]) => {
          child.props.onBlur?.(...args);
          setIsOpen(false);
        },
      })}
      {hasTooltipContent && (
        <>
          {isOpen && (
            <Tooltip
              copyable={copyable}
              delay={delay}
              id={tooltipId}
              onMouseEnter={cancelClose}
              onMouseLeave={close}
              side={side}
              targetId={childId}
            >
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
