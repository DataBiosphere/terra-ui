import _ from 'lodash/fp'
import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { processUser, reloadAuthToken } from 'src/libs/auth'
import { useOnMount } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


const AuthStoreSetter = () => {
  const auth = useAuth()
  useOnMount(() => authStore.update(_.set(['authContext'], auth)))

  useEffect(() => {
    return auth.events.addAccessTokenExpiring(reloadAuthToken)
  }, [auth])

  useEffect(() => {
    return auth.events.addUserLoaded(processUser)
  }, [auth])

  useEffect(() => {
    return auth.events.addUserUnloaded(processUser)
  }, [auth])

  return null
}

export default AuthStoreSetter
