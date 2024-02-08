import { ForwardedRef, forwardRef } from 'react';

import { Clickable, ClickableProps } from './Clickable';
import { useThemeFromContext } from './theme';

export interface LinkProps extends ClickableProps {
  baseColor?: (intensity?: number) => string;
  variant?: 'light';
}

export const Link = forwardRef((props: LinkProps, ref: ForwardedRef<HTMLElement>) => {
  const { baseColor: baseColorProp, children, disabled, hover, style, variant, ...otherProps } = props;

  const { colors } = useThemeFromContext();
  const baseColor = baseColorProp || colors.accent;

  return (
    <Clickable
      ref={ref}
      {...otherProps}
      disabled={disabled}
      style={{
        display: 'inline',
        color: disabled ? colors.disabled() : baseColor(variant === 'light' ? 0.3 : 1),
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        ...style,
      }}
      hover={
        disabled
          ? undefined
          : {
              color: baseColor(variant === 'light' ? 0.1 : 0.8),
              ...hover,
            }
      }
    >
      {children}
    </Clickable>
  );
});

Link.displayName = 'Link';
