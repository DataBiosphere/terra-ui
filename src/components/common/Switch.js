import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import RSwitch from 'react-switch';
import colors from 'src/libs/colors';
import { forwardRefWithName } from 'src/libs/react-utils';

const SwitchLabel = ({ isOn, onLabel, offLabel }) =>
  div(
    {
      style: {
        display: 'flex',
        justifyContent: isOn ? 'flex-start' : 'flex-end',
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
        height: '100%',
        lineHeight: '28px',
        ...(isOn ? { marginLeft: '0.75rem' } : { marginRight: '0.5rem' }),
      },
    },
    [isOn ? onLabel : offLabel]
  );

export const Switch = forwardRefWithName('Switch', ({ onChange, onLabel = 'True', offLabel = 'False', ...props }, ref) => {
  return h(RSwitch, {
    onChange: (value) => onChange(value),
    offColor: colors.dark(0.5),
    onColor: colors.success(1.2),
    checkedIcon: h(SwitchLabel, { isOn: true, onLabel, offLabel }),
    uncheckedIcon: h(SwitchLabel, { isOn: false, onLabel, offLabel }),
    width: 80,
    ...props,
    ref: (rSwitch) => {
      const inputEl = rSwitch ? rSwitch.$inputRef : null;
      if (_.has('current', ref)) {
        ref.current = inputEl;
      } else if (_.isFunction(ref)) {
        ref(inputEl);
      }
    },
  });
});
