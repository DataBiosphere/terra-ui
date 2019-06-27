import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import { div, h, img, input, label, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import RSelect from 'react-select'
import RAsyncCreatableSelect from 'react-select/lib/AsyncCreatable'
import { centeredSpinner, icon } from 'src/components/icons'
import TooltipTrigger from 'src/components/TooltipTrigger'
import hexButton from 'src/images/hex-button.svg'
import scienceBackground from 'src/images/science-background.jpg'
import colors from 'src/libs/colors'
import { getConfig, isTerra } from 'src/libs/config'
import { returnParam } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


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

const linkProps = ({ disabled, variant }) => ({
  as: 'a',
  style: {
    color: disabled ? colors.dark(0.7) : colors.accent(variant === 'light' ? 0.3 : 1),
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500
  },
  hover: disabled ? undefined : { color: colors.accent(variant === 'light' ? 0.1 : 0.8) }
})

export const link = ({ onClick, href, disabled, variant, ...props }, children) => {
  return h(Interactive,
    _.merge(linkProps({ disabled, variant }), {
      href, disabled,
      onClick: href && onClick ? e => {
        e.preventDefault()
        onClick(e)
      } : onClick,
      ...props
    }),
    children)
}

export const linkButton = ({ disabled, variant, ...props }, children) => {
  return h(Clickable,
    _.merge(linkProps({ disabled, variant }), { disabled, ...props }),
    children)
}

export const buttonPrimary = ({ disabled, ...props }, children) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      ...styles.button,
      border: `1px solid ${disabled ? colors.dark(0.4) : colors.accent(1.2)}`,
      borderRadius: 5, color: 'white', padding: '0.875rem',
      backgroundColor: disabled ? colors.dark(0.25) : colors.accent(),
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { backgroundColor: colors.accent(0.85) }
  }, props), children)
}

export const buttonSecondary = ({ disabled, ...props }, children) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      ...styles.button,
      color: disabled ? colors.dark(0.7) : colors.accent(),
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { color: colors.accent(0.8) }
  }, props), children)
}

export const buttonOutline = ({ disabled, ...props }, children) => {
  return h(buttonPrimary, _.merge({
    style: {
      border: `1px solid ${disabled ? colors.dark(0.4) : colors.accent()}`,
      color: colors.accent(),
      backgroundColor: disabled ? colors.dark(0.25) : 'white'
    },
    hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) }
  }, props), children)
}

export const iconButton = (shape, { disabled, size, iconProps = {}, ...props } = {}) => linkButton(
  _.merge({
    as: 'span',
    disabled,
    style: {
      height: size, width: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: disabled ? colors.dark(0.15) : colors.accent(),
      ...(isTerra() ?
        { mask: `url(${hexButton}) center no-repeat`, WebkitMask: `url(${hexButton}) center no-repeat` } :
        { borderRadius: '1rem' })
    }
  }, props),
  [icon(shape, _.merge({ style: { color: disabled ? colors.dark() : 'white' } }, iconProps))]
)

export const tabBar = ({ activeTab, tabNames, refresh = _.noop, getHref }, children = []) => {
  const navTab = currentTab => {
    const selected = currentTab === activeTab
    const href = getHref(currentTab)

    return h(Fragment, [
      h(Interactive, {
        as: 'a',
        style: { ...Style.tabBar.tab, ...(selected ? Style.tabBar.active : {}) },
        hover: selected ? {} : Style.tabBar.hover,
        onClick: href === window.location.hash ? refresh : undefined,
        href
      }, [div({ style: { marginBottom: selected ? -(Style.tabBar.active.borderBottomWidth) : undefined } }, currentTab)])
    ])
  }

  return div({ style: Style.tabBar.container }, [
    ..._.map(name => navTab(name), tabNames),
    div({ style: { flexGrow: 1 } }),
    ...children
  ])
}

export const menuIcon = (iconName, props) => {
  return icon(iconName, _.merge({ size: 15, style: { marginRight: '.5rem' } }, props))
}

export const MenuButton = ({ disabled, children, ...props }) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      display: 'flex', alignItems: 'center',
      fontSize: 12, minWidth: 125, height: '2.25rem',
      color: disabled ? colors.dark(0.7) : undefined,
      padding: '0.875rem',
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: !disabled ? { backgroundColor: colors.light(0.4), color: colors.accent() } : undefined
  }, props), [children])
}

export const Checkbox = ({ checked, onChange, disabled, ...props }) => {
  return h(Interactive, _.merge({
    as: 'span',
    role: 'checkbox',
    'aria-checked': checked,
    onClick: () => onChange && !disabled && onChange(!checked),
    style: {
      display: 'inline-flex',
      verticalAlign: 'middle',
      color: disabled ? colors.dark(0.4) : checked ? colors.accent() : colors.dark(0.55)
    },
    hover: disabled ? undefined : { color: colors.accent(0.8) },
    active: disabled ? undefined : { backgroundColor: colors.accent(0.2) },
    disabled
  }, props), [
    icon(checked ? 'checkSquare' : 'square', { size: 16 })
  ])
}

