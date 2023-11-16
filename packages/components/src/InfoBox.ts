import { CSSProperties, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';

import { Clickable } from './Clickable';
import { icon } from './icon';
import { IconId } from './icon-library';
import { PopupTrigger, PopupTriggerProps } from './PopupTrigger';
import { useThemeFromContext } from './theme';

export interface InfoBoxProps {
  children?: ReactNode;
  icon?: IconId;
  side?: PopupTriggerProps['side'];
  size?: number;
  style?: CSSProperties;
  tooltip?: ReactNode;
}

export const InfoBox = (props: InfoBoxProps): ReactNode => {
  const { children, icon: iconId = 'info-circle', side, size, style, tooltip } = props;

  const { colors } = useThemeFromContext();

  return h(
    PopupTrigger,
    {
      side,
      content: div({ style: { padding: '0.5rem', width: 300 } }, [children]),
    },
    [
      h(
        Clickable,
        {
          'aria-label': 'More info',
          tagName: 'span',
          tooltip,
        },
        [icon(iconId, { size, style: { color: colors.accent(), cursor: 'pointer', ...style } })]
      ),
    ]
  );
};
