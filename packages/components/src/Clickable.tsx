import { ForwardedRef, forwardRef, ReactNode } from 'react';

import { Interactive, InteractiveProps } from './Interactive';
import { Side } from './internal/popup-utils';
import { TooltipTrigger } from './TooltipTrigger';

export interface ClickableProps extends InteractiveProps {
  tooltip?: ReactNode;
  tooltipDelay?: number;
  tooltipSide?: Side;
  useTooltipAsLabel?: boolean;
}

export const Clickable = forwardRef((props: ClickableProps, ref: ForwardedRef<HTMLElement>) => {
  const {
    children,
    disabled,
    href,
    tagName = href ? 'a' : 'div',
    tooltip,
    tooltipDelay,
    tooltipSide,
    useTooltipAsLabel,
    onClick,
    ...otherProps
  } = props;

  const interactiveElement = (
    <Interactive
      ref={ref}
      aria-disabled={!!disabled}
      disabled={disabled}
      href={!disabled ? href : undefined}
      tabIndex={disabled ? -1 : 0}
      tagName={tagName}
      onClick={(e) => onClick && !disabled && onClick(e)}
      {...otherProps}
    >
      {children}
    </Interactive>
  );

  if (tooltip) {
    return (
      <TooltipTrigger content={tooltip} side={tooltipSide} delay={tooltipDelay} useTooltipAsLabel={useTooltipAsLabel}>
        {interactiveElement}
      </TooltipTrigger>
    );
  }
  return interactiveElement;
});

Clickable.displayName = 'Clickable';
