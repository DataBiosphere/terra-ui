import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import Link from 'src/components/common/Link'
import { icon } from 'src/components/icons'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


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
