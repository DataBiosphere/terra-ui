import { Children, ReactNode } from 'react';

interface ContainsOnlyUnlabelledIconArgs {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  children?: ReactNode;
}

/**
 * Returns true if a component contains only one child and that child is an icon without a label.
 * @param args - Relevant props from the element in question.
 *
 * For accessibility, interactive elements must have an accessible name. That name can come from
 * the element's content or from ARIA attributes (aria-label, aria-labelledby).
 *
 * However, a common pattern is to have an "icon button" where a button has no visible text content.
 * In those cases, an accessible name needs to be provided with visibly hidden text or ARIA attributes.
 *
 * This function is intended to identify those cases and helpfully fall back to using the component's
 * tooltip (if it has one) as the accessible name.
 */
export const containsOnlyUnlabelledIcon = (args: ContainsOnlyUnlabelledIconArgs): boolean => {
  const { children, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy } = args;
  if (!ariaLabel && !ariaLabelledBy && Children.count(children) === 1 && typeof children !== 'string') {
    try {
      const onlyChild = Children.only(children);

      // Is there a better way to test for an icon component other than duck-typing?
      // @ts-expect-error
      // TODO: Make this check type safe
      // icon sets aria-hidden to true if neither aria-label or aria-labelledby is provided.
      if ('data-icon' in onlyChild.props && onlyChild.props['aria-hidden'] === true) {
        return true;
      }
    } catch (e) {
      /* do nothing */
    }
  }
  return false;
};
