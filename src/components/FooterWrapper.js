import { Fragment, useState } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { Clickable, Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { isBioDataCatalyst } from 'src/libs/config'
import { footerLogo } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'

export const expandedFooterHeight = 60
export const shrunkFooterHeight = 20

const styles = {
  item: { marginLeft: '2rem' },
  footer: {
    flex: 'none',
    padding: '0 1rem',
    backgroundColor: colors.secondary(),
    color: 'white'
  }
}

const buildTimestamp = new Date(parseInt(process.env.REACT_APP_BUILD_TIMESTAMP, 10))

// If you change the layout here, make sure it's reflected in the pre-rendered version in public/index.html
const FooterWrapper = ({ children, alwaysShow, onExpand = () => {} }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const bdcFooterContent = div({ style: { display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem 2rem', fontSize: 10 } }, [
    a({ href: 'https://biodatacatalyst.nhlbi.nih.gov/privacy', ...Utils.newTabLinkProps }, 'Privacy Policy'),
    a({ href: 'https://www.nhlbi.nih.gov/about/foia-fee-for-service-office', ...Utils.newTabLinkProps },
      'Freedom of Information Act (FOIA)'),
    a({ href: 'https://biodatacatalyst.nhlbi.nih.gov/accessibility', ...Utils.newTabLinkProps }, 'Accessibility'),
    a({ href: 'https://www.hhs.gov/', ...Utils.newTabLinkProps }, 'U.S. Department of Health &  Human Services'),
    a({ href: 'https://osp.od.nih.gov/scientific-sharing/policies/', ...Utils.newTabLinkProps }, 'Data Sharing Policy'),
    a({ href: 'https://www.nih.gov/', ...Utils.newTabLinkProps }, 'National Institutes of Health'),
    a({ href: 'https://www.usa.gov/', ...Utils.newTabLinkProps }, 'USA.gov'),
    a({ href: 'https://www.nhlbi.nih.gov/', ...Utils.newTabLinkProps },
      'National Heart, Lung, and Blood Institute')
  ])

  const standardFooterContent = h(Fragment, [
    h(Link, { href: Nav.getLink('root') }, [footerLogo()]),
    a({ href: Nav.getLink('privacy'), style: styles.item }, 'Privacy Policy'),
    div({ style: styles.item }, '|'),
    a({ href: Nav.getLink('terms-of-service'), style: styles.item }, 'Terms of Service'),
    div({ style: styles.item }, '|'),
    a({
      href: 'https://support.terra.bio/hc/en-us/articles/360030793091-Terra-FireCloud-Security-Posture', ...Utils.newTabLinkProps,
      style: styles.item
    },
    ['Security', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })]),
    div({ style: styles.item }, '|'),
    a({
      href: 'https://support.terra.bio/hc/en-us', ...Utils.newTabLinkProps,
      style: { ...styles.item, display: 'flex', alignItems: 'center' }
    }, [
      'Documentation', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })
    ]),
    div({ style: { flexGrow: 1 } }),
    div({ onClick: () => Nav.goToPath('hall-of-fame'), style: { fontWeight: 600, fontSize: '10px' } }, [
      `Copyright ©${buildTimestamp.getFullYear()}`
    ])
  ])

  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100%', flexGrow: 1 } }, [
    children,
    (isBioDataCatalyst() || alwaysShow) && h(div, {
      role: 'contentinfo',
      style: styles.footer
    }, [
      !alwaysShow && h(Clickable, {
        onClick: () => {
          setIsExpanded(!isExpanded)
          onExpand()
        },
        style: { fontSize: 10, padding: '0.25rem 0', height: shrunkFooterHeight }
      }, [`${isExpanded ? 'Hide' : 'Show'} Legal and Regulatory Information`]),
      (isExpanded || alwaysShow) && div({
        style: { display: 'flex', alignItems: 'center', height: expandedFooterHeight }
      }, [
        !isBioDataCatalyst() ? standardFooterContent : bdcFooterContent
      ])
    ])
  ])
}

export default FooterWrapper
