import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { b, div, h, h1, img, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common/buttons'
import Clickable from 'src/components/common/Clickable'
import { IdContainer } from 'src/components/common/IdContainer'
import Link from 'src/components/common/Link'
import { spinnerOverlay } from 'src/components/common/spinners'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
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
import { useOnMount } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export * from 'src/components/common/buttons'
export * from 'src/components/common/Checkbox'
export * from 'src/components/common/IdContainer'
export * from 'src/components/common/RadioButton'
export * from 'src/components/common/Select'
export * from 'src/components/common/spinners'
export * from 'src/components/common/Switch'
export { Clickable, Link }


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
