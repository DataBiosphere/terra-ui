import _ from 'lodash/fp';
import { createElement, forwardRef, ReactNode, useState } from 'react';

import * as Utils from './utils';

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
          `${key} needs to be added to the hover-style in style.css for the style to be applied`
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
        className: `hover-style ${className}`,
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
