import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { div, h, img, input, label, span } from 'react-hyperscript-helpers'
import RSelect, { components as RSelectComponents } from 'react-select'
import RAsyncCreatableSelect from 'react-select/async-creatable'
import RSwitch from 'react-switch'
import { centeredSpinner, icon } from 'src/components/icons'
import Interactive from 'src/components/Interactive'
import TooltipTrigger from 'src/components/TooltipTrigger'
import hexButton from 'src/images/hex-button.svg'
import scienceBackground from 'src/images/science-background.jpg'
import { Ajax } from 'src/libs/ajax'
import colors, { terraSpecial } from 'src/libs/colors'
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
  },
  tabBar: {
    container: {
      display: 'flex', alignItems: 'center',
      fontWeight: 400, textTransform: 'uppercase',
      height: '2.25rem',
      borderBottom: `1px solid ${terraSpecial()}`, flex: ''
    },
    tab: {
      flex: 'none', outlineOffset: -4,
      alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center',
      borderBottomWidth: 8, borderBottomStyle: 'solid', borderBottomColor: 'transparent'
    },
    active: {
      borderBottomColor: terraSpecial(),
      fontWeight: 600
    }
  }
}

export const Clickable = ({ href, as = (!!href ? 'a' : 'div'), disabled, tooltip, tooltipSide, onClick, children, ...props }) => {
  const child = h(Interactive, {
    'aria-disabled': !!disabled,
    as, disabled,
    onClick: (...args) => onClick && !disabled && onClick(...args),
    href: !disabled ? href : undefined,
    tabIndex: disabled ? '-1' : '0',
    ...props
  }, [children])

  if (tooltip) {
    return h(TooltipTrigger, { content: tooltip, side: tooltipSide }, [child])
  } else {
    return child
  }
}

export const Link = ({ disabled, variant, children, ...props }) => {
  return h(Clickable, _.merge({
    style: {
      color: disabled ? colors.dark(0.7) : colors.accent(variant === 'light' ? 0.3 : 1),
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 500, display: 'inline'
    },
    hover: disabled ? undefined : { color: colors.accent(variant === 'light' ? 0.1 : 0.8) },
    disabled
  }, props), [children])
}

export const ButtonPrimary = ({ disabled, children, ...props }) => {
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
  }, props), [children])
}

export const ButtonSecondary = ({ disabled, children, ...props }) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      ...styles.button,
      color: disabled ? colors.dark(0.7) : colors.accent(),
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { color: colors.accent(0.8) }
  }, props), [children])
}

export const ButtonOutline = ({ disabled, children, ...props }) => {
  return h(ButtonPrimary, _.merge({
    style: {
      border: `1px solid ${disabled ? colors.dark(0.4) : colors.accent()}`,
      color: colors.accent(),
      backgroundColor: disabled ? colors.dark(0.25) : 'white'
    },
    hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) }
  }, props), [children])
}

export const makeIconButton = (shape, { disabled, size, iconProps = {}, ...props } = {}) => {
  return h(Clickable, _.merge({
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
  }, props), [
    icon(shape, _.merge({ style: { color: disabled ? colors.dark() : 'white' } }, iconProps))
  ])
}

export const TabBar = ({ activeTab, tabNames, refresh = _.noop, getHref, children }) => {
  const navTab = currentTab => {
    const selected = currentTab === activeTab
    const href = getHref(currentTab)

    return h(Fragment, [
      h(Clickable, {
        style: { ...Style.tabBar.tab, ...(selected ? Style.tabBar.active : {}) },
        hover: selected ? {} : Style.tabBar.hover,
        onClick: href === window.location.hash ? refresh : undefined,
        href
      }, [div({ style: { marginBottom: selected ? -(Style.tabBar.active.borderBottomWidth) : undefined } }, currentTab)])
    ])
  }

  return div({ role: 'navigation', 'aria-label': 'Tab bar', style: Style.tabBar.container }, [
    ..._.map(name => navTab(name), tabNames),
    div({ style: { flexGrow: 1 } }),
    children
  ])
}

export const SimpleTabBar = ({ value, onChange, tabs }) => {
  return div({ style: styles.tabBar.container }, [
    _.map(({ key, title, width }) => {
      const selected = value === key
      return h(Clickable, {
        key,
        style: { ...styles.tabBar.tab, ...(selected ? styles.tabBar.active : {}), width },
        hover: selected ? {} : styles.tabBar.hover,
        onClick: () => onChange(key)
      }, [title])
    }, tabs)
  ])
}

export const makeMenuIcon = (iconName, props) => {
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
    disabled
  }, props), [
    icon(checked ? 'checkSquare' : 'square', { size: 16 })
  ])
}

export const LabeledCheckbox = ({ checked, onChange, disabled, children, ...props }) => {
  return h(IdContainer, [id => h(Fragment, [
    h(Checkbox, { checked, onChange, disabled, 'aria-labelledby': id, ...props }),
    span({
      id,
      style: {
        verticalAlign: 'middle',
        color: disabled ? colors.dark(0.7) : undefined,
        cursor: disabled ? 'default' : 'pointer'
      },
      onClick: () => onChange && !disabled && onChange(!checked),
      disabled
    }, [children])
  ])])
}

export const RadioButton = ({ text, name, labelStyle, ...props }) => {
  return h(IdContainer, [id => h(Fragment, [
    input({
      type: 'radio', id,
      name,
      ...props
    }),
    text && label({ htmlFor: id, style: labelStyle }, [text])
  ])])
}

