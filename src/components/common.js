import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { b, div, h, h1, img, input, label, span } from 'react-hyperscript-helpers'
import RSelect, { components as RSelectComponents } from 'react-select'
import RAsyncCreatableSelect from 'react-select/async-creatable'
import RSwitch from 'react-switch'
import { ButtonPrimary } from 'src/components/common/buttons'
import Clickable from 'src/components/common/Clickable'
import Link from 'src/components/common/Link'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Interactive from 'src/components/Interactive'
import Modal from 'src/components/Modal'
import { MiniSortable } from 'src/components/table'
import TopBar from 'src/components/TopBar'
import landingPageHero from 'src/images/landing-page-hero.jpg'
import scienceBackground from 'src/images/science-background.jpg'
import { Ajax } from 'src/libs/ajax'
import { getEnabledBrand, isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useLabelAssert, useOnMount, useUniqueId } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export * from 'src/components/common/buttons'
export { Clickable, Link }


export const Checkbox = ({ checked, onChange, disabled, ...props }) => {
  useLabelAssert('Checkbox', { ...props, allowId: true })
  return h(Interactive, _.merge({
    as: 'span',
    className: 'fa-layers fa-fw',
    role: 'checkbox',
    'aria-checked': checked,
    onClick: () => !disabled && onChange?.(!checked),
    style: { verticalAlign: 'middle' },
    disabled
  }, props), [
    icon('squareSolid', { style: { color: Utils.cond([disabled, () => colors.light(1.2)], [checked, () => colors.accent()], () => 'white') } }), // bg
    !disabled && icon('squareLight', { style: { color: checked ? colors.accent(1.2) : colors.dark(0.75) } }), // border
    checked && icon('check', { size: 8, style: { color: disabled ? colors.dark(0.75) : 'white' } }) // check
  ])
}

