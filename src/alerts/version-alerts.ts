import { atom } from '@terra-ui-packages/core-utils';
import { getConfig } from 'src/libs/config';
import { useStore } from 'src/libs/react-utils';

import { Alert } from './Alert';

export const getLatestVersion = async (): Promise<string> => {
  const buildInfo = await fetch('/build-info.json').then((response) => response.json());
  return buildInfo.gitRevision;
};

export const latestVersionStore = atom<string>(getConfig().gitRevision);

export const useLatestVersion = (): string => useStore(latestVersionStore);

export const useVersionAlerts = (): Alert[] => {
  const latestVersion = useLatestVersion();
  const currentVersion = getConfig().gitRevision;

  if (currentVersion === latestVersion) {
    return [];
  }

  return [
    {
      id: 'update-available',
      title: 'Update available',
      message: 'A new version of Terra is available. Refresh your browser to update.',
      severity: 'info',
    },
  ];
};
