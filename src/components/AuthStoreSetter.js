import _ from 'lodash/fp'
import { useAuth } from 'react-oidc-context'
import { useOnMount } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


const AuthStoreSetter = () => {
  const auth = useAuth()
  useOnMount(() => authStore.update(_.set(['authContext'], auth)))
  return null
}

export default AuthStoreSetter
