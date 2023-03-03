import { AuditInfo } from 'src/libs/ajax/leonardo/models/core-models'
import { Tool } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


export type SaturnType = 'GALAXY'|'CROMWELL'

export type appRuntimeStatusType = 'RUNNING'
    | 'DELETED'
    | 'DELETING'
    | 'CREATING'
    | 'UPDATING'
    | 'STARTING'
    | 'STOPPING'
    | 'STOPPED'
    | 'ERROR'
    | 'PRESTARTING'
    | 'PRESTOPPING'
    | 'PRECREATING'
    | 'PREDELETING'

export interface AppType {
  appName: string
  auditInfo: AuditInfo
  diskName: string
  errors: any[]//TODO: type?
  googleProject: string
  labels: {
    tool?:Tool
    saturnApplication: SaturnType
    saturnWorkspaceName:string
  }|{}
  proxyUrls: {
    galaxy?: string
    wds?: string
    'cromwell-service'?: string
    'cbas-ui'?: string
  }
  appType: string
  kubernetesRuntimeConfig: {
    numNodes: number
    machineType: string
    autoscalingEnabled: boolean
  }
  status: appRuntimeStatusType
}
