import _ from 'lodash/fp'
import { useEffect } from 'react'
import { h } from 'react-hyperscript-helpers'
import { useAuth } from 'react-oidc-context'
import { centeredSpinner } from 'src/components/icons'
import { useRoute } from 'src/libs/nav'
import { useOnMount, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Disabled } from 'src/pages/Disabled'
import Register from 'src/pages/Register'
import SignIn from 'src/pages/SignIn'
import TermsOfService from 'src/pages/TermsOfService'


const AuthContainer = ({ children }) => {
  const { name, public: isPublic } = useRoute()
  const { isSignedIn, registrationStatus, acceptedTos, profile } = useStore(authStore)
  const auth = useAuth()
  const authspinner = () => h(centeredSpinner, { style: { position: 'fixed' } })

  useOnMount(() => authStore.update(_.set(['authContext'], auth)))

  return Utils.cond(
    [isSignedIn === undefined && !isPublic, authspinner],
    [isSignedIn === false && !isPublic, () => h(SignIn)],
    [registrationStatus === undefined && !isPublic, authspinner],
    [registrationStatus === userStatus.unregistered, () => h(Register)],
    [acceptedTos === undefined && !isPublic, authspinner],
    [acceptedTos === false && name !== 'privacy', () => h(TermsOfService)],
    [registrationStatus === userStatus.disabled, () => h(Disabled)],
    [_.isEmpty(profile) && !isPublic, authspinner],
    () => children
  )
}

export default AuthContainer
