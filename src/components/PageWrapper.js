import { a, div } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


const styles = {
  link: { marginLeft: '2rem' }
}

const tosUrl = 'http://gatkforums.broadinstitute.org/firecloud/discussion/6819/firecloud-terms-of-service#latest'

const PageWrapper = ({ children }) => {
  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100%' } }, [
    div({ style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [children]),
    div({
      style: {
        flex: 'none',
        display: 'flex', alignItems: 'center',
        height: 92,
        paddingLeft: '6rem',
        paddingRight: '6rem',
        backgroundColor: colors.text[0],
        color: colors.text[2],
        borderTop: `4px solid ${colors.standout}`,
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
      a({ target: '_blank', href: tosUrl, style: styles.link }, 'Terms of Service'),
      div({ style: { marginLeft: 'auto' } }, [
        'Built on: ',
        new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()
      ])
    ])
  ])
}

export default PageWrapper
