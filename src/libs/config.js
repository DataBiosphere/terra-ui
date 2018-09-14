import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'


const loadConfig = _.memoize(async () => {
  const res = await fetch('config.json')
  return res.json()
})

export const configOverridesStore = Utils.atom(
  sessionStorage['config-overrides'] && JSON.parse(sessionStorage['config-overrides'])
)
configOverridesStore.subscribe(v => {
  if (!v) {
    sessionStorage.removeItem('config-overrides')
  } else {
    sessionStorage['config-overrides'] = JSON.stringify(v)
  }
})
// Values in this store will override config settings. This can be used from the console for testing.
window.configOverridesStore = configOverridesStore

const getConfig = async () => {
  return _.merge(await loadConfig(), configOverridesStore.get())
}

export const getAgoraUrlRoot = async () => (await getConfig()).agoraUrlRoot
export const getDevUrlRoot = async () => (await getConfig()).devUrlRoot
export const getDockstoreUrlRoot = async () => (await getConfig()).dockstoreUrlRoot
export const getFirecloudUrlRoot = async () => (await getConfig()).firecloudUrlRoot
export const getGoogleClientId = async () => (await getConfig()).googleClientId
export const getIsProd = async () => (await getConfig()).isProd
export const getLeoUrlRoot = async () => (await getConfig()).leoUrlRoot
export const getMarthaUrlRoot = async () => (await getConfig()).marthaUrlRoot
export const getOrchestrationUrlRoot = async () => (await getConfig()).orchestrationUrlRoot
export const getRawlsUrlRoot = async () => (await getConfig()).rawlsUrlRoot
export const getSamUrlRoot = async () => (await getConfig()).samUrlRoot
