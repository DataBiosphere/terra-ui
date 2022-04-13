import _ from 'lodash/fp'
import { aside, div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import { useCancellation, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


export const cookiesAcceptedKey = 'cookiesAccepted'

const CookieWarning = () => {
  const signal = useCancellation()
  const { cookiesAccepted } = useStore(authStore)

  const acceptCookies = acceptedCookies => {
    authStore.update(_.set('cookiesAccepted', acceptedCookies))
  }

  const rejectCookies = async () => {
    const cookies = document.cookie.split(';')
    acceptCookies(false)
    try {
      await Ajax(signal).Runtimes.invalidateCookie()
    } catch (err) {
      // Do Nothing
    }
    // Expire all cookies
    _.forEach(cookie => {
      // Find an equals sign and uses it to grab the substring of the cookie that is its name
      const eqPos = cookie.indexOf('=')
      const cookieName = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }, cookies)
    signOut()
  }
  return cookiesAccepted === false && aside({
    'aria-label': 'cookie consent banner',
    style: {
      flex: 0, height: 100, width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.dark(0.15), borderBottom: `6px solid ${colors.primary()}`
    }
  }, [
    div({ style: { padding: '0.9rem 2rem', height: '100%', display: 'flex', alignItems: 'center' } }, [
      div({ style: { overflowY: 'auto', height: '100%' } }, [
        `${getAppName()} uses cookies to enable the proper functioning and security of our website,
        and to improve your experience. By clicking Agree or continuing to use our site, you consent to the use of these functional
        cookies. If you do not wish to allow use of these cookies, you may tell us that by clicking on Reject. As a result, you will be unable
        to use our site. To find out more, read our `,
        h(Link, { style: { textDecoration: 'underline', color: colors.accent(1.1) }, href: Nav.getLink('privacy') }, ['privacy policy']), '.'
      ])

    ]),
    div({ style: { padding: '2rem', display: 'flex' } }, [
      h(ButtonPrimary, { onClick: () => acceptCookies(true) }, ['Agree']),
      h(ButtonSecondary, { style: { marginLeft: '2rem', color: colors.accent(1.1) }, onClick: rejectCookies }, ['Reject'])
    ])
  ])
}

export default CookieWarning
