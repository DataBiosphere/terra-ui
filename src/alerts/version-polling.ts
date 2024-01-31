import { withErrorIgnoring } from 'src/libs/error';

import { getBadVersions, getLatestVersion, versionStore } from './version-alerts';

export const VERSION_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const FORCED_UPDATE_DELAY = 10 * 60 * 1000; // 10 minutes

export const checkVersion = withErrorIgnoring(async (): Promise<void> => {
  const { currentVersion } = versionStore.get();

  const latestVersion = await getLatestVersion();
  versionStore.update((value) => ({ ...value, latestVersion }));

  if (latestVersion !== currentVersion) {
    const badVersions = await getBadVersions();
    if (badVersions.includes(currentVersion)) {
      versionStore.update((value) => ({
        ...value,
        updateRequiredBy:
          value.updateRequiredBy === undefined ? Date.now() + FORCED_UPDATE_DELAY : value.updateRequiredBy,
      }));
    }
  }
});

export const startPollingVersion = (): (() => void) => {
  const interval = setInterval(checkVersion, VERSION_POLLING_INTERVAL);
  return () => clearInterval(interval);
};
