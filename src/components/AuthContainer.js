import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { viewportSpinner } from 'src/components/icons'
import { useRoute } from 'src/libs/nav'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Disabled } from 'src/pages/Disabled'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import TermsOfService from 'src/pages/TermsOfService'


const AuthContainer = ({ children }) => {
  const { name, public: isPublic } = useRoute()
  const { isSignedIn, registrationStatus, acceptedTos, profile } = Utils.useStore(authStore)

  return Utils.cond(
    [isSignedIn === undefined && !isPublic, viewportSpinner],
    [isSignedIn === false && !isPublic, h(SignIn)],
    [registrationStatus === undefined && !isPublic, viewportSpinner],
    [registrationStatus === 'unregistered', h(Register)],
    [registrationStatus === 'disabled', () => h(Disabled)],
    [acceptedTos === undefined && !isPublic, viewportSpinner],
    [acceptedTos === false && name !== 'privacy', () => h(TermsOfService)],
    [_.isEmpty(profile) && !isPublic, viewportSpinner],
    children
  )
}

export default AuthContainer
