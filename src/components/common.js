import _ from 'lodash/fp'
import marked from 'marked'
import { Fragment } from 'react'
import { div, h, input, label, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import RSelect from 'react-select'
import { centeredSpinner, icon } from 'src/components/icons'
import TooltipTrigger from 'src/components/TooltipTrigger'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
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
      fontWeight: 'bold',
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
      fontWeight: 'bold',
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

export const tabBar = ({ activeTab, tabNames, refresh = _.noop, getHref }, children = []) => {
  const navSeparator = div({
    style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
  })

  const navTab = currentTab => {
    const selected = currentTab === activeTab
    const href = getHref(currentTab)
    const hideSeparator = selected || tabNames.indexOf(activeTab) === tabNames.indexOf(currentTab) + 1

    return h(Fragment, [
      h(Interactive, {
        as: 'a',
        style: { ...Style.tabBar.tab, ...(selected ? Style.tabBar.active : {}) },
        hover: { color: Style.tabBar.active.color },
        onClick: href === window.location.hash ? refresh : undefined,
        href,
        'aria-label': currentTab+'-tab',
        datatestid: currentTab+'-tab' // capitalizing here results in: // index.js:1452 Warning: React does not recognize the `dataTestId` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `datatestid` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
      }, currentTab),
      !hideSeparator && navSeparator
    ])
  }

  return div({ style: Style.tabBar.container }, [
    activeTab !== tabNames[0] && navSeparator,
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
      fontSize: 12, minWidth: 125, height: '2rem',
      color: disabled ? colors.gray[2] : undefined,
      padding: '0 1.5rem',
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: !disabled ? { backgroundColor: colors.blue[3], fontWeight: 'bold' } : undefined
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

export const topSpinnerOverlay = spinnerDefault({ outerStyles: { backgroundColor: 'rgba(0, 0, 0, 0.1)' }, innerStyles: { marginTop: 150  } })

export const comingSoon = span({
  style: {
    margin: '0.5rem', padding: 3, borderRadius: 2,
    backgroundColor: colors.purple[0], color: 'white',
    fontSize: '75%', textTransform: 'uppercase', fontWeight: 500,
    whiteSpace: 'nowrap', lineHeight: 1
  }
}, ['coming soon'])

/**
 * @param {Object} props - see {@link https://react-select.com/props#select-props}
 * @param props.value - a member of options
 * @param {Array} props.options - can be of any type; if objects, they should each contain a value and label, unless defining getOptionLabel
 */
export const Select = ({ value, options, ...props }) => {
  const newOptions = options && !_.isObject(options[0]) ? _.map(value => ({ value }), options) : options
  const findValue = target => _.find({ value: target }, newOptions)
  const newValue = props.isMulti ? _.map(findValue, value) : findValue(value)

  return h(RSelect, _.merge({
    theme: base => _.merge(base, {
      colors: {
        primary: colors.blue[0],
        neutral20: colors.gray[3],
        neutral30: colors.gray[3]
      },
      spacing: { controlHeight: 36 }
    }),
    styles: {
      control: (base, { isDisabled }) => _.merge(base, {
        backgroundColor: isDisabled ? colors.gray[5] : 'white',
        boxShadow: 'none'
      }),
      singleValue: base => ({ ...base, color: colors.gray[0] }),
      option: (base, { isSelected, isFocused, isDisabled }) => _.merge(base, {
        backgroundColor: isSelected ? colors.blue[4] : isFocused ? colors.blue[5] : undefined,
        fontWeight: isFocused ? 'bold' : undefined,
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
    backgroundColor = 'rgba(255,255,255,0)',
    borderColor = colors.gray[3],
    ...containerStyle
  } = style

  return div({
    style: {
      display: 'flex', flexDirection: 'column',
      background: `linear-gradient(to bottom, white, ${backgroundColor} ${fadePoint})`,
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
        flex: 1,
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

export const PageFadeBox = ({ children, style = {} }) => {
  return h(FadeBox, {
    fadePoint: '125px',
    style: {
      margin: '1.5rem', paddingTop: '1rem', minHeight: 125, flex: 'none', ...style
    }
  }, [children])
}

export const backgroundLogo = icon('logoIcon', {
  size: 1200,
  style: { position: 'fixed', top: -100, left: -100, zIndex: -1, opacity: 0.65 }
})

export const methodLink = config => {
  const { methodRepoMethod: { sourceRepo, methodVersion, methodNamespace, methodName, methodPath } } = config
  return sourceRepo === 'agora' ?
    `${getConfig().firecloudUrlRoot}/#methods/${methodNamespace}/${methodName}/${methodVersion}` :
    `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}`
}

/**
 * WARNING: Be very careful when using custom renderers because they may override marked's built-in
 * content sanitization.
 * @param {string} children markdown content
 * @param renderers element-specific renderers
 * @param props properties for wraper div
 * @returns {object} div containing rendered markdown
 * @constructor
 */
export const Markdown = ({ children, renderers = {}, ...props }) => {
  const content = marked(children, {
    renderer: Object.assign(new marked.Renderer(), renderers)
  })
  return div({ ...props, dangerouslySetInnerHTML: { __html: content } })
}
