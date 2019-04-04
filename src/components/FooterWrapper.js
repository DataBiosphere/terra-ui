import { a, div } from 'react-hyperscript-helpers'
import { linkButton } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


const styles = {
  link: { marginLeft: '2rem' }
}

const FooterWrapper = ({ children }) => {
  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100%', flexGrow: 1 } }, [
    children,
    div({
      style: {
        flex: 'none',
        display: 'flex', alignItems: 'center',
        height: 92,
        paddingLeft: '6rem',
        paddingRight: '6rem',
        backgroundColor: colors.gray[1],
        color: 'white'
      }
    }, [
      linkButton({ href: Nav.getLink('root'), style: { display: 'flex', alignItems: 'center' } }, [
        icon('logoWhite', { size: 55 })
      ]),
      a({ href: Nav.getLink('privacy'), style: styles.link }, 'Privacy Policy'),
      a({ href: Nav.getLink('terms-of-service'), style: styles.link }, 'Terms of Service'),
      div({ style: { marginLeft: 'auto', fontWeight: 600, fontSize: '10px' } }, [
        'Built on: ',
        new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()
      ])
    ])
  ])
}

export default FooterWrapper
