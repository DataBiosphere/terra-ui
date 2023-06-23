import { AppToolLabel } from 'src/analysis/utils/tool-utils';
import { AuditInfo, CloudContext, LeoError, LeoResourceLabels } from 'src/libs/ajax/leonardo/models/core-models';

export interface KubernetesRuntimeConfig {
  numNodes: number;
  machineType: string;
  autoscalingEnabled: boolean;
}

export interface AppError extends LeoError {
  action: string;
  source: string;
  googleErrorCode?: number;
  traceId?: string;
}

export type LeoAppStatus =
  | 'STATUS_UNSPECIFIED'
  | 'RUNNING'
  | 'ERROR'
  | 'DELETING'
  | 'DELETED'
  | 'PROVISIONING'
  | 'STOPPING'
  | 'STOPPED'
  | 'STARTING'
  | 'UPDATING';
export type DisplayAppStatus =
  | 'Running'
  | 'Deleted'
  | 'Deleting'
  | 'Creating'
  | 'Resuming'
  | 'Error'
  | 'Pausing'
  | 'Paused'
  | 'Status_unspecified'
  | 'Unknown'
  | 'Updating';

export interface AppStatusObject {
  status: LeoAppStatus;
  statusDisplay: DisplayAppStatus;
}

export const appStatuses: { [label: string]: AppStatusObject } = {
  running: { status: 'RUNNING', statusDisplay: 'Running' },
  error: { status: 'ERROR', statusDisplay: 'Error' },
  deleting: { status: 'DELETING', statusDisplay: 'Deleting' },
  deleted: { status: 'DELETED', statusDisplay: 'Deleted' },
  provisioning: { status: 'PROVISIONING', statusDisplay: 'Creating' },
  stopping: { status: 'STOPPING', statusDisplay: 'Pausing' },
  stopped: { status: 'STOPPED', statusDisplay: 'Paused' },
  starting: { status: 'STARTING', statusDisplay: 'Resuming' },
  updating: { status: 'UPDATING', statusDisplay: 'Updating' },
  status_unspecified: { status: 'STATUS_UNSPECIFIED', statusDisplay: 'Status_unspecified' },
};

export interface GetAppResponse {
  appName: string;
  cloudContext: CloudContext;
  kubernetesRuntimeConfig: KubernetesRuntimeConfig;
  errors: AppError[];
  status: LeoAppStatus;
  proxyUrls: Record<string, string>;
  diskName?: string;
  customEnvironmentVariables: Record<string, string>;
  auditInfo: AuditInfo;
  appType: AppToolLabel;
  labels: LeoResourceLabels;
}

export interface ListAppResponse {
  workspaceId?: string;
  appName: string;
  cloudContext: CloudContext;
  kubernetesRuntimeConfig: KubernetesRuntimeConfig;
  errors: AppError[];
  status: LeoAppStatus;
  proxyUrls: Record<string, string>;
  diskName?: string;
  auditInfo: AuditInfo;
  appType: AppToolLabel;
  labels: LeoResourceLabels;
}

export interface CreateAppV1Request {
  kubernetesRuntimeConfig: KubernetesRuntimeConfig;
  diskName: string;
  diskSize: number;
  diskType: string; // TODO: disk types IA-4095
  appType: AppToolLabel;
  // Once CromwellModal and GalaxyModal have tests, this should really use `GoogleWorkspaceInfo`
  namespace: string;
  bucketName: string;
  workspaceName: string;
}

export type App = GetAppResponse | ListAppResponse;

export const isApp = (obj: any): obj is App => {
  const castApp = obj as App;
  return castApp && castApp.appName !== undefined;
};
