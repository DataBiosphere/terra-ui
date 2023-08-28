import _ from 'lodash/fp';
import { createElement, forwardRef, ReactNode, useState } from 'react';

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
];
const pointerTags = ['button', 'area', 'a', 'select'];
const pointerTypes = ['radio', 'checkbox', 'submit', 'button'];

export type InteractiveProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  hover?: React.CSSProperties;
  role?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  tagName?: keyof JSX.IntrinsicElements;
  type?: string;
  onBlur?: (event: any) => void;
  onClick?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onMouseDown?: (event: any) => void;
};

export const Interactive: React.ForwardRefExoticComponent<InteractiveProps> = forwardRef(
  (
    {
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
      ...props
    },
    ref
  ) => {
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

    const cssVariables = _.flow(
      _.toPairs,
      _.flatMap(([key, value]) => {
        console.assert(
          allowedHoverVariables.includes(key),
          `${key} needs to be added to the .terra-ui--interactive CSS for the style to be applied`
        );
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
          if (onMouseDown) {
            onMouseDown(e);
          }
        },
        onBlur: (e) => {
          if (outline) {
            setOutline(undefined);
          }
          if (onBlur) {
            onBlur(e);
          }
        },
        onKeyDown:
          onKeyDown ||
          ((event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
              event.stopPropagation();
              (event.target as HTMLElement).click();
            }
          }),
        ...props,
      },
      [children]
    );
  }
);
