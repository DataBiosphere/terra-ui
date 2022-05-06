import { UserManager } from 'oidc-client-ts'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { getOidcConfig } from 'src/libs/auth'
import { useOnMount } from 'src/libs/react-utils'


const RedirectFromOAuth = silent => {
  const userManager = new UserManager(getOidcConfig())
  const url = window.location.href.replace('#', '')
  useOnMount(() => silent ? userManager.signinSilentCallback(url) : userManager.signinPopupCallback(url))
  return div({ role: 'main' }, [
    h(centeredSpinner, { style: { position: 'fixed' } })
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
