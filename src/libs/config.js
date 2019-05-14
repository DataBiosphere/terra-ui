import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import * as Utils from 'src/libs/utils'


export const configOverridesStore = Utils.atom()
Utils.syncAtomToSessionStorage(configOverridesStore, 'config-overrides')
// Values in this store will override config settings. This can be used from the console for testing.
window.configOverridesStore = configOverridesStore

export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before iniitialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

export const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
