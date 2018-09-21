import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, input, label, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import RSelect from 'react-select'
import { centeredSpinner, icon } from 'src/components/icons'
import TooltipTrigger from 'src/components/TooltipTrigger'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


const styles = {
  button: {
    display: 'inline-flex', justifyContent: 'space-around', alignItems: 'center', height: '2.25rem',
    fontWeight: 500, fontSize: 14, textTransform: 'uppercase', whiteSpace: 'nowrap',
    userSelect: 'none'
  }
}

export const Clickable = ({ as = 'div', disabled, tooltip, tooltipSide, onClick, children, ...props }) => {
  const child = h(Interactive, _.merge({
    as, disabled,
    onClick: (...args) => onClick && !disabled && onClick(...args)
  }, props), [children])

  if (tooltip) {
    return h(TooltipTrigger, { content: tooltip, side: tooltipSide }, [child])
  } else {
    return child
  }
}

const linkProps = disabled => ({
  as: 'a',
  style: {
    color: disabled ? colors.gray[2] : colors.blue[0],
    cursor: disabled ? 'not-allowed' : 'pointer'
  },
  hover: disabled ? undefined : { color: colors.blue[1] }
})

export const link = function(props, children) {
  return h(Interactive,
    _.merge(linkProps(props.disabled), props),
    children)
}

export const linkButton = (props, children) => {
  return h(Clickable,
    _.merge(linkProps(props.disabled), props),
    children)
}

export const buttonPrimary = ({ disabled, ...props }, children) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      ...styles.button,
      borderRadius: 5, color: 'white', padding: '0 1.5rem',
      backgroundColor: disabled ? colors.gray[2] : colors.blue[0],
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { backgroundColor: colors.blue[1] }
  }, props), children)
}

export const buttonSecondary = ({ disabled, ...props }, children) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      ...styles.button,
      color: disabled ? colors.gray[2] : colors.gray[0],
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { color: colors.gray[1] }
  }, props), children)
}

export const search = function({ wrapperProps, inputProps }) {
  return div(
    _.merge({ style: { borderBottom: '1px solid black', padding: '0.5rem 0', display: 'flex' } },
      wrapperProps),
    [
      icon('search', { size: 21 }),
      input(_.merge({
        style: {
          border: 'none', outline: 'none',
          flexGrow: 1,
          verticalAlign: 'bottom', marginLeft: '1rem',
          fontSize: '1rem'
        }
      }, inputProps))
    ])
}

export const contextBar = function(props, children) {
  return div(_.merge({
    style: {
      display: 'flex', alignItems: 'center', backgroundColor: colors.blue[1],
      color: colors.gray[3], fontWeight: 500,
      height: '3.75rem', padding: '0 1rem'
    }
  }, props),
  children)
}

export const MenuButton = ({ disabled, children, ...props }) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      display: 'flex', alignItems: 'center',
      fontSize: 12, minWidth: 125, height: '2rem',
      color: disabled ? colors.gray[2] : colors.gray[0],
      padding: '0 1.5rem',
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: !disabled ? { backgroundColor: colors.blue[3], fontWeight: 500 } : undefined
  }, props), [children])
}

export const Checkbox = ({ checked, onChange, disabled, ...props }) => {
  return h(Interactive, {
    as: 'span',
    role: 'checkbox',
    'aria-checked': checked,
    onClick: () => onChange && !disabled && onChange(!checked),
    style: {
      display: 'inline-flex',
      verticalAlign: 'middle',
      color: disabled ? colors.gray[2] : colors.blue[0]
    },
    hover: disabled ? undefined : { color: colors.blue[1] },
    active: disabled ? undefined : { backgroundColor: colors.blue[5] },
    disabled,
    ...props
  }, [
    icon(checked ? 'checkSquare' : 'square', { size: 16 })
  ])
}

export const LabeledCheckbox = ({ checked, onChange, disabled, children, ...props }) => {
  return h(Fragment, [
    h(Checkbox, { checked, onChange, disabled, ...props }),
    h(Interactive, {
      as: 'span',
      style: { verticalAlign: 'middle' },
      onClick: () => onChange && !disabled && onChange(!checked)
    }, [children])
  ])
}

export const RadioButton = ({ text, labelStyle, ...props }) => {
  const id = `${text}-radio-button`

  return h(Fragment, [
    input({
      type: 'radio', id,
      name: id, // not semantically correct, but fixes a focus cycle issue
      ...props
    }),
    label({ htmlFor: id, style: labelStyle }, text)
  ])
}

export const pageColumn = function(title, flex, contents) {
  return div(
    { style: { flex, overflow: 'hidden', margin: '3rem' } },
    [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } },
        title
      ),
      contents
    ])
}

