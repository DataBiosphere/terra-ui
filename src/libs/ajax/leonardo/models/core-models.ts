import { CloudProvider } from 'src/libs/workspace-utils'


export interface AuditInfo {
  creator: string
  createdDate: string
  destroyedDate?: string
  dateAccessed: string
}

export interface LeoError {
  errorMessage: string
  timestamp: string
}

export type LeoResourceLabels = Record<string, any>

export interface CloudContext {
  cloudProvider: CloudProvider
  cloudResource: string
}

