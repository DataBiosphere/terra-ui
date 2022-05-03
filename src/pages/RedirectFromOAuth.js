import { UserManager } from 'oidc-client-ts'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { getOidcConfig } from 'src/libs/auth'
import { useOnMount } from 'src/libs/react-utils'


const RedirectFromOAuth = () => {
  const userManager = new UserManager(getOidcConfig())
  const url = window.location.href.replace('#', '')
  useOnMount(() => userManager.signinPopupCallback(url))
  return div({ role: 'main' }, [
    h(centeredSpinner, { style: { position: 'fixed' } })
  ])
}

export const navPaths = [
  {
    name: 'redirect-from-oauth',
    path: '/redirect-from-oauth',
    component: RedirectFromOAuth,
    public: true,
    title: 'Redirect From OAuth'
  }
]
