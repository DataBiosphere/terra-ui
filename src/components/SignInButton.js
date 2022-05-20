import { useEffect } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { isAuthSettled } from 'src/libs/auth'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


const SignInButton = ({ theme = 'light', ...props }) => {
  const auth = useStore(authStore)

  const isGoogleAuthInitialized = isAuthSettled(auth)

  useEffect(() => {
    if (isGoogleAuthInitialized) {
      window.gapi.signin2.render('signInButton', {
        scope: 'openid profile email',
        width: 250,
        height: 56,
        longtitle: true,
        theme,
        prompt: 'select_account'
      })
    }
  }, [isGoogleAuthInitialized, theme])

  // For some reason, Google's rendered Sign-In button is not at all keyboard accessible.
  // To fix this, we wrap it as a button, and propagate the keyboard-accessible click event down to
  // the inner DOM node inside the button, then let it bubble up to whatever it is that catches it.
  return !isGoogleAuthInitialized ? spinner() : h(Clickable, {
    ...props,
    id: 'signInButton',
    onClick: event => {
      const elts = event.target.getElementsByClassName('abcRioButtonContents') // This could potentially be unstable if Google changes their markup
      if (elts.length > 0) {
        elts.item(0).click()
      }
    },
    style: { outlineOffset: 5 }
  })
}

export default SignInButton
