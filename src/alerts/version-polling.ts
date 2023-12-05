import _ from 'lodash/fp';

import { getLatestVersion, latestVersionStore } from './version-alerts';

export const VERSION_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const startPollingVersion = (): (() => void) => {
  const loadLatestVersion = () => getLatestVersion().then((version) => latestVersionStore.set(version), _.noop);

  const interval = setInterval(loadLatestVersion, VERSION_POLLING_INTERVAL);
  return () => clearInterval(interval);
};