export const LabeledCheckbox = ({ checked, onChange, disabled, children, ...props }) => {
  return h(IdContainer, [id => h(Fragment, [
    h(Checkbox, { checked, onChange, disabled, 'aria-labelledby': id, ...props }),
    span({
      id,
      style: {
        verticalAlign: 'middle',
        color: disabled ? colors.dark(0.8) : undefined,
        cursor: disabled ? 'default' : 'pointer'
      },
      onClick: () => !disabled && onChange?.(!checked),
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
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
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

export const spinnerOverlay = makeBaseSpinner({})

export const absoluteSpinnerOverlay = makeBaseSpinner({ innerStyles: { position: 'absolute' } })

export const fixedSpinnerOverlay = makeBaseSpinner({ innerStyles: { position: 'fixed' } })

export const transparentSpinnerOverlay = makeBaseSpinner({ innerStyles: { backgroundColor: 'rgba(255, 255, 255, 0.0)' } })

export const topSpinnerOverlay = makeBaseSpinner({ innerStyles: { marginTop: 150 } })

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

export const PageBoxVariants = {
  LIGHT: 'light'
}

export const PageBox = ({ children, variant, style = {}, ...props }) => {
  return div(_.merge({
    style: {
      margin: '1.5rem', padding: '1.5rem 1.5rem 0', minHeight: 125, flex: 'none', zIndex: 0,
      ...Utils.switchCase(variant,
        [PageBoxVariants.LIGHT, () => ({ backgroundColor: colors.light(isRadX() ? 0.3 : 1), margin: 0, padding: '3rem 3rem 1.5rem' })],
        [Utils.DEFAULT, () => ({})]), ...style
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
    `${getConfig().firecloudUrlRoot}/?return=${getEnabledBrand().queryName}#methods/${methodNamespace}/${methodName}/${methodVersion}` :
    `${getConfig().dockstoreUrlRoot}/workflows/${methodPath}:${methodVersion}`
}

export const ShibbolethLink = ({ button = false, children, ...props }) => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink('profile')}?nih-username-token=<token>`
  return h(button ? ButtonPrimary : Link, _.merge({
    href: `${getConfig().shibbolethUrlRoot}/login?${qs.stringify({ 'return-url': nihRedirectUrl })}`,
    ...(button ? {} : { style: { display: 'inline-flex', alignItems: 'center' } }),
    ...Utils.newTabLinkProps
  }, props), [children, icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })])
}

export const FrameworkServiceLink = ({ linkText, provider, redirectUrl, button = false, ...props }) => {
  const [href, setHref] = useState()

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting('Error getting Fence Link', async () => {
      const result = await Ajax().User.getFenceAuthUrl(provider, redirectUrl)
      setHref(result.url)
    })
    loadAuthUrl()
  })

  return !!href ?
    h(button ? ButtonPrimary : Link, {
      href,
      ...(button ? {} : { style: { display: 'inline-flex', alignItems: 'center' } }),
      ...Utils.newTabLinkProps,
      ...props
    }, [linkText, icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })]) :
    h(Fragment, [linkText])
}

export const UnlinkFenceAccount = ({ linkText, provider }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  return div({ style: { display: 'inline-flex' } }, [
    h(Link, { onClick: () => { setIsModalOpen(true) } }, [linkText]),
    isModalOpen && h(Modal, {
      title: 'Confirm unlink account',
      onDismiss: () => setIsModalOpen(false),
      okButton: h(ButtonPrimary, {
        onClick: _.flow(
          withErrorReporting('Error unlinking account'),
          Utils.withBusyState(setIsUnlinking)
        )(async () => {
          await Ajax().User.unlinkFenceAccount(provider.key)
          authStore.update(_.set(['fenceStatus', provider.key], {}))
          setIsModalOpen(false)
          notify('success', 'Successfully unlinked account', {
            message: `Successfully unlinked your account from ${provider.name}`,
            timeout: 30000
          })
        })
      }, 'OK')
    }, [
      div([`Are you sure you want to unlink from ${provider.name}?`]),
      div({ style: { marginTop: '1rem' } }, ['You will lose access to any underlying datasets. You can always re-link your account later.']),
      isUnlinking && spinnerOverlay
    ])
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
  const signal = useCancellation()

  useOnMount(() => {
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
    }, ['Cromwell ', version, icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]) :
    'Cromwell version loading...'
}

const SwitchLabel = ({ isOn, onLabel, offLabel }) => div({
  style: {
    display: 'flex', justifyContent: isOn ? 'flex-start' : 'flex-end',
    fontSize: 15, fontWeight: 'bold', color: 'white',
    height: '100%', lineHeight: '28px',
    ...(isOn ? { marginLeft: '0.75rem' } : { marginRight: '0.5rem' })
  }
}, [isOn ? onLabel : offLabel])

export const Switch = forwardRefWithName('Switch', ({ onChange, onLabel = 'True', offLabel = 'False', ...props }, ref) => {
  return h(RSwitch, {
    onChange: value => onChange(value),
    offColor: colors.dark(0.5),
    onColor: colors.success(1.2),
    checkedIcon: h(SwitchLabel, { isOn: true, onLabel, offLabel }),
    uncheckedIcon: h(SwitchLabel, { isOn: false, onLabel, offLabel }),
    width: 80,
    ...props,
    ref: rSwitch => {
      const inputEl = rSwitch ? rSwitch.$inputRef : null
      if (_.has('current', ref)) {
        ref.current = inputEl
      } else if (_.isFunction(ref)) {
        ref(inputEl)
      }
    }
  })
})

export const HeroWrapper = ({ showMenu = true, bigSubhead = false, showDocLink = false, children }) => {
  const brand = getEnabledBrand()

  return h(FooterWrapper, { alwaysShow: true }, [
    h(TopBar, { showMenu }),
    div({
      role: 'main',
      style: {
        flexGrow: 1,
        color: colors.dark(),
        padding: '3rem 5rem',
        backgroundColor: '#fafbfd', // This not-quite-white fallback color was extracted from the background image
        backgroundImage: `url(${landingPageHero})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0 top 0'
      }
    }, [
      // width is set to prevent text from overlapping the background image and decreasing legibility
      h1({ style: { fontSize: 54, width: 'calc(100% - 460px)' } }, [brand.welcomeHeader]),
      div({
        style: {
          margin: '1rem 0', width: 'calc(100% - 460px)', maxWidth: 700, ...(bigSubhead ?
            { fontSize: 20, lineHeight: '28px' } :
            { fontSize: 16, lineHeight: 1.5 })
        }
      }, [
        brand.description,
        showDocLink ?
          h(Fragment, [
            ' ',
            h(Link, {
              style: { textDecoration: 'underline' },
              href: 'https://support.terra.bio/hc/en-us',
              ...Utils.newTabLinkProps
            }, ['Learn more about Terra.'])
          ]) : null
      ]),
      children
    ])
  ])
}

export const WarningTitle = ({ children, iconSize = 36 }) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    icon('warning-standard', { size: iconSize, style: { color: colors.warning(), marginRight: '0.75rem' } }),
    children
  ])
}

export const ClipboardButton = ({ text, onClick, children, ...props }) => {
  const [copied, setCopied] = useState(false)
  return h(Link, {
    tooltip: copied ? 'Copied to clipboard' : 'Copy to clipboard',
    ...props,
    onClick: _.flow(
      withErrorReporting('Error copying to clipboard'),
      Utils.withBusyState(setCopied)
    )(async e => {
      onClick?.(e)
      await clipboard.writeText(text)
      await Utils.delay(1500)
    })
  }, [children, icon(copied ? 'check' : 'copy-to-clipboard', !!children && { style: { marginLeft: '0.5rem' } })])
}

export const HeaderRenderer = ({ name, label, sort, onSort, style, ...props }) => h(MiniSortable, { sort, field: name, onSort }, [
  div({ style: { fontWeight: 600, ...style }, ...props }, [label || Utils.normalizeLabel(name)])
])

export const DeleteConfirmationModal = ({
  objectType,
  objectName,
  title: titleProp,
  children,
  confirmationPrompt,
  buttonText: buttonTextProp,
  onConfirm,
  onDismiss
}) => {
  const title = titleProp || `Delete ${objectType}`
  const buttonText = buttonTextProp || `Delete ${objectType}`

  const [confirmation, setConfirmation] = useState('')

  const isConfirmed = !confirmationPrompt || _.toLower(confirmation) === _.toLower(confirmationPrompt)

  return h(Modal, {
    title: span({ style: { display: 'flex', alignItems: 'center' } }, [
      icon('warning-standard', { size: 24, color: colors.warning() }),
      span({ style: { marginLeft: '1ch' } }, [title])
    ]),
    onDismiss,
    okButton: h(ButtonPrimary, {
      'data-testid': 'confirm-delete',
      onClick: onConfirm,
      disabled: !isConfirmed,
      tooltip: isConfirmed ? undefined : 'You must type the confirmation message'
    }, buttonText),
    styles: { modal: { backgroundColor: colors.warning(0.1) } }
  }, [
    children || h(Fragment, [
      div([`Are you sure you want to delete the ${objectType} `, b({ style: { wordBreak: 'break-word' } }, [objectName]), '?']),
      b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.')
    ]),
    confirmationPrompt && div({ style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
      h(IdContainer, [id => h(Fragment, [
        label({ htmlFor: id, style: { marginBottom: '0.25rem' } }, [`Type "${confirmationPrompt}" to continue:`]),
        h(TextInput, {
          autoFocus: true,
          id,
          placeholder: confirmationPrompt,
          value: confirmation,
          onChange: setConfirmation
        })
      ])])
    ])
  ])
}
