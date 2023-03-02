import _ from 'lodash/fp'
import { Children, useCallback, useEffect, useRef } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import RSelect, { components as RSelectComponents } from 'react-select'
import RAsyncCreatableSelect from 'react-select/async-creatable'
import { AutoSizer, List } from 'react-virtualized'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { useLabelAssert, useOnMount, useUniqueId } from 'src/libs/react-utils'


const commonSelectProps = {
  theme: base => _.merge(base, {
    colors: {
      primary: colors.accent(),
      neutral20: colors.dark(0.55),
      neutral30: colors.dark(0.55)
    },
    spacing: { controlHeight: 36 }
  }),
  styles: {
    control: (base, { isDisabled }) => _.merge(base, {
      backgroundColor: isDisabled ? colors.dark(0.25) : 'white',
      boxShadow: 'none'
    }),
    singleValue: base => ({ ...base, color: colors.dark() }),
    option: (base, { isSelected, isFocused, isDisabled }) => _.merge(base, {
      fontWeight: isSelected ? 600 : undefined,
      backgroundColor: isFocused ? colors.dark(0.15) : 'white',
      color: isDisabled ? undefined : colors.dark(),
      ':active': { backgroundColor: colors.accent(isSelected ? 0.55 : 0.4) }
    }),
    clearIndicator: base => ({ ...base, paddingRight: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, { selectProps: { isClearable } }) => _.merge(base, { paddingLeft: isClearable ? 0 : undefined }),
    multiValueLabel: base => ({ ...base, maxWidth: '100%' }),
    multiValueRemove: base => _.merge(base, { ':hover': { backgroundColor: 'unset' } }),
    placeholder: base => ({ ...base, color: colors.dark(0.8) })
  },
  components: {
    Option: ({ children, selectProps, ...props }) => h(RSelectComponents.Option, _.merge(props, {
      selectProps,
      innerProps: {
        role: 'option',
        'aria-selected': props.isSelected
      }
    }), [
      div({ style: { display: 'flex', alignItems: 'center', minHeight: 25 } }, [
        div({ style: { flex: 1, minWidth: 0, overflowWrap: 'break-word' } }, [children]),
        props.isSelected && icon('check', { size: 14, style: { flex: 'none', marginLeft: '0.5rem', color: colors.dark(0.5) } })
      ])
    ]),
    Menu: ({ children, selectProps, ...props }) => h(RSelectComponents.Menu, _.merge(props, {
      selectProps,
      innerProps: {
        role: 'listbox',
        'aria-label': 'Options',
        'aria-multiselectable': selectProps.isMulti
      }
    }), [children])
  }
}

const formatGroupLabel = group => (
  div({
    style: {
      color: colors.dark(),
      fontSize: 14,
      height: 30,
      fontWeight: 600,
      borderBottom: `1px solid ${colors.dark(0.25)}`
    }
  }, [group.label]))

const BaseSelect = ({ value, newOptions, id, findValue, ...props }) => {
  const newValue = props.isMulti ? _.map(findValue, value) : findValue(value)
  const myId = useUniqueId()
  const inputId = id || myId

  return h(RSelect, _.merge({
    inputId,
    ...commonSelectProps,
    getOptionLabel: ({ value, label }) => label || value.toString(),
    value: newValue || null, // need null instead of undefined to clear the select
    options: newOptions,
    formatGroupLabel
  }, props))
}

/**
 * @param {Object} props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of options
 * @param {Array} props.options - can be of any type; if objects, they should each contain a value and label, unless defining getOptionLabel
 * @param {string} [props.placeholder] - The placeholder value for the select
 * @param {Function} props.onChange - The function to call when a user makes a selection
 * @param {boolean} [props.isClearable] - whether the select can be cleared
 * @param {boolean} [props.isSearchable] - whether the select can be cleared
 * @param {boolean} [props.isMulti] - whether the select is multiselect or not
 * @param {string} [props.menuPlacement] - determines where the menu is placed
 * @param {Object} [props.styles] - custom styling for the select
 * @param {boolean} [props.isDisabled] - whether the select is disabled
 * @param {Function} [props.getOptionLabel] - a function to custom style the options
 * @param props.id - The HTML ID to give the form element
 */
export const Select = ({ value, options, ...props }) => {
  useLabelAssert('Select', { ...props, allowId: true })

  const newOptions = options && !_.isObject(options[0]) ? _.map(value => ({ value }), options) : options
  const findValue = target => _.find({ value: target }, newOptions)

  return h(BaseSelect, { value, newOptions, findValue, ...props })
}

/**
 * @param {Object} props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of an inner options object
 * @param {Array} props.options - an object with toplevel pairs of label:options where label is a group label and options is an array of objects containing value:label pairs
 * @param props.id - The HTML ID to give the form element
 */
export const GroupedSelect = ({ value, options, ...props }) => {
  useLabelAssert('GroupedSelect', { ...props, allowId: true })

  const flattenedOptions = _.flatMap('options', options)
  const findValue = target => _.find({ value: target }, flattenedOptions)

  return h(BaseSelect, { value, newOptions: options, findValue, ...props })
}

export const AsyncCreatableSelect = props => {
  return h(RAsyncCreatableSelect, {
    ...commonSelectProps,
    ...props
  })
}

const VirtualizedMenuList = props => {
  const { children, focusedOption, getStyles, getValue, maxHeight } = props

  const list = useRef()

  const scrollToOptionForValue = useCallback(value => {
    const renderedOptions = Children.map(children, child => child.props.data)
    const valueIndex = renderedOptions.findIndex(opt => opt.value === value)
    if (valueIndex !== -1) {
      list.current.scrollToRow(valueIndex)
    }
  }, [children])

  // Scroll to the currently selected value (if there is one) when the menu is opened.
  useOnMount(() => {
    const [selectedOption] = getValue()
    if (selectedOption) {
      scrollToOptionForValue(selectedOption.value)
    }
  })

  // When navigating option with arrow keys, scroll the virtualized list so that the focused option is visible.
  useEffect(() => {
    if (focusedOption) {
      scrollToOptionForValue(focusedOption.value)
    }
  }, [children, focusedOption]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasRenderedOptions = Array.isArray(children)

  // If no options are rendered, then render the "no options" message.
  if (!hasRenderedOptions) {
    return children
  }

  const rowCount = children.length
  const rowHeight = 40
  const height = _.clamp(rowHeight, maxHeight, rowHeight * rowCount)

  return h(AutoSizer, { disableHeight: true }, [
    ({ width }) => {
      return h(List, {
        ref: list,
        height,
        width,
        rowCount,
        rowHeight,
        rowRenderer: ({ index, style, key }) => div({ key, style }, [children[index]]),
        style: { ...getStyles('menuList', props), boxSizing: 'content-box' },
      })
    }
  ])
}

export const VirtualizedSelect = props => {
  return h(Select, _.merge({
    // react-select performs poorly when it has to render hundreds or thousands of options.
    // This can happen for example in a workspace menu if the user has many workspaces.
    // To address that, this component virtualizes the list of options.
    // See https://broadworkbench.atlassian.net/browse/SUP-808 for more information.
    components: { MenuList: VirtualizedMenuList },
  }, props))
}
