import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'


export type CloudPlatform = 'GCP' | 'Azure'

export interface BillingProject {
  cloudPlatform: CloudPlatform
  projectName: string
  invalidBillingAccount: boolean
  roles: string[]
  status: string
  message?: string
}

export interface AzureBillingProject extends BillingProject {
  cloudPlatform: 'Azure'
  azureManagedAppCoordinates: AzureManagedAppCoordinates
}

export interface GCPBillingProject extends BillingProject {
  cloudPlatform: 'GCP'
  billingAccount: string
  servicePerimeter: string
}


