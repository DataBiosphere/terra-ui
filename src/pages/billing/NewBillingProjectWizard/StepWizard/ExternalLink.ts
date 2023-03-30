import React from 'react'
import { h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


interface ExternalLinkProps {
  text: React.ReactNode
  url: string
  popoutSize?: number
  style?: React.CSSProperties
}

export const ExternalLink = ({ text, url, popoutSize = 14, ...props }: ExternalLinkProps) => h(Link, {
  ...Utils.newTabLinkProps,
  style: { color: colors.accent(), ...props.style },
  href: url,
}, [text, icon('pop-out', { style: { marginLeft: '0.25rem' }, size: popoutSize })])

