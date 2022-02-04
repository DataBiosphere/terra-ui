import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { useRoute } from 'src/libs/nav'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Disabled } from 'src/pages/Disabled'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import TermsOfService from 'src/pages/TermsOfService'


const AuthContainer = ({ children }) => {
  const { name, public: isPublic } = useRoute()
  const { isSignedIn, registrationStatus, acceptedTos, acceptedSamTos, profile } = useStore(authStore)
  const needToAccept = !(acceptedSamTos === null ? acceptedTos : acceptedSamTos) // acceptedSamTos will be null if Sam ToS enforcement is not yet live. Rely on acceptedTos (from Cloud Function) until Sam ToS is live
  const authspinner = () => h(centeredSpinner, { style: { position: 'fixed' } })

  return Utils.cond(
    [isSignedIn === undefined && !isPublic, authspinner],
    [isSignedIn === false && !isPublic, () => h(SignIn)],
    [registrationStatus === undefined && !isPublic, authspinner],
    [registrationStatus === 'unregistered', () => h(Register)],
    [registrationStatus === 'disabled', () => h(Disabled)],
    [acceptedTos === undefined && !isPublic, authspinner],
    [needToAccept === true && name !== 'privacy', () => h(TermsOfService)],
    [_.isEmpty(profile) && !isPublic, authspinner],
    () => children
  )
}

export default AuthContainer
