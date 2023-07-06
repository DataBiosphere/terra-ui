import { Interactive } from '@databiosphere/components';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { containsUnlabelledIcon } from 'src/components/icons';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { forwardRefWithName, useLabelAssert } from 'src/libs/react-utils';

export const Clickable = forwardRefWithName(
  'Clickable',
  ({ href, as = href ? 'a' : 'div', disabled, tooltip, tooltipSide, tooltipDelay, useTooltipAsLabel, onClick, children, ...props }, ref) => {
    const child = h(
      Interactive,
      {
        'aria-disabled': !!disabled,
        as,
        disabled,
        ref,
        onClick: (...args) => onClick && !disabled && onClick(...args),
        href: !disabled ? href : undefined,
        tabIndex: disabled ? '-1' : '0',
        ...props,
      },
      [children]
    );

    // To support accessibility, every link must have a label or contain text or a labeled child.
    // If an unlabeled link contains just a single unlabeled icon, then we should use the tooltip as the label,
    // rather than as the description as we otherwise would.
    //
    // If the auto-detection can't make the proper determination, for example, because the icon is wrapped in other elements,
    // you can explicitly pass in a boolean as `useTooltipAsLabel` to force the correct behavior.
    //
    // Note that TooltipTrigger does this same check with its own children, but since we'll be passing it an
    // Interactive element, we need to do the check here instead.
    const useAsLabel = _.isNil(useTooltipAsLabel) ? containsUnlabelledIcon({ children, ...props }) : useTooltipAsLabel;

    // If we determined that we need to use the tooltip as a label, assert that we have a tooltip.
    // Do the check here and pass empty properties, to bypass the check logic in useLabelAssert() which doesn't take into account the icon's properties.
    if (useAsLabel && !tooltip) {
      useLabelAssert('Clickable', { allowTooltip: true, allowContent: true });
    }

    if (tooltip) {
      return h(TooltipTrigger, { content: tooltip, side: tooltipSide, delay: tooltipDelay, useTooltipAsLabel: useAsLabel }, [child]);
    }
    return child;
  }
);
