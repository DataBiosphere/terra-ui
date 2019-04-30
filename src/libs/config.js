import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'

let loadedConfig
export const loadConfig = async () => {
  const res = await fetch('config.json')
  loadedConfig = await res.json()
}

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

export const getConfig = () => {
  console.assert(loadedConfig, 'Called getConfig before iniitialization')
  return _.merge(loadedConfig, configOverridesStore.get())
}

export const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
