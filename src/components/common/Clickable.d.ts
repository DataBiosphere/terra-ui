import type { InteractiveProps } from '@terra-ui-packages/components';
import { ReactNode } from 'react';

export type ClickableProps = {
  href?: string;
  tooltip?: ReactNode;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tooltipDelay?: number;
  useTooltipAsLabel?: boolean;
} & InteractiveProps;

export const Clickable: (props: ClickableProps) => JSX.Element;
