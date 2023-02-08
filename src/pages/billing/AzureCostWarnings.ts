import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { newTabLinkProps } from 'src/libs/utils'


export const AzureCostWarnings = () => h(Fragment, {
  children: [
    div({ style: { paddingTop: '1.0rem', display: 'flex' } }, [
      icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
      div([
        'Creating a Terra billing project currently costs about $5 per day. ',
        h(Link, {
          href: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
          ...newTabLinkProps
        }, ['Learn more and follow changes.'])
      ])
    ]),
    div({ style: { paddingTop: '1.0rem', display: 'flex' } }, [
      icon('clock', { size: 16, style: { marginRight: '0.5rem' } }),
      div(['It may take up to 15 minutes for the billing project to be fully created and ready for use.'])
    ])
  ]
})
