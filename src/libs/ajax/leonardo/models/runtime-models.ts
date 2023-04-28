import { AuditInfo, CloudContext, LeoError, LeoResourceLabels } from "src/libs/ajax/leonardo/models/core-models";
import { DiskConfig } from "src/libs/ajax/leonardo/models/disk-models";
import { RuntimeConfig } from "src/libs/ajax/leonardo/models/runtime-config-models";
import { ToolLabel } from "src/pages/workspaces/workspace/analysis/utils/tool-utils";

export type LeoRuntimeStatus =
  | "Running"
  | "Deleted"
  | "Deleting"
  | "Creating"
  | "Updating"
  | "Starting"
  | "Stopping"
  | "Stopped"
  | "Error"
  | "PreStarting"
  | "PreStopping";
export type DisplayRuntimeStatus =
  | "Running"
  | "Deleted"
  | "Deleting"
  | "Creating"
  | "Updating"
  | "Resuming"
  | "Error"
  | "Pausing"
  | "Paused";

export interface RuntimeStatus {
  label: DisplayRuntimeStatus; // the UI display string for a status
  leoLabel: LeoRuntimeStatus; // the string Leo returns in the Runtime object
  canChangeCompute?: boolean;
}

// TODO: fields isAppStatus? LeoLabel? isRuntimeStatus?
export const runtimeStatuses: { [label: string]: RuntimeStatus } = {
  running: { label: "Running", leoLabel: "Running", canChangeCompute: true },
  deleted: { label: "Deleted", leoLabel: "Deleted" },
  deleting: { label: "Deleting", leoLabel: "Deleting" },
  creating: { label: "Creating", leoLabel: "Creating" },
  updating: { label: "Updating", leoLabel: "Updating" },
  starting: { label: "Resuming", leoLabel: "Starting" },
  stopping: { label: "Pausing", leoLabel: "Stopping" },
  stopped: { label: "Paused", leoLabel: "Stopped", canChangeCompute: true },
  error: { label: "Error", leoLabel: "Error", canChangeCompute: true },
};

export interface RuntimeLabels extends LeoResourceLabels {
  tool: ToolLabel;
}

export interface RuntimeError extends LeoError {
  errorCode: number;
}

export interface ListRuntimeItem {
  id: number;
  workspaceId?: string;
  runtimeName: string;
  googleProject: string;
  cloudContext: CloudContext;
  auditInfo: AuditInfo;
  runtimeConfig: RuntimeConfig;
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

export interface GetRuntimeItem {
  id: number;
  runtimeName: string;
  googleProject: string;
  cloudContext: CloudContext;
  serviceAccount: string;
  asyncRuntimeFields?: AsyncRuntimeFields;
  auditInfo: AuditInfo;
  runtimeConfig: RuntimeConfig;
  proxyUrl: string;
  status: LeoRuntimeStatus;
  labels: RuntimeLabels;
  userScriptUri?: string;
  startUserScriptUri?: string;
  jupyterUserScriptUri?: string;
  jupyterStartUserScriptUri?: string;
  errors: RuntimeError[];
  userJupyterExtensionConfig?: UserJupyterExtensionConfig;
  autopauseThreshold: number;
  defaultClientId?: string;
  runtimeImages: LeoRuntimeImage[];
  scopes: string[];
  customEnvironmentVariables: Record<string, any>;
  diskConfig?: DiskConfig;
  patchInProgress: boolean;
}

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