const makeBaseSpinner = ({ outerStyles = {}, innerStyles = {} }) => div(
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

export const spinnerOverlay = makeBaseSpinner({ outerStyles: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } })

export const transparentSpinnerOverlay = makeBaseSpinner({ innerStyles: { backgroundColor: 'rgba(255, 255, 255, 0.0)' } })

export const topSpinnerOverlay = makeBaseSpinner({ outerStyles: { backgroundColor: 'rgba(0, 0, 0, 0.1)' }, innerStyles: { marginTop: 150 } })

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
      fontWeight: isSelected ? 600 : undefined,
      backgroundColor: isFocused ? colors.dark(0.15) : 'white',
      color: isDisabled ? undefined : colors.dark(),
      ':active': { backgroundColor: colors.accent(isSelected ? 0.55 : 0.4) }
    }),
    clearIndicator: base => ({ ...base, paddingRight: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, { selectProps: { isClearable } }) => _.merge(base, { paddingLeft: isClearable ? 0 : undefined }),
    multiValueLabel: base => ({ ...base, maxWidth: '100%' }),
    multiValueRemove: base => _.merge(base, { ':hover': { backgroundColor: 'unset' } })
  },
  components: {
    Option: ({ children, ...props }) => {
      return h(RSelectComponents.Option, props, [
        div({ style: { display: 'flex', alignItems: 'center', height: 25 } }, [
          div({ style: { flexGrow: 1 } }, children),
          props.isSelected && icon('check', { size: 14, style: { flex: 'none', marginLeft: '0.5rem', color: colors.dark(0.5) } })
        ])
      ])
    }
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

const BaseSelect = ({ value, newOptions, id, findValue, maxHeight, ...props }) => {
  const newValue = props.isMulti ? _.map(findValue, value) : findValue(value)

  return h(RSelect, _.merge({
    inputId: id,
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
 */
export const Select = ({ value, options, id, ...props }) => {
  const newOptions = options && !_.isObject(options[0]) ? _.map(value => ({ value }), options) : options
  const findValue = target => _.find({ value: target }, newOptions)

  return h(BaseSelect, { value, newOptions, id, findValue, ...props })
}

/**
 * @param {Object} props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of an inner options object
 * @param {Array} props.options - an object with toplevel pairs of label:options where label is a group label and options is an array of objects containing value:label pairs
 */
export const GroupedSelect = ({ value, options, id, ...props }) => {
  const flattenedOptions = _.flatMap('options', options)
  const findValue = target => _.find({ value: target }, flattenedOptions)

  return h(BaseSelect, { value, newOptions: options, id, findValue, ...props })
}

export const AsyncCreatableSelect = props => {
  return h(RAsyncCreatableSelect, _.merge(commonSelectProps, props))
}

export const PageBox = ({ children, style = {}, ...props }) => {
  return div(_.merge({
    style: {
      margin: '1.5rem', padding: '1.5rem 1.5rem 0', minHeight: 125, flex: 'none', zIndex: 0, ...style
    }
  }, props), [children])
}

export const backgroundLogo = img({
  src: scienceBackground,
  alt: '',
  style: { position: 'fixed', top: 0, left: 0, zIndex: -1 }
})

export const methodLink = config => {
  const { methodRepoMethod: { sourceRepo, methodVersion, methodNamespace, methodName, methodPath } } = config
  return sourceRepo === 'agora' ?
    `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods/${methodNamespace}/${methodName}/${methodVersion}` :
    `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}:${methodVersion}`
}

export const ShibbolethLink = ({ children, ...props }) => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink('profile')}?nih-username-token={token}`
  return h(Link, {
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

export const FocusTrapper = ({ children, onBreakout, ...props }) => {
  return h(FocusLock, {
    returnFocus: true,
    lockProps: _.merge({
      tabIndex: 0,
      style: { outline: 'none' },
      onKeyDown: e => {
        if (e.key === 'Escape') {
          onBreakout()
          e.stopPropagation()
        }
      }
    }, props)
  }, [children])
}

export const CromwellVersionLink = props => {
  const [version, setVersion] = useState()
  const signal = Utils.useCancellation()

  Utils.useOnMount(() => {
    const setCromwellVersion = async () => {
      const { cromwell } = await Ajax(signal).Submissions.cromwellVersion()

      setVersion(cromwell.split('-')[0])
    }

    setCromwellVersion()
  })

  return version ?
    h(Link, {
      href: `https://github.com/broadinstitute/cromwell/releases/tag/${version}`,
      ...Utils.newTabLinkProps,
      ...props
    }, ['Cromwell ', version]) :
    'Cromwell version loading...'
}

const SwitchLabel = ({ isOn }) => div({
  style: {
    display: 'flex', justifyContent: isOn ? 'flex-start' : 'flex-end',
    fontSize: 15, fontWeight: 'bold', color: 'white',
    height: '100%', lineHeight: '28px',
    ...(isOn ? { marginLeft: '0.75rem' } : { marginRight: '0.5rem' })
  }
}, [isOn ? 'True' : 'False'])

export const Switch = ({ onChange, ...props }) => {
  return h(RSwitch, {
    onChange: value => onChange(value),
    offColor: colors.dark(0.5),
    onColor: colors.success(1.2),
    checkedIcon: h(SwitchLabel, { isOn: true }),
    uncheckedIcon: h(SwitchLabel, { isOn: false }),
    width: 80,
    ...props
  })
}
