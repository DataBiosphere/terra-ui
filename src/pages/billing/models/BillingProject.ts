import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'


export interface BillingProject {
  projectName: string
  billingAccount: string
  servicePerimeter: string
  invalidBillingAccount: boolean
  roles: string[]
  status: string
  message: string
  azureManagedAppCoordinates?: AzureManagedAppCoordinates
  cloudPlatform: 'GCP' | 'Azure'
}


