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
export const isAxeEnabled = () => {
  const storedValue = getConfig().isAxeEnabled
  // It would be nice to be able to enable this on PR sites (production) if the feature flag is enabled,
  // but unfortunately axe-core only works on page refreshes in that environment.
  return process.env.NODE_ENV !== 'development' ? false : _.isUndefined(storedValue) || storedValue
}
