import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import RSelect, {
  components as RSelectComponents,
  GroupBase as RSelectGroupBase,
  MultiValue as RSelectMultiValue,
  Props as RSelectProps,
  PropsValue as RSelectPropsValue,
  SingleValue as RSelectSingleValue,
} from 'react-select';

import { useUniqueId } from './hooks/useUniqueId';
import { icon } from './icon';
import { useThemeFromContext } from './theme';

let colors: any;

const commonSelectProps: Partial<RSelectProps> = {
  theme: (base) =>
    _.merge(base, {
      colors: {
        primary: colors.accent(),
        neutral20: colors.dark(0.55),
        neutral30: colors.dark(0.55),
      },
      spacing: { controlHeight: 36 },
    }),
  styles: {
    control: (base, { isDisabled }) =>
      _.merge(base, {
        backgroundColor: isDisabled ? colors.dark(0.25) : 'white',
        boxShadow: 'none',
      }),
    singleValue: (base) => ({ ...base, color: colors.dark() }),
    option: (base, { isSelected, isFocused, isDisabled }) =>
      _.merge(base, {
        fontWeight: isSelected ? 600 : undefined,
        backgroundColor: isFocused ? colors.dark(0.15) : 'white',
        color: isDisabled ? undefined : colors.dark(),
        ':active': { backgroundColor: colors.accent(isSelected ? 0.55 : 0.4) },
      }),
    clearIndicator: (base) => ({ ...base, paddingRight: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, { selectProps: { isClearable } }) =>
      _.merge(base, { paddingLeft: isClearable ? 0 : undefined }),
    multiValueLabel: (base) => ({ ...base, maxWidth: '100%' }),
    multiValueRemove: (base) => _.merge(base, { ':hover': { backgroundColor: 'unset' } }),
    placeholder: (base) => ({ ...base, color: colors.dark(0.8) }),
  },
  components: {
    Option: ({ children, selectProps, ...props }) =>
      h(
        RSelectComponents.Option,
        _.merge(props, {
          selectProps,
          innerProps: {
            role: 'option',
            'aria-selected': props.isSelected,
          },
        }),
        [
          div({ style: { display: 'flex', alignItems: 'center', minHeight: 25 } }, [
            div({ style: { flex: 1, minWidth: 0, overflowWrap: 'break-word' } }, [children]),
            props.isSelected &&
              icon('check', { size: 14, style: { flex: 'none', marginLeft: '0.5rem', color: colors.dark(0.5) } }),
          ]),
        ]
      ),
    Menu: ({ children, selectProps, ...props }) =>
      h(
        RSelectComponents.Menu,
        _.merge(props, {
          selectProps,
          innerProps: {
            role: 'listbox',
            'aria-label': 'Options',
            'aria-multiselectable': selectProps.isMulti,
          },
        }),
        [children]
      ),
  },
};

const formatGroupLabel = (group: { label?: string }) =>
  div(
    {
      style: {
        color: colors.dark(),
        fontSize: 14,
        height: 30,
        fontWeight: 600,
        borderBottom: `1px solid ${colors.dark(0.25)}`,
      },
    },
    [group.label]
  );

type BaseSelectProps<
  Value,
  Option extends { value: Value; label?: string | undefined },
  IsMulti extends boolean,
  Group extends RSelectGroupBase<Option>
> = Omit<RSelectProps<Option, IsMulti, Group>, 'getOptionLabel' | 'value'> & {
  findValue: (value: Value) => Option | null;
  // react-select requires getOptionLabel. We provide a default, so it's optional.
  getOptionLabel?: (option: Option) => string;
  // react-select's type for value does not take IsMulti into account.
  value: IsMulti extends true ? RSelectMultiValue<Value> : RSelectSingleValue<Value>;
};

/**
 * Wraps RSelect.
 *
 * Provides defaults for formatGroupLabel, getOptionLabel, and inputId.
 *
 * Also (via findValue) allows passing value as the selected value instead of the selected option.
 * For example:
 * const options = [{ value: 'foo' }, { value: 'bar' }]
 * h(BaseSelect, { options, value: 'foo' })
 * instead of:
 * const options = [{ value: 'foo' }, { value: 'bar' }]
 * h(BaseSelect, { options, value: options[0] })
 */
const BaseSelect = <
  Value,
  Option extends { value: Value; label?: string | undefined },
  IsMulti extends boolean,
  Group extends RSelectGroupBase<Option>
>({
  value,
  id,
  findValue,
  ...props
}: BaseSelectProps<Value, Option, IsMulti, Group>) => {
  const newValue: RSelectPropsValue<Option> = props.isMulti
    ? _.compact(_.map(findValue, value as Value[]))
    : findValue(value as Value);
  const myId = useUniqueId();
  const inputId = id || myId;

  const ParameterizedRSelect = RSelect as typeof RSelect<Option, IsMulti, Group>;
  return h(
    ParameterizedRSelect,
    _.merge(
      {
        inputId,
        ...commonSelectProps,
        getOptionLabel: ({ value, label }) => label || value.toString(),
        value: newValue || null, // need null instead of undefined to clear the select
        formatGroupLabel,
      },
      props
    )
  );
};

export type SelectProps<
  Value,
  IsMulti extends boolean,
  Option extends { value: Value; label?: string | undefined }
> = Omit<BaseSelectProps<Value, Option, IsMulti, never>, 'findValue' | 'options'> & {
  options: (Value | Option)[];
};

/**
 * @param props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of options
 * @param props.options - can be of any type; if objects, they should each contain a value and label, unless defining getOptionLabel
 * @param props.onChange - The function to call when a user makes a selection
 * @param [props.getOptionLabel] - a function to custom style the options
 * @param [props.id] - The HTML ID to give the form element
 * @param [props.isClearable] - whether the select can be cleared
 * @param [props.isDisabled] - whether the select is disabled
 * @param [props.isSearchable] - whether the select can be cleared
 * @param [props.isMulti] - whether the select is multiselect or not
 * @param [props.menuPlacement] - determines where the menu is placed
 * @param [props.placeholder] - The placeholder value for the select
 * @param [props.styles] - custom styling for the select
 */
export const Select = <
  Value,
  IsMulti extends boolean = false,
  Option extends { value: Value; label?: string | undefined } = { value: Value; label: string | undefined }
>({
  value,
  options = [],
  ...props
}: SelectProps<Value, IsMulti, Option>) => {
  colors = useThemeFromContext().colors;
  // Allows passing options as list of values instead of options objects.
  // For example:
  // options: ['foo', 'bar']
  // instead of:
  // options: [{ value: 'foo' }, { value: 'bar' }]
  //
  // Cast as Options[] is because TS can't figure out how the `!_isObject(options[0])` condition affects the type of newOptions.
  const newOptions = (
    options && !_.isObject(options[0]) ? _.map((value) => ({ value }), options) : options
  ) as Option[];

  const findValue = (target: Value) => (_.find({ value: target }, newOptions) || null) as Option | null;

  const ParameterizedBaseSelect = BaseSelect as typeof BaseSelect<Value, Option, IsMulti, never>;
  return h(ParameterizedBaseSelect, { value, options: newOptions, findValue, ...props });
};
