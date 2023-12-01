import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { CloudProvider } from 'src/libs/workspace-utils';

export interface AuditInfo {
  creator: string;
  createdDate: string;
  destroyedDate: string | null;
  dateAccessed: string;
}

export interface IHaveCreator {
  auditInfo: Pick<AuditInfo, 'creator'>;
}

export interface LeoError {
  errorMessage: string;
  timestamp: string;
}

export type LeoResourceLabels = { [key: string]: string };

export interface CloudContext {
  cloudProvider: CloudProvider;
  cloudResource: string;
}

export type Resource = PersistentDisk | App | Runtime;
