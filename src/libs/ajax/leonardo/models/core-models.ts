import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { DecoratedPersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { CloudProvider } from 'src/libs/workspace-utils';

export interface AuditInfo {
  creator: string;
  createdDate: string;
  destroyedDate?: string;
  dateAccessed: string;
}

export interface LeoError {
  errorMessage: string;
  timestamp: string;
}

export type LeoResourceLabels = Record<string, any>;

export interface CloudContext {
  cloudProvider: CloudProvider;
  cloudResource: string;
}

export type Resource = DecoratedPersistentDisk | App | Runtime;
