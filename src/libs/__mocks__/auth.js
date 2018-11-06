import * as Utils from 'src/libs/utils'


export const authStore = Utils.atom({
  isSignedIn: true,
  acceptedTos: true
})


export const getBasicProfile = () => ({
  getEmail: () => 'me@example.com'
})
