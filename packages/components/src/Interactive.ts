import _ from 'lodash/fp';
import { AllHTMLAttributes, createElement, ForwardedRef, forwardRef, useState } from 'react';

import { injectStyle } from './injectStyle';
import * as Utils from './utils';

// Interactive's hover and focus styles depend on this CSS.
injectStyle(`
.terra-ui--interactive:hover, .terra-ui--interactive:focus {
  --hover-background: var(--app-hover-background);
  --hover-backgroundColor: var(--app-hover-backgroundColor);
  --hover-border: var(--app-hover-border);
  --hover-color: var(--app-hover-color);
  --hover-boxShadow: var(--app-hover-boxShadow);
  --hover-opacity: var(--app-hover-opacity);
  --hover-textDecoration: var(--app-hover-textDecoration);
}

.terra-ui--interactive:hover .terra-ui--interactive:not(:hover) {
  --hover-background: initial;
  --hover-backgroundColor: initial;
  --hover-border: initial;
  --hover-color: initial;
  --hover-boxShadow: initial;
  --hover-opacity: initial;
  --hover-textDecoration: initial;
}
`);

const allowedHoverVariables = [
  'background',
  'backgroundColor',
  'border',
  'color',
  'boxShadow',
  'opacity',
  'textDecoration',
] as const;

// Union type of all values in allowedHoverVariables.
type HoverStyleProperty = (typeof allowedHoverVariables)[number];

const pointerTags = ['button', 'area', 'a', 'select'];
const pointerTypes = ['radio', 'checkbox', 'submit', 'button'];

// Since Interactive may render any HTML element based on the tagName prop,
// use AllHTMLAttributes<HTMLElement> to allow this to accept attributes
// for any HTML element.
// TODO: Can a more specific type be used by parameterizing this with a tag name?
export interface InteractiveProps extends AllHTMLAttributes<HTMLElement> {
  /** Styles applied when element is hovered or focused. */
  hover?: Pick<React.CSSProperties, HoverStyleProperty>;

  /** HTML tag to render. */
  tagName?: keyof JSX.IntrinsicElements;

  // Allow arbitrary data attributes on the rendered element.
  [dataAttribute: `data-${string}`]: string;
}

export const Interactive = forwardRef((props: InteractiveProps, ref: ForwardedRef<HTMLElement>) => {
  const {
    children,
    className = '',
    disabled,
    hover = {},
    role,
    style = {},
    tabIndex,
    tagName: TagName = 'div',
    type,
    onBlur,
    onClick,
    onKeyDown,
    onMouseDown,
    ...otherProps
  } = props;

  const [outline, setOutline] = useState<string>();
  const { cursor } = style;

  const computedCursor = Utils.cond(
    [!!cursor, () => cursor],
    [disabled, () => 'not-allowed'],
    [!!onClick || pointerTags.includes(TagName) || pointerTypes.includes(type!), () => 'pointer']
  );

  const computedTabIndex = Utils.cond(
    [_.isNumber(tabIndex), () => tabIndex],
    [disabled, () => -1],
    [!!onClick, () => 0],
    () => undefined
  );

  const computedRole = Utils.cond(
    [!!role, () => role],
    [onClick && !['input', ...pointerTags].includes(TagName), () => 'button'],
    () => undefined
  );

  /**
   * This allow setting :hover and :focus styles using inline styles in JS.
   * For supported style properties (listed in allowedHoverVariables), this sets the style property
   * X of the rendered element to be:
   * - the value of the --hover-X CSS variable if --hover-X is set
   * - the value of X from the `style` prop otherwise (style[X])
   *
   * It also sets the --app-hover-X CSS variable to be the value of X from the `hover` prop (hover[X])
   *
   * By default, --hover-X is not set, so the value from the `style` prop is used. When the element
   * is hovered or focused, the CSS injected above sets --hover-X to be equal to the value of --app-hover-X.
   * This overrides the value from the `style` prop with the value from the `hover` prop.
   */
  const cssVariables = _.flow(
    _.toPairs,
    _.flatMap(([key, value]) => {
      return [
        [`--app-hover-${key}`, value],
        [key, `var(--hover-${key}, ${style[key]})`],
      ];
    }),
    _.fromPairs
  )(hover);

  return createElement(
    TagName,
    {
      ref,
      className: `terra-ui--interactive ${className}`,
      style: {
        ...style,
        ...cssVariables,
        fill: `var(--hover-color, ${style.color})`,
        cursor: computedCursor,
        outline,
      },
      role: computedRole,
      tabIndex: computedTabIndex,
      onClick,
      disabled,
      onMouseDown: (e) => {
        setOutline('none');
        onMouseDown?.(e);
      },
      onBlur: (e) => {
        if (outline) {
          setOutline(undefined);
        }
        onBlur?.(e);
      },
      onKeyDown:
        onKeyDown ||
        ((event: React.KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.stopPropagation();
            (event.target as HTMLElement).click();
          }
        }),
      ...otherProps,
    },
    [children]
  );
});
