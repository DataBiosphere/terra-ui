import { h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { authStore } from 'src/libs/auth'
import * as Utils from 'src/libs/utils'
import { Disabled, Unlisted } from 'src/pages/Disabled'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import TermsOfService from 'src/pages/TermsOfService'


export default Utils.connectAtom(authStore, 'authState')(
  ({ children, isPublic, authState: { isSignedIn, registrationStatus, acceptedTos } }) => {
    return Utils.cond(
      [isSignedIn === undefined && !isPublic, centeredSpinner],
      [isSignedIn === false && !isPublic, h(SignIn)],
      [registrationStatus === undefined && !isPublic, centeredSpinner],
      [isPublic, children],
      [registrationStatus === 'unregistered', h(Register)],
      [registrationStatus === 'disabled', () => h(Disabled)],
      [registrationStatus === 'unlisted', () => h(Unlisted)],
      [acceptedTos === undefined && !isPublic, centeredSpinner],
      [acceptedTos === false, () => h(TermsOfService)],
      children
    )
  }
)
