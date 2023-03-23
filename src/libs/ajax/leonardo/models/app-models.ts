import { AuditInfo, CloudContext, LeoError, LeoResourceLabels } from 'src/libs/ajax/leonardo/models/core-models'
import { AppToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


export interface KubernetesRuntimeConfig {
  numNodes: number
  machineType: string
  autoscalingEnabled: boolean
}

export interface AppError extends LeoError {
  action: string
  source: string
  googleErrorCode?: number
  traceId?: string
}

export type AppStatus = 'STATUS_UNSPECIFIED' | 'RUNNING' | 'ERROR' | 'DELETING' | 'DELETED' | 'PROVISIONING' | 'STOPPING' | 'STOPPED' | 'STARTING'

export interface GetAppResponse {
  appName: string
  cloudContext: CloudContext
  kubernetesRuntimeConfig: KubernetesRuntimeConfig
  errors: AppError[]
  status: AppStatus
  proxyUrls: Record<string, string>
  diskName?: string
  customEnvironmentVariables: Record<string, string>
  auditInfo: AuditInfo
  appType: AppToolLabel
  labels: LeoResourceLabels
}

export interface ListAppResponse {
  workspaceId?: string
  appName: string
  cloudContext: CloudContext
  kubernetesRuntimeConfig: KubernetesRuntimeConfig
  errors: AppError[]
  status: AppStatus
  proxyUrls: Record<string, string>
  diskName?: string
  auditInfo: AuditInfo
  appType: AppToolLabel
  labels: LeoResourceLabels
}

export interface CreateAppV1Request {
  kubernetesRuntimeConfig: KubernetesRuntimeConfig
  diskName: string
  diskSize: number
  diskType: string //TODO: disk types IA-4095
  appType: AppToolLabel
  // Once CromwellModal and GalaxyModal have tests, this should really use `GoogleWorkspaceInfo`
  namespace: string
  bucketName: string
  workspaceName: string
}


export type App = GetAppResponse | ListAppResponse

export const isApp = (obj: any): obj is App => {
  const castApp = obj as App
  return castApp && castApp.appName !== undefined
}


