import { useThemeFromContext } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';

import { Clickable } from './Clickable';

const buttonStyle = {
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

export const ButtonPrimary = ({ disabled, danger = false, children, ...props }) => {
  const { colors } = useThemeFromContext();
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          ...buttonStyle,
          border: `1px solid ${disabled ? colors.dark(0.4) : danger ? colors.danger(1.2) : colors.accent(1.2)}`,
          borderRadius: 5,
          color: 'white',
          padding: '0.875rem',
          backgroundColor: disabled ? colors.dark(0.25) : danger ? colors.danger() : colors.accent(),
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
        hover: disabled ? undefined : { backgroundColor: danger ? colors.danger(0.85) : colors.accent(0.85) },
      },
      props
    ),
    [children]
  );
};

export const ButtonSecondary = ({ disabled, children, ...props }) => {
  const { colors } = useThemeFromContext();
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          ...buttonStyle,
          color: disabled ? colors.dark(0.7) : colors.accent(),
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
        hover: disabled ? undefined : { color: colors.accent(0.8) },
      },
      props
    ),
    [children]
  );
};

export const ButtonOutline = ({ disabled, children, ...props }) => {
  const { colors } = useThemeFromContext();
  return h(
    ButtonPrimary,
    _.merge(
      {
        disabled,
        style: {
          border: `1px solid ${disabled ? colors.dark(0.4) : colors.accent()}`,
          color: colors.accent(),
          backgroundColor: disabled ? colors.dark(0.25) : 'white',
        },
        hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) },
      },
      props
    ),
    [children]
  );
};