export const spinnerOverlay = div(
  {
    style: {
      position: 'absolute',
      display: 'flex', alignItems: 'center',
      top: 0, right: 0, bottom: 0, left: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    }
  }, [
    centeredSpinner({
      size: 64,
      style: { backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '1rem', borderRadius: '0.5rem' }
    })
  ]
)

export const comingSoon = span({
  style: {
    margin: '0.5rem', padding: 3, borderRadius: 2,
    backgroundColor: colors.purple[0], color: 'white',
    fontSize: '75%', textTransform: 'uppercase', fontWeight: 500,
    whiteSpace: 'nowrap', lineHeight: 1
  }
}, ['coming soon'])

export const Select = ({ value, options, ...props }) => {
  const newOptions = options && !_.isObject(options[0]) ? _.map(value => ({ value }), options) : options
  const findValue = target => _.find({ value: target }, newOptions)
  const newValue = props.isMulti ? _.map(findValue, value) : findValue(value)

  return h(RSelect, _.merge({
    styles: {
      control: (base, { isDisabled, isFocused }) => _.merge(base, {
        minHeight: 36,
        backgroundColor: isDisabled ? colors.gray[5] : 'white',
        borderColor: isFocused ? colors.blue[0] : undefined,
        boxShadow: 'none',
        '&:hover': { borderColor: isFocused ? colors.blue[0] : undefined }
      }),
      singleValue: base => ({ ...base, color: colors.gray[0] }),
      option: (base, { isSelected, isFocused, isDisabled }) => _.merge(base, {
        backgroundColor: isSelected ? colors.blue[4] : isFocused ? colors.blue[5] : undefined,
        color: isDisabled ? undefined : colors.gray[0],
        ':active': { backgroundColor: isSelected ? colors.blue[4] : colors.blue[5] }
      }),
      clearIndicator: base => ({ ...base, paddingRight: 0 }),
      indicatorSeparator: () => ({ display: 'none' }),
      dropdownIndicator: base => _.merge(base, { paddingLeft: props.isClearable ? 0 : undefined }),
      multiValueRemove: base => _.merge(base, { ':hover': { backgroundColor: 'unset' } })
    },
    getOptionLabel: ({ value, label }) => label || value.toString(),
    value: newValue,
    options: newOptions
  }, props))
}
export const FadeBox = ({ fadePoint = '60%', style = {}, children }) => {
  const {
    paddingTop = '1.5rem',
    paddingLR = '1.5rem',
    borderRadius = '8px',
    backgroundColor = colors.gray[5],
    borderColor = colors.gray[3],
    ...containerStyle
  } = style
  return div({
    style: {
      background: `linear-gradient(to bottom, white 0%, ${backgroundColor} ${fadePoint}`,
      borderRadius: `${borderRadius} ${borderRadius} 0 0`,
      ...containerStyle
    }
  }, [
    div({
      style: {
        height: paddingTop,
        border: `1px solid ${borderColor}`,
        borderBottom: 'none',
        borderRadius: `${borderRadius} ${borderRadius} 0 0`
      }
    }),
    div({
      style: {
        padding: `0 ${paddingLR}`,
        borderWidth: 1,
        borderStyle: 'solid',
        borderImage: `linear-gradient(to bottom, ${borderColor}, ${backgroundColor} ${fadePoint}) 1 100%`,
        borderTop: 'none',
        borderBottom: 'none'
      }
    }, [children])
  ])
}

export const PageFadeBox = ({ children }) => {
  return h(FadeBox, {
    fadePoint: '125px',
    style: {
      margin: '1.5rem', paddingTop: '1rem'
    }
  }, [children])
}

const viewToggleStyles = {
  toolbarContainer: {
    flex: 'none', display: 'flex'
  },
  toolbarButton: active => ({
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderRadius: 3, border: `1px solid ${colors.blue[0]}`,
    height: '2.25rem', padding: '0 .75rem',
    color: colors.blue[0],
    backgroundColor: active ? colors.blue[4] : 'white',
    fontWeight: active ? 'bold' : 'normal'
  })
}

export const viewToggleButtons = (listView, setListView) => {
  return div({ style: viewToggleStyles.toolbarContainer }, [
    h(Clickable, {
      style: { marginLeft: 'auto', ...viewToggleStyles.toolbarButton(!listView) },
      onClick: () => setListView(false)
    }, [icon('view-cards', { size: 24, style: { margin: '.3rem' } }), 'Cards']),
    h(Clickable, {
      style: { marginLeft: '1rem', ...viewToggleStyles.toolbarButton(listView) },
      onClick: () => setListView(true)
    }, [icon('view-list', { size: 24, style: { margin: '.3rem' } }), 'List'])
  ])
}
