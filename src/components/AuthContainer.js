import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { useRoute } from 'src/libs/nav'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Disabled } from 'src/pages/Disabled'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import TermsOfService from 'src/pages/TermsOfService'


const AuthContainer = ({ children }) => {
  const { public: isPublic } = useRoute()
  const { isSignedIn, registrationStatus, acceptedTos, profile } = Utils.useStore(authStore)
  return Utils.cond(
    [isSignedIn === undefined && !isPublic, centeredSpinner],
    [isSignedIn === false && !isPublic, h(SignIn)],
    [registrationStatus === undefined && !isPublic, centeredSpinner],
    [registrationStatus === 'unregistered', h(Register)],
    [registrationStatus === 'disabled', () => h(Disabled)],
    [acceptedTos === undefined && !isPublic, centeredSpinner],
    [acceptedTos === false, () => h(TermsOfService)],
    [_.isEmpty(profile) && !isPublic, centeredSpinner],
    children
  )
}

export default AuthContainer
