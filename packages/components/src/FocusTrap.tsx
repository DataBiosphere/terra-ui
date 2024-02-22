import { ReactNode } from 'react';
import FocusLock from 'react-focus-lock';

export type FocusTrapProps = JSX.IntrinsicElements['div'] & {
  onEscape: () => void;
};

/**
 * Trap focus within an element until the "escape" key is pressed.
 *
 * @param props
 * @param props.onEscape - Called when "escape" key is pressed.
 */
export const FocusTrap = (props: FocusTrapProps): ReactNode => {
  const { children, style, onEscape, ...otherProps } = props;

  return (
    <FocusLock
      lockProps={{
        tabIndex: 0,
        style: {
          outline: 'none',
          ...style,
        },
        ...otherProps,
        onKeyDown: (e) => {
          if (e.key === 'Escape') {
            onEscape();
            e.stopPropagation();
          }
        },
      }}
      returnFocus
    >
      {children}
    </FocusLock>
  );
};
