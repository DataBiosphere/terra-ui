import { atom } from '@terra-ui-packages/core-utils';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { useStore } from 'src/libs/react-utils';

import { Alert } from './Alert';

export const getLatestVersion = async (): Promise<string> => {
  const buildInfo = await fetch('/build-info.json').then((response) => response.json());
  return buildInfo.gitRevision;
};

export interface VersionState {
  currentVersion: string;
  latestVersion: string;
  isUpdateRequired: boolean;
}

export const versionStore = atom<VersionState>({
  currentVersion: getConfig().gitRevision,
  latestVersion: getConfig().gitRevision,
  isUpdateRequired: false,
});

export const useVersionAlerts = (): Alert[] => {
  const { currentVersion, latestVersion } = useStore(versionStore);

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

export const getBadVersions = async (): Promise<string[]> => {
  try {
    const versionsText = await Ajax().FirecloudBucket.getBadVersions();
    return versionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
      .filter((line) => !line.startsWith('#'));
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 404) {
      return [];
    }
    throw error;
  }
};
