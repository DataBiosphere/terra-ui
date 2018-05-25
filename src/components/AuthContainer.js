import { h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { authStore } from 'src/libs/auth'
import * as Utils from 'src/libs/utils'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'


export default Utils.connectAtom(authStore, 'authState')(
  ({ children, authState: { isSignedIn, isRegistered } }) => {
    return Utils.cond(
      [isSignedIn === undefined, centeredSpinner],
      [isSignedIn === false, h(SignIn)],
      [isRegistered === undefined, centeredSpinner],
      [isRegistered === false, h(Register)],
      children
    )
  }
)
