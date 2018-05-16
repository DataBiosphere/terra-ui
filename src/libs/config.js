import _ from 'lodash'


const loadConfig = _.memoize(async () => {
  const res = await fetch('config.json')
  return res.json()
})

export const getAgoraUrlRoot = async () => (await loadConfig()).agoraUrlRoot
export const getDockstoreUrlRoot = async () => (await loadConfig()).dockstoreUrlRoot
export const getGoogleClientId = async () => (await loadConfig()).googleClientId
export const getLeoUrlRoot = async () => (await loadConfig()).leoUrlRoot
export const getRawlsUrlRoot = async () => (await loadConfig()).rawlsUrlRoot
export const getSamUrlRoot = async () => (await loadConfig()).samUrlRoot
