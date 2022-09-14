import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'


export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

/**
 * Flags for hidden features
 */
export const isCromwellAppVisible = () => getConfig().isCromwellAppVisible
export const isDataBrowserFrontPage = () => false
