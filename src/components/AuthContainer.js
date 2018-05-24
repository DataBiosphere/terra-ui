import { h } from 'react-hyperscript-helpers'
import { spinner } from 'src/components/icons'
import { authStore } from 'src/libs/auth'
import * as Utils from 'src/libs/utils'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'


export default Utils.connectAtom(authStore, 'authState')(
  ({ children, authState: { isSignedIn, isRegistered } }) => {
    return Utils.cond(
      [isSignedIn === undefined, spinner],
      [isSignedIn === false, h(SignIn)],
      [isRegistered === undefined, spinner],
      [isRegistered === false, h(Register)],
      children
    )
  }
)
