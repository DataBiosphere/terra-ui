import { getConfig } from 'src/libs/config';
import { withErrorIgnoring } from 'src/libs/error';

import { getBadVersions, getLatestVersion, latestVersionStore } from './version-alerts';

export const VERSION_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const checkVersion = withErrorIgnoring(async (): Promise<void> => {
  const currentVersion = getConfig().gitRevision;

  const latestVersion = await getLatestVersion();
  latestVersionStore.set(latestVersion);

  if (latestVersion !== currentVersion) {
    const badVersions = await getBadVersions();
    if (badVersions.includes(currentVersion)) {
      window.location.reload();
    }
  }
});

export const startPollingVersion = (): (() => void) => {
  const interval = setInterval(checkVersion, VERSION_POLLING_INTERVAL);
  return () => clearInterval(interval);
};
