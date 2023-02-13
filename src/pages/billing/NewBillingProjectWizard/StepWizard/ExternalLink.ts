import React from 'react'
import { h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


interface ExternalLinkProps {
  text: React.ReactNode
  url: string
  style?: React.CSSProperties
}

export const ExternalLink = ({ text, url, ...props }: ExternalLinkProps) => h(Link, {
  ...Utils.newTabLinkProps,
  style: { textDecoration: 'underline', color: colors.accent(), ...props.style },
  href: url,
}, [text])
