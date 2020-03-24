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
  const { name, public: isPublic } = useRoute()
  const { isSignedIn, registrationStatus, acceptedTos, profile } = Utils.useStore(authStore)
  const spinner = () => h(centeredSpinner, { size: 48, style: { right: 'calc(50vw - 24px)', left: 'calc(50vw - 24px)' } })

  return Utils.cond(
    [isSignedIn === undefined && !isPublic, spinner],
    [isSignedIn === false && !isPublic, h(SignIn)],
    [registrationStatus === undefined && !isPublic, spinner],
    [registrationStatus === 'unregistered', h(Register)],
    [registrationStatus === 'disabled', () => h(Disabled)],
    [acceptedTos === undefined && !isPublic, spinner],
    [acceptedTos === false && name !== 'privacy', () => h(TermsOfService)],
    [_.isEmpty(profile) && !isPublic, spinner],
    children
  )
}

export default AuthContainer
