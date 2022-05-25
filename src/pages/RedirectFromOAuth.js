import { UserManager } from 'oidc-client-ts'
import { div, img } from 'react-hyperscript-helpers'
import { useOnMount } from 'src/libs/react-utils'


const RedirectFromOAuth = (silent = false) => {
  const userManager = new UserManager({
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`
  })
  const url = window.location.href.replace('#', '')
  useOnMount(() => silent === true ? userManager.signinSilentCallback(url) : userManager.signinPopupCallback(url))

  const spinnerSize = 54
  return div({ role: 'main', style: { position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' } }, [
    img({
      src: 'loading-spinner.svg',
      style: {
        width: spinnerSize,
        height: spinnerSize,
        display: 'block',
        position: 'sticky',
        top: `calc(50% - ${spinnerSize / 2}px)`,
        bottom: `calc(50% - ${spinnerSize / 2}px)`,
        left: `calc(50% - ${spinnerSize / 2}px)`,
        right: `calc(50% - ${spinnerSize / 2}px)`
      }
    })
  ])
}

export const navPaths = [
  {
    name: 'redirect-from-oauth',
    path: '/redirect-from-oauth',
    component: () => RedirectFromOAuth(false),
    public: true,
    title: 'Redirect From OAuth'
  },
  {
    name: 'redirect-from-oauth-silent',
    path: '/redirect-from-oauth-silent',
    component: () => RedirectFromOAuth(true),
    public: true,
    title: 'Redirect From OAuth'
  }
]

export default RedirectFromOAuth
