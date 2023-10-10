import { IconId } from '@terra-ui-packages/components';
import { CSSProperties, PropsWithChildren, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import PopupTrigger from 'src/components/PopupTrigger';
import colors from 'src/libs/colors';

interface InfoBoxProps {
  size?: number;
  style?: CSSProperties;
  side?: 'top' | 'bottom' | 'left' | 'right';
  tooltip?: ReactNode;
  iconOverride?: IconId;
}

export const InfoBox = (props: PropsWithChildren<InfoBoxProps>) => {
  const { size, children, style, side, tooltip, iconOverride } = props;
  const [open, setOpen] = useState(false);
  return h(
    PopupTrigger,
    {
      side,
      onChange: setOpen,
      content: div({ style: { padding: '0.5rem', width: 300 } }, [children]),
    },
    [
      h(
        Clickable,
        {
          tooltip,
          tagName: 'span',
          'aria-label': 'More info',
          'aria-expanded': open,
          'aria-haspopup': true,
        },
        [icon(iconOverride || 'info-circle', { size, style: { cursor: 'pointer', color: colors.accent(), ...style } })]
      ),
    ]
  );
};
