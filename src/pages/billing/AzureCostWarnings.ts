import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { newTabLinkProps } from 'src/libs/utils'

// TODO: this can likely be moved over to where it is used, as I think we will delete the CreateAzureBillingProjectModal (and test).
export const AzureCostWarnings = () => div({ style: { display: 'flex', flexDirection: 'row' } },
  [
    div({ style: { display: 'flex', paddingRight: '1rem', flexDirection: 'row' } }, [
      icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
      div([
        'Creating a Terra billing project currently costs about $5 per day. ',
        h(Link, {
          href: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
          ...newTabLinkProps
        }, ['Learn more and follow changes.'])
      ])
    ]),
    div({ style: { display: 'flex', flexDirection: 'row', paddingRight: '0.5rem' } }, [
      icon('clock', { size: 16, style: { marginRight: '0.5rem' } }),
      div(['It may take up to 15 minutes for the billing project to be fully created and ready for use.'])
    ])
  ]
)
