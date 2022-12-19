import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import Clickable from 'src/components/common/Clickable'
import Link from 'src/components/common/Link'
import { icon } from 'src/components/icons'
import { MiniSortable } from 'src/components/table'
import scienceBackground from 'src/images/science-background.jpg'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export * from 'src/components/common/buttons'
export * from 'src/components/common/Checkbox'
export * from 'src/components/common/DeleteConfirmationModal'
export * from 'src/components/common/FocusTrapper'
export * from 'src/components/common/IdContainer'
export * from 'src/components/common/RadioButton'
export * from 'src/components/common/Select'
export * from 'src/components/common/spinners'
export * from 'src/components/common/Switch'
export { Clickable, Link }


export const backgroundLogo = img({
  src: scienceBackground,
  alt: '',
  style: { position: 'fixed', top: 0, left: 0, zIndex: -1 }
})

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
