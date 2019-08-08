import { div } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const SignInButton = () => {
  Utils.useOnMount(() => {
    window.gapi.signin2.render('signInButton', {
      scope: 'openid profile email',
      width: 250,
      height: 56,
      longtitle: true,
      theme: 'light',
      prompt: 'select_account'
    })
  })

  return div({ id: 'signInButton' })
}

export default SignInButton
