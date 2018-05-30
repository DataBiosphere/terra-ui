import { h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { authStore } from 'src/libs/auth'
import * as Utils from 'src/libs/utils'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import Disabled from 'src/pages/Disabled'


export default Utils.connectAtom(authStore, 'authState')(
  ({ children, authState: { isSignedIn, registrationStatus } }) => {
    return Utils.cond(
      [isSignedIn === undefined, centeredSpinner],
      [isSignedIn === false, h(SignIn)],
      [registrationStatus === undefined, centeredSpinner],
      [registrationStatus === 'unregistered', h(Register)],
      [registrationStatus === 'disabled', () => h(Disabled)],
      children
    )
  }
)
