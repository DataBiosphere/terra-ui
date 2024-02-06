import {
  AllHTMLAttributes,
  AriaAttributes,
  Children,
  cloneElement,
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import onClickOutside from 'react-onclickoutside';

import { FocusTrap } from './FocusTrap';
import { useUniqueId } from './hooks/useUniqueId';
import { computePopupPosition, Side, useBoundingRects } from './internal/popup-utils';
import { PopupPortal } from './internal/PopupPortal';
import { useThemeFromContext } from './theme';

type DivProps = JSX.IntrinsicElements['div'];

// The role of the popup element must match the aria-haspopup attribute of the popup trigger element.
// aria-popup supports a limited subset of ARIA roles.
type PopupRole = Exclude<AriaAttributes['aria-haspopup'], boolean | 'true' | 'false'>;

interface PopupElementProps extends Omit<DivProps, 'role'> {
  role: PopupRole;
}

interface PopupProps {
  children?: ReactNode;
  popupProps: PopupElementProps;
  side: Side;
  targetId: string;
}

// This is written as a "function" function rather than an arrow function because react-onclickoutside wants it to have a prototype
const Popup = onClickOutside(function (props: PopupProps) {
  const { children, popupProps, side = 'right', targetId } = props;

  const { colors } = useThemeFromContext();

  const elementRef = useRef<HTMLDivElement>(null);
  const [targetBounds, elementBounds, viewportBounds] = useBoundingRects([
    { id: targetId },
    { ref: elementRef },
    { viewport: true },
  ]);
  const { position } = computePopupPosition({
    elementSize: elementBounds,
    gap: 10,
    preferredSide: side,
    targetPosition: targetBounds,
    viewportSize: viewportBounds,
  });

  return (
    <PopupPortal>
      <div
        ref={elementRef}
        {...popupProps}
        style={{
          border: `1px solid ${colors.dark(0.55)}`,
          borderRadius: 4,
          backgroundColor: 'white',
          boxShadow: '0 3px 2px 0 rgba(0,0,0,0.12)',
          ...popupProps.style,
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate(${position.left}px, ${position.top}px)`,
          visibility: !viewportBounds.width ? 'hidden' : popupProps.style?.visibility,
        }}
      >
        {children}
      </div>
    </PopupPortal>
  );
});

export interface PopupTriggerProps {
  children: ReactElement;
  closeOnClick?: boolean;
  content: ReactNode;
  popupProps?: PopupElementProps;
  side?: Side;
  onChange?: (open: boolean) => void;
}

export interface PopupTriggerRef {
  close: () => void;
}

export const PopupTrigger = forwardRef((props: PopupTriggerProps, ref: ForwardedRef<PopupTriggerRef>) => {
  const {
    children,
    closeOnClick = false,
    content,
    popupProps: { role = 'dialog', ...otherPopupProps } = {},
    side = 'top',
    onChange,
  } = props;

  const [open, _setOpen] = useState(false);

  // Call onChange whenever the open state is set.
  const setOpen = useCallback(
    (open: boolean) => {
      _setOpen(open);
      onChange?.(open);
    },
    [onChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  useImperativeHandle(ref, () => ({
    close: () => setOpen(false),
  }));

  const child = Children.only(children);
  const defaultChildId = useUniqueId();
  const childId = child.props.id || defaultChildId;

  const popupId = useUniqueId();

  const labelledby = child.props['aria-labelledby'] || childId;

  return (
    <>
      {cloneElement(child, {
        'aria-controls': open ? popupId : undefined,
        'aria-expanded': open,
        'aria-haspopup': role,
        'aria-owns': open ? popupId : undefined,
        // Add childId as a class to match Popup's outsideClickIgnoreClass.
        className: `${child.props.className || ''} ${childId}`,
        id: childId,
        onClick: (e) => {
          child.props.onClick?.(e);
          setOpen(!open);
        },
      } satisfies AllHTMLAttributes<HTMLElement>)}
      {open && (
        <Popup
          outsideClickIgnoreClass={childId}
          popupProps={{
            // aria-modal is only relevant for dialog popups.
            'aria-modal': role === 'dialog' ? true : undefined,
            ...otherPopupProps,
            'aria-labelledby': labelledby,
            id: popupId,
            role,
            onClick: closeOnClick ? close : undefined,
          }}
          side={side}
          targetId={childId}
          handleClickOutside={close}
        >
          <FocusTrap onEscape={close}>{content}</FocusTrap>
        </Popup>
      )}
    </>
  );
});

PopupTrigger.displayName = 'PopupTrigger';
