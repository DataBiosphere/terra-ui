import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { b, div, h, img, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common/buttons'
import Clickable from 'src/components/common/Clickable'
import { IdContainer } from 'src/components/common/IdContainer'
import Link from 'src/components/common/Link'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { MiniSortable } from 'src/components/table'
import scienceBackground from 'src/images/science-background.jpg'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
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
