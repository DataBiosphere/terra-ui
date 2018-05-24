import { a, div } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


const styles = {
  link: { marginLeft: '2rem', color: 'inherit', textDecoration: 'none' }
}

const tosUrl = 'http://gatkforums.broadinstitute.org/firecloud/discussion/6819/firecloud-terms-of-service#latest'

const FooterContainer = ({ children }) => {
  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100vh' } }, [
    div({ style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [children]),
    div({
      style: {
        flex: 'none',
        display: 'flex', alignItems: 'center',
        height: 92,
        paddingLeft: '6rem',
        backgroundColor: Style.colors.text,
        color: Style.colors.disabled,
        borderTop: `4px solid ${Style.colors.standout}`,
        marginTop: '2rem'
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('logoGrey', { size: 36 }),
        div({
          style: { fontSize: 25, fontWeight: 500, textTransform: 'uppercase', marginLeft: '0.5rem' }
        }, 'Saturn')
      ]),
      a({ href: Nav.getLink('privacy'), style: styles.link }, 'Privacy Policy'),
      a({ target: '_blank', href: tosUrl, style: styles.link }, 'Terms of Service')
    ])
  ])
}

export default FooterContainer
