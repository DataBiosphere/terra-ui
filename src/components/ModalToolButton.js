import _ from 'lodash/fp';
import { div, h, img } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

export const ModalToolButton = ({ icon, text, disabled, ...props }) => {
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          color: disabled ? colors.secondary() : colors.accent(),
          opacity: disabled ? 0.5 : undefined,
          border: '1px solid transparent',
          padding: '0 0.875rem',
          marginBottom: '0.5rem',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          height: '3rem',
          fontSize: 18,
          userSelect: 'none',
        },
        hover: {
          border: `1px solid ${colors.accent(0.8)}`,
          boxShadow: Style.standardShadow,
        },
      },
      props
    ),
    [
      !!icon &&
        div({ style: { display: 'flex', alignItems: 'center', width: 45, marginRight: '1rem' } }, [
          img({ src: icon, style: { opacity: disabled ? 0.5 : undefined, maxWidth: 45, maxHeight: 40 } }),
        ]),
      text,
    ]
  );
};
