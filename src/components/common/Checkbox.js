import _ from 'lodash/fp';
import { Fragment } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import Interactive from 'src/components/Interactive';
import colors from 'src/libs/colors';
import { useLabelAssert } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

import { IdContainer } from './IdContainer';

export const Checkbox = ({ checked, onChange, disabled = false, ...props }) => {
  useLabelAssert('Checkbox', { ...props, allowId: true });
  return h(
    Interactive,
    _.merge(
      {
        as: 'span',
        className: 'fa-layers fa-fw',
        role: 'checkbox',
        'aria-checked': checked,
        onClick: () => !disabled && onChange?.(!checked),
        style: { verticalAlign: 'middle' },
        disabled,
      },
      props
    ),
    [
      icon('squareSolid', { style: { color: Utils.cond([disabled, () => colors.light(1.2)], [checked, () => colors.accent()], () => 'white') } }), // bg
      !disabled && icon('squareLight', { style: { color: checked ? colors.accent(1.2) : colors.dark(0.75) } }), // border
      checked && icon('check', { size: 8, style: { color: disabled ? colors.dark(0.75) : 'white' } }), // check
    ]
  );
};

export const LabeledCheckbox = ({ checked, onChange, disabled, children, ...props }) => {
  return h(IdContainer, [
    (id) =>
      h(Fragment, [
        h(Checkbox, { checked, onChange, disabled, 'aria-labelledby': id, ...props }),
        span(
          {
            id,
            style: {
              verticalAlign: 'middle',
              color: disabled ? colors.dark(0.8) : undefined,
              cursor: disabled ? 'default' : 'pointer',
            },
            onClick: () => !disabled && onChange?.(!checked),
            disabled,
          },
          [children]
        ),
      ]),
  ]);
};
