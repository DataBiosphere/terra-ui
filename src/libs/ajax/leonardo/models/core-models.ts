import { CloudProvider } from 'src/libs/workspace-utils'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export interface AuditInfo {
  creator: string
  createdDate: string
  destroyedDate?: string
  dateAccessed: string
}

export interface BaseLabels {
  tool: ToolLabel
}

export type LeoResourceLabels = BaseLabels & Record<string, any>

export interface CloudContext {
  cloudProvider: CloudProvider
  cloudResource: string
}

export interface LeoError {
  errorMessage: string
  errorCode: number
  timestamp: string
}
