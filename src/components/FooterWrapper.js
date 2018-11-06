import { a, div } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


const styles = {
  link: { marginLeft: '2rem' }
}

const tosUrl = 'http://gatkforums.broadinstitute.org/firecloud/discussion/6819/firecloud-terms-of-service#latest'

const FooterWrapper = ({ children }) => {
  return div({ style: { display: 'flex', flexDirection: 'column', minHeight: '100%' } }, [
    children,
    div({
      style: {
        flex: 'none',
        display: 'flex', alignItems: 'center',
        height: 92,
        paddingLeft: '6rem',
        paddingRight: '6rem',
        backgroundColor: colors.gray[0],
        color: colors.gray[2],
        borderTop: `4px solid ${colors.brick}`
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('logoGrey', { size: 36 }),
        div({
          style: { fontSize: 25, fontWeight: 500, textTransform: 'uppercase', marginLeft: '0.5rem' }
        }, 'Terra')
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

export default FooterWrapper
