import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


Utils.syncAtomToSessionStorage(configOverridesStore, 'config-overrides')

export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

export const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
export const isDatastage = () => (window.location.hostname === 'datastage.terra.bio') || getConfig().isDatastage
export const isAnvil = () => (window.location.hostname === 'anvil.terra.bio') || getConfig().isAnvil
export const isTerra = () => !isFirecloud() && !isDatastage() && !isAnvil()
