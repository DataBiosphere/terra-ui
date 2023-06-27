import _ from 'lodash/fp';
import { loadedConfigStore } from 'src/configStore';
import { configOverridesStore } from 'src/libs/state';

export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization');
  return _.merge(loadedConfigStore.current, configOverridesStore.get());
};

/**
 * Flags for hidden features
 */
export const isCromwellAppVisible = () => getConfig().isCromwellAppVisible;
export const isAzureWorkflowsTabVisible = () => getConfig().isAzureWorkflowsTabVisible;
export const isAxeEnabled = () => {
  const storedValue = getConfig().isAxeEnabled;
  const isDev = process.env.NODE_ENV === 'development';
  // It would be nice to be able to enable this on PR sites (production) if the feature flag is enabled,
  // but unfortunately axe-core only works on page refreshes in that environment.
  if (!isDev && !!storedValue) {
    console.log('axe accessibility checking can only be enabled when terra-ui is running in a development environment'); // eslint-disable-line no-console
  }
  if (isDev) {
    if (_.isUndefined(storedValue) || storedValue) {
      console.log('axe accessibility checking is running, and this can negatively impact UI performance'); // eslint-disable-line no-console
      console.log('to disable: window.configOverridesStore.set({ isAxeEnabled: false })'); // eslint-disable-line no-console
    } else {
      console.log('axe accessibility checking is disabled'); // eslint-disable-line no-console
      console.log('to enable: window.configOverridesStore.set({ isAxeEnabled: true })'); // eslint-disable-line no-console
    }
  }
  return isDev ? _.isUndefined(storedValue) || storedValue : false;
};
