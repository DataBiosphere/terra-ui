import _ from 'lodash/fp';
import { ReactNode } from 'react';
import RSelect, {
  components as RSelectComponents,
  GroupBase as RSelectGroupBase,
  MultiValue as RSelectMultiValue,
  Props as RSelectProps,
  PropsValue as RSelectPropsValue,
  SingleValue as RSelectSingleValue,
} from 'react-select';
import RAsyncCreatableSelect, { AsyncCreatableProps as RAsyncCreatableProps } from 'react-select/async-creatable';
import RCreatableSelect from 'react-select/creatable';

import { useUniqueId } from './hooks/useUniqueId';
import { Icon } from './Icon';
import { EnrichedTheme, useThemeFromContext } from './theme';

const getCommonSelectProps = ({ colors }: EnrichedTheme): Partial<RSelectProps> => ({
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
    Option: ({ children, selectProps, ...props }) => (
      <RSelectComponents.Option
        {..._.merge(props, {
          selectProps,
          innerProps: {
            role: 'option',
            'aria-selected': props.isSelected,
          },
        })}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 25,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflowWrap: 'break-word',
            }}
          >
            {children}
          </div>
          {props.isSelected && (
            <Icon icon='check' size={14} style={{ flex: 'none', marginLeft: '0.5rem', color: colors.dark(0.5) }} />
          )}
        </div>
      </RSelectComponents.Option>
    ),
    Menu: ({ children, selectProps, ...props }) => (
      <RSelectComponents.Menu
        {..._.merge(props, {
          selectProps,
          innerProps: {
            role: 'listbox',
            'aria-label': 'Options',
            'aria-multiselectable': selectProps.isMulti,
          },
        })}
      >
        {children}
      </RSelectComponents.Menu>
    ),
  },
});

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
export const BaseSelect = <
  Value,
  Option extends { value: Value; label?: string | undefined },
  IsMulti extends boolean,
  Group extends RSelectGroupBase<Option>
>(
  props: BaseSelectProps<Value, Option, IsMulti, Group>
): ReactNode => {
  const { findValue, id, value, ...otherProps } = props;

  const theme = useThemeFromContext();

  const newValue: RSelectPropsValue<Option> = otherProps.isMulti
    ? _.compact(_.map(findValue, value as Value[]))
    : findValue(value as Value);
  const myId = useUniqueId();
  const inputId = id || myId;

  const formatGroupLabel = (group: { label?: string }): ReactNode => {
    return (
      <div
        style={{
          color: theme.colors.dark(),
          fontSize: 14,
          height: 30,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.colors.dark(0.25)}`,
        }}
      >
        {group.label}
      </div>
    );
  };

  const ParameterizedRSelect = RSelect as typeof RSelect<Option, IsMulti, Group>;

  return (
    <ParameterizedRSelect
      {..._.merge(
        {
          inputId,
          ...getCommonSelectProps(theme),
          getOptionLabel: ({ value, label }: Option) => label || `${value}`,
          value: newValue || null, // need null instead of undefined to clear the select
          formatGroupLabel,
        },
        otherProps
      )}
    />
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
 * @param [props.isSearchable] - whether the select can be searched
 * @param [props.isMulti] - whether the select is multiselect or not
 * @param [props.menuPlacement] - determines where the menu is placed
 * @param [props.placeholder] - The placeholder value for the select
 * @param [props.styles] - custom styling for the select
 */
export const Select = <
  Value,
  IsMulti extends boolean = false,
  Option extends { value: Value; label?: string | undefined } = { value: Value; label: string | undefined }
>(
  props: SelectProps<Value, IsMulti, Option>
) => {
  const { options = [], value, ...otherProps } = props;

  // Allows passing options as a list of values instead of options objects.
  // For example:
  // options: ['foo', 'bar']
  // instead of:
  // options: [{ value: 'foo' }, { value: 'bar' }]
  //
  // Cast as Options[] is because TS can't figure out how the `!_isObject(options[0])` condition affects the type of newOptions.
  const newOptions = (
    options && !_.isObject(options[0]) ? _.map((value) => ({ value }), options) : options
  ) as Option[];

  const findValue = (target: Value): Option | null => {
    const foundOption = _.find({ value: target }, newOptions) as Option | undefined;
    return foundOption || null;
  };

  const ParameterizedBaseSelect = BaseSelect as typeof BaseSelect<Value, Option, IsMulti, never>;
  return <ParameterizedBaseSelect findValue={findValue} value={value} options={newOptions} {...otherProps} />;
};

export type GroupedSelectProps<
  Value,
  IsMulti extends boolean,
  Option extends { value: Value; label?: string | undefined },
  Group extends RSelectGroupBase<Option>
> = Omit<BaseSelectProps<Value, Option, IsMulti, Group>, 'findValue' | 'options'> & {
  options: Group[];
};

/**
 * @param props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of an inner options object
 * @param props.options - an object with toplevel pairs of label:options where label is a group label and options is an array of objects containing value:label pairs
 * @param [props.id] - The HTML ID to give the form element
 */
export const GroupedSelect = <
  Value,
  IsMulti extends boolean = false,
  Option extends { value: Value; label?: string | undefined } = { value: Value; label?: string | undefined },
  Group extends RSelectGroupBase<Option> = RSelectGroupBase<Option>
>({
  value,
  options = [],
  ...props
}: GroupedSelectProps<Value, IsMulti, Option, Group>) => {
  // cast because types don't carry through Lodash
  const flattenedOptions = _.flatMap('options', options) as Option[];
  const findValue = (target: Value) => (_.find({ value: target }, flattenedOptions) || null) as Option | null;

  const ParameterizedBaseSelect = BaseSelect as typeof BaseSelect<Value, Option, IsMulti, Group>;
  return <ParameterizedBaseSelect findValue={findValue} value={value} options={options} {...props} />;
};

export const AsyncCreatableSelect = <
  Option,
  IsMulti extends boolean = false,
  Group extends RSelectGroupBase<Option> = RSelectGroupBase<Option>
>(
  props: RAsyncCreatableProps<Option, IsMulti, Group>
) => {
  const theme = useThemeFromContext();
  return (
    <RAsyncCreatableSelect
      {...(_.merge(getCommonSelectProps(theme), props) as RAsyncCreatableProps<Option, IsMulti, Group>)}
    />
  );
};

export const CreatableSelect = (props: any) => {
  const theme = useThemeFromContext();
  return <RCreatableSelect {..._.merge(getCommonSelectProps(theme), props)} />;
};
