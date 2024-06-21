import { CSSProperties, ReactNode } from 'react';

import { Clickable } from './Clickable';
import { Icon, IconId } from './Icon';
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
  const { children, icon = 'info-circle', side, size, style, tooltip } = props;

  const { colors } = useThemeFromContext();

  return (
    <PopupTrigger content={<div style={{ padding: '0.5rem', width: 300 }}>{children}</div>} side={side}>
      <Clickable aria-label='More info' tagName='span' tooltip={tooltip}>
        <Icon icon={icon} size={size} style={{ color: colors.accent(), cursor: 'pointer', ...style }} />
      </Clickable>
    </PopupTrigger>
  );
};
