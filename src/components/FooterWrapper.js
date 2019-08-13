import { a, div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { footerLogo } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'


const styles = {
  item: { marginLeft: '2rem' }
}

const buildTimestamp = new Date(SATURN_BUILD_TIMESTAMP)

const FooterWrapper = ({ children }) => {
  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100%', flexGrow: 1 } }, [
    children,
    div({
      role: 'contentinfo',
      style: {
        flex: 'none',
        display: 'flex', alignItems: 'center',
        height: 66,
        padding: '0 1rem',
        backgroundColor: colors.secondary(),
        color: 'white'
      }
    }, [
      h(Link, { href: Nav.getLink('root') }, [
        footerLogo()
      ]),
      a({ href: Nav.getLink('privacy'), style: styles.item }, 'Privacy Policy'),
      a({ href: Nav.getLink('terms-of-service'), style: styles.item }, 'Terms of Service'),
      div({ style: styles.item }, '|'),
      a({
        href: 'https://support.terra.bio/hc/en-us', target: '_blank',
        style: { ...styles.item, display: 'flex', alignItems: 'center' }
      }, [
        'Documentation', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })
      ]),
      div({ style: { flexGrow: 1 } }),
      div({ onClick: () => Nav.goToPath('hall-of-fame'), style: { fontWeight: 600, fontSize: '10px' } }, [
        `Copyright ©${buildTimestamp.getFullYear()}`
      ])
    ])
  ])
}

export default FooterWrapper