export const LabeledCheckbox = ({ checked, onChange, disabled, children, ...props }) => {
  return h(Fragment, [
    h(Checkbox, { checked, onChange, disabled, ...props }),
    h(Interactive, {
      as: 'span',
      style: {
        verticalAlign: 'middle',
        color: disabled ? colors.dark(0.7) : undefined,
        cursor: disabled ? 'default' : 'pointer'
      },
      onClick: () => onChange && !disabled && onChange(!checked),
      disabled
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

export const spinnerDefault = ({ outerStyles = {}, innerStyles = {} }) => div(
  {
    style: {
      position: 'absolute',
      display: 'flex', alignItems: 'center',
      top: 0, right: 0, bottom: 0, left: 0,
      zIndex: 9999, // make sure it's on top of any third party components with z-indicies
      ...outerStyles
    }
  }, [
    centeredSpinner({
      size: 64,
      style: { backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '1rem', borderRadius: '0.5rem', ...innerStyles }
    })
  ]
)

export const spinnerOverlay = spinnerDefault({ outerStyles: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } })

export const transparentSpinnerOverlay = spinnerDefault({ innerStyles: { backgroundColor: 'rgba(255, 255, 255, 0.0)' } })

export const topSpinnerOverlay = spinnerDefault({ outerStyles: { backgroundColor: 'rgba(0, 0, 0, 0.1)' }, innerStyles: { marginTop: 150 } })

export const comingSoon = span({
  style: {
    margin: '0.5rem', padding: 3, borderRadius: 2,
    backgroundColor: colors.dark(0.2), color: colors.dark(),
    fontSize: '75%', textTransform: 'uppercase', fontWeight: 500,
    whiteSpace: 'nowrap', lineHeight: 1
  }
}, ['coming soon'])

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
      overflowWrap: 'break-word',
      backgroundColor: isSelected ? colors.light(0.4) : isFocused ? colors.dark(0.15) : undefined,
      color: isSelected ? colors.accent() : isDisabled ? undefined : colors.dark(),
      ':active': { backgroundColor: colors.accent(isSelected ? 0.55 : 0.4) }
    }),
    clearIndicator: base => ({ ...base, paddingRight: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, { selectProps: { isClearable } }) => _.merge(base, { paddingLeft: isClearable ? 0 : undefined }),
    multiValueLabel: base => ({ ...base, maxWidth: '100%' }),
    multiValueRemove: base => _.merge(base, { ':hover': { backgroundColor: 'unset' } })
  }
}

/**
 * @param {Object} props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of options
 * @param {Array} props.options - can be of any type; if objects, they should each contain a value and label, unless defining getOptionLabel
 */
export const Select = ({ value, options, id, ...props }) => {
  const newOptions = options && !_.isObject(options[0]) ? _.map(value => ({ value }), options) : options
  const findValue = target => _.find({ value: target }, newOptions)
  const newValue = props.isMulti ? _.map(findValue, value) : findValue(value)

  return h(RSelect, _.merge({
    inputId: id,
    ...commonSelectProps,
    getOptionLabel: ({ value, label }) => label || value.toString(),
    value: newValue || null, // need null instead of undefined to clear the select
    options: newOptions
  }, props))
}

export const AsyncCreatableSelect = props => {
  return h(RAsyncCreatableSelect, _.merge(commonSelectProps, props))
}

export const PageBox = ({ children, style = {} }) => {
  return div({
    style: {
      margin: '1.5rem', padding: '1.5rem 1.5rem 0', minHeight: 125, flex: 'none', zIndex: 0, ...style
    }
  }, [children])
}

export const backgroundLogo = () => img({
  src: scienceBackground,
  style: { position: 'fixed', top: 0, left: 0, zIndex: -1 }
})

export const methodLink = config => {
  const { methodRepoMethod: { sourceRepo, methodVersion, methodNamespace, methodName, methodPath } } = config
  return sourceRepo === 'agora' ?
    `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods/${methodNamespace}/${methodName}/${methodVersion}` :
    `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}`
}

export const ShibbolethLink = ({ children, ...props }) => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink('profile')}?nih-username-token={token}`
  return link({
    ...props,
    href: `${getConfig().shibbolethUrlRoot}/link-nih-account?${qs.stringify({ 'redirect-url': nihRedirectUrl })}`,
    style: { display: 'inline-flex', alignItems: 'center' },
    ...Utils.newTabLinkProps
  }, [
    children,
    icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })
  ])
}

export const IdContainer = ({ children }) => {
  const [id] = useState(() => _.uniqueId('element-'))
  return children(id)
}
