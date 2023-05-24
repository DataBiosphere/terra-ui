import _ from 'lodash/fp';
import { useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { forwardRefWithName } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

const allowedHoverVariables = ['background', 'backgroundColor', 'border', 'color', 'boxShadow', 'opacity', 'textDecoration'];
const pointerTags = ['button', 'area', 'a', 'select'];
const pointerTypes = ['radio', 'checkbox', 'submit', 'button'];

const Interactive = forwardRefWithName(
  'Interactive',
  (
    { className = '', as, type, role, onClick, onKeyDown, onMouseDown, onBlur, disabled, children, tabIndex, hover = {}, style = {}, ...props },
    ref
  ) => {
    const [outline, setOutline] = useState(undefined);
    const { cursor } = style;

    const computedCursor = Utils.cond(
      [cursor, () => cursor],
      [disabled, () => undefined],
      [onClick || pointerTags.includes(as) || pointerTypes.includes(type), () => 'pointer']
    );

    const computedTabIndex = Utils.cond([_.isNumber(tabIndex), () => tabIndex], [disabled, () => -1], [onClick, () => 0], () => undefined);

    const computedRole = Utils.cond([role, () => role], [onClick && !['input', ...pointerTags].includes(as), () => 'button'], () => undefined);

    const cssVariables = _.flow(
      _.toPairs,
      _.flatMap(([key, value]) => {
        console.assert(allowedHoverVariables.includes(key), `${key} needs to be added to the hover-style in style.css for the style to be applied`);
        return [
          [`--app-hover-${key}`, value],
          [key, `var(--hover-${key}, ${style[key]})`],
        ];
      }),
      _.fromPairs
    )(hover);

    return h(
      as,
      {
        ref,
        className: `hover-style ${className}`,
        style: { ...style, ...cssVariables, cursor: computedCursor, outline },
        onKeyDown:
          onKeyDown ||
          ((e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.target.click();
            }
          }),
        onClick,
        disabled,
        role: computedRole,
        tabIndex: computedTabIndex,
        onMouseDown: (e) => {
          setOutline('none');
          onMouseDown && onMouseDown(e);
        },
        onBlur: (e) => {
          !!outline && setOutline(undefined);
          onBlur && onBlur(e);
        },
        ...props,
      },
      [children]
    );
  }
);

export default Interactive;
