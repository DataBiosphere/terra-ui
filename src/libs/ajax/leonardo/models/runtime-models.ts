import { AuditInfo, CloudContext, LeoError, LeoResourceLabels } from '@terra-ui-packages/leonardo-data-client';
import { ToolLabel } from 'src/analysis/utils/tool-utils';
import { RawRuntimeConfig } from 'src/libs/ajax/leonardo/models/api-runtime-config';
import { RuntimeConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';

import { DiskType } from '../Disks';

export type LeoRuntimeStatus =
  | 'Running'
  | 'Deleted'
  | 'Deleting'
  | 'Creating'
  | 'Updating'
  | 'Starting'
  | 'Stopping'
  | 'Stopped'
  | 'Error'
  | 'PreStarting'
  | 'PreStopping';
export type DisplayRuntimeStatus =
  | 'Running'
  | 'Deleted'
  | 'Deleting'
  | 'Creating'
  | 'Updating'
  | 'Resuming'
  | 'Error'
  | 'Pausing'
  | 'Paused';

export interface RuntimeStatus {
  label: DisplayRuntimeStatus; // the UI display string for a status
  leoLabel: LeoRuntimeStatus; // the string Leo returns in the Runtime object
  canChangeCompute?: boolean;
}

// TODO: fields isAppStatus? LeoLabel? isRuntimeStatus?
export const runtimeStatuses: { [label: string]: RuntimeStatus } = {
  running: { label: 'Running', leoLabel: 'Running', canChangeCompute: true },
  deleted: { label: 'Deleted', leoLabel: 'Deleted' },
  deleting: { label: 'Deleting', leoLabel: 'Deleting' },
  creating: { label: 'Creating', leoLabel: 'Creating' },
  updating: { label: 'Updating', leoLabel: 'Updating' },
  starting: { label: 'Resuming', leoLabel: 'Starting' },
  stopping: { label: 'Pausing', leoLabel: 'Stopping' },
  stopped: { label: 'Paused', leoLabel: 'Stopped', canChangeCompute: true },
  error: { label: 'Error', leoLabel: 'Error', canChangeCompute: true },
};

export type RuntimeLabels = Omit<LeoResourceLabels, 'tool'> & {
  tool: ToolLabel;
};

export interface RuntimeError extends LeoError {
  errorCode: number;
}

export interface RawListRuntimeItem {
  id: number;
  workspaceId: string | null;
  runtimeName: string;
  googleProject: string;
  cloudContext: CloudContext;
  auditInfo: AuditInfo;
  runtimeConfig: RawRuntimeConfig;
  proxyUrl: string;
  status: LeoRuntimeStatus;
  labels: RuntimeLabels;
  patchInProgress: boolean;
}

export interface AsyncRuntimeFields {
  googleId: string;
  operationName: string;
  stagingBucket: string;
  hostIp: string;
}

export interface UserJupyterExtensionConfig {
  nbExtensions: Record<string, string>;
  serverExtensions: Record<string, string>;
  combinedExtensions: Record<string, string>;
  labExtensions: Record<string, string>;
}

export interface LeoRuntimeImage {
  imageType: string;
  imageUrl: string;
  timestamp: string;
}

export interface DiskConfig {
  name: string;
  size: number;
  diskType: DiskType;
  blockSize: number;
}

export interface RawGetRuntimeItem {
  id: number;
  runtimeName: string;
  googleProject: string;
  cloudContext: CloudContext;
  serviceAccount: string;
  asyncRuntimeFields: AsyncRuntimeFields | null;
  auditInfo: AuditInfo;
  runtimeConfig: RawRuntimeConfig;
  proxyUrl: string;
  status: LeoRuntimeStatus;
  labels: RuntimeLabels;
  userScriptUri: string | null;
  startUserScriptUri: string | null;
  jupyterUserScriptUri: string | null;
  jupyterStartUserScriptUri: string | null;
  errors: RuntimeError[];
  userJupyterExtensionConfig: UserJupyterExtensionConfig | null;
  autopauseThreshold: number;
  defaultClientId: string | null;
  runtimeImages: LeoRuntimeImage[];
  scopes: string[];
  customEnvironmentVariables: Record<string, any>;
  diskConfig: DiskConfig | null;
  patchInProgress: boolean;
}

export type ListRuntimeItem = {
  runtimeConfig: RuntimeConfig;
} & Omit<RawListRuntimeItem, 'runtimeConfig'>;

export type GetRuntimeItem = {
  runtimeConfig: RuntimeConfig;
} & Omit<RawGetRuntimeItem, 'runtimeConfig'>;

export type Runtime = GetRuntimeItem | ListRuntimeItem;

export const isRuntime = (obj: any): obj is Runtime => {
  const castRuntime = obj as Runtime;
  return (
    castRuntime &&
    castRuntime.runtimeConfig !== undefined &&
    castRuntime.runtimeName !== undefined &&
    castRuntime.cloudContext !== undefined
  );
};
