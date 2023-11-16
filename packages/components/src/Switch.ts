import { ForwardedRef, forwardRef, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import RSwitch, { ReactSwitchProps } from 'react-switch';

import { useThemeFromContext } from './theme';

interface SwitchLabelProps {
  children: ReactNode;
  isOn: boolean;
}

const SwitchLabel = (props: SwitchLabelProps): ReactNode => {
  const { children, isOn } = props;
  return div(
    {
      style: {
        display: 'flex',
        justifyContent: isOn ? 'flex-start' : 'flex-end',
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
        height: '100%',
        lineHeight: '28px',
        ...(isOn ? { marginLeft: '0.75rem' } : { marginRight: '0.5rem' }),
      },
    },
    [children]
  );
};

export interface SwitchProps extends Pick<ReactSwitchProps, 'checked' | 'disabled' | 'id' | 'height' | 'width'> {
  onLabel?: string;
  offLabel?: string;
  onChange: (checked: boolean) => void;
}

export const Switch = forwardRef((props: SwitchProps, ref: ForwardedRef<HTMLInputElement>) => {
  const { offLabel = 'False', onLabel = 'True', onChange, ...otherProps } = props;

  const { colors } = useThemeFromContext();

  return h(RSwitch, {
    // Forward ref to underlying input element instead of RSwitch instance.
    // @ts-expect-error Types for React Hyperscript Helpers don't support refs well.
    ref: (rSwitch: any) => {
      const inputEl: HTMLInputElement = rSwitch ? rSwitch.$inputRef : null;
      if (ref && 'current' in ref) {
        ref.current = inputEl;
      } else if (typeof ref === 'function') {
        ref(inputEl);
      }
    },
    onColor: colors.success(1.5),
    offColor: colors.dark(0.8),
    checkedIcon: h(SwitchLabel, { isOn: true }, [onLabel]),
    uncheckedIcon: h(SwitchLabel, { isOn: false }, [offLabel]),
    width: 80,
    onChange: (checked) => onChange(checked),
    ...otherProps,
  });
});

Switch.displayName = 'Switch';
