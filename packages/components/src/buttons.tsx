import { CSSProperties, ReactNode } from 'react';

import { Clickable, ClickableProps } from './Clickable';
import { useThemeFromContext } from './theme';

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  height: '2.25rem',
  fontSize: 14,
  fontWeight: 500,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

export interface ButtonPrimaryProps extends ClickableProps {
  danger?: boolean;
  inheritText?: boolean;
}

export const ButtonPrimary = (props: ButtonPrimaryProps): ReactNode => {
  const { children, danger = false, disabled, hover, style, ...otherProps } = props;

  const { colors } = useThemeFromContext();

  return (
    <Clickable
      {...otherProps}
      disabled={disabled}
      style={{
        ...buttonStyle,
        // TODO: Remove nested ternary to align with style guide
        // eslint-disable-next-line no-nested-ternary
        border: `1px solid ${disabled ? colors.dark(0.4) : danger ? colors.danger(1.2) : colors.accent(1.2)}`,
        borderRadius: 5,
        color: 'white',
        padding: '0.875rem',
        // TODO: Remove nested ternary to align with style guide
        // eslint-disable-next-line no-nested-ternary
        backgroundColor: disabled ? colors.dark(0.25) : danger ? colors.danger() : colors.accent(),
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      hover={
        disabled
          ? undefined
          : {
              backgroundColor: danger ? colors.danger(0.85) : colors.accent(0.85),
              ...hover,
            }
      }
    >
      {children}
    </Clickable>
  );
};

export type ButtonSecondaryProps = ClickableProps;

export const ButtonSecondary = (props: ButtonSecondaryProps): ReactNode => {
  const { children, disabled, hover, style, ...otherProps } = props;

  const { colors } = useThemeFromContext();

  return (
    <Clickable
      {...otherProps}
      disabled={disabled}
      style={{
        ...buttonStyle,
        color: disabled ? colors.dark(0.7) : colors.accent(),
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      hover={
        disabled
          ? undefined
          : {
              color: colors.accent(0.8),
              ...hover,
            }
      }
    >
      {children}
    </Clickable>
  );
};

export type ButtonOutlineProps = ClickableProps;

export const ButtonOutline = (props: ButtonOutlineProps): ReactNode => {
  const { children, disabled, hover, style, ...otherProps } = props;

  const { colors } = useThemeFromContext();

  return (
    <ButtonPrimary
      {...otherProps}
      disabled={disabled}
      style={{
        border: `1px solid ${disabled ? colors.dark(0.4) : colors.accent()}`,
        color: colors.accent(),
        backgroundColor: disabled ? colors.dark(0.25) : 'white',
        ...style,
      }}
      hover={
        disabled
          ? undefined
          : {
              backgroundColor: colors.accent(0.1),
              ...hover,
            }
      }
    >
      {children}
    </ButtonPrimary>
  );
};
