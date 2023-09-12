import { ReactNode } from 'react';

export interface WorkspaceTab {
  key: string;
  title: ReactNode;
  tableName: string;
}

/*
key,
      title: span([_.upperCase(key), ` (${loadingWorkspaces ? '...' : filteredWorkspaces[key].length})`]),
      tableName: _.lowerCase(key),
      */
