import React from 'react';
import type { InteractiveProps } from 'src/components/Interactive';

export type ClickableProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
  as?: T;
  href?: string;
  tooltip?: string | React.ReactElement<'div'>;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tooltipDelay?: number;
  useTooltipAsLabel?: boolean;
} & Omit<InteractiveProps<T>, 'as'>;

export const Clickable: <T extends keyof JSX.IntrinsicElements>(props: ClickableProps<T>) => JSX.Element;
