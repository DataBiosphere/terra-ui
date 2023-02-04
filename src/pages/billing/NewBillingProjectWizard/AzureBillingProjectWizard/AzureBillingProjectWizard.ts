import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { useCancellation } from 'src/libs/react-utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { BillingProject } from 'src/pages/billing/models/BillingProject'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepWizard'

import { AddUserStep } from './AddUserStep'
import { AzureSubscriptionIdStep } from './AzureSubscriptionIdStep'
import { CreateProjectStep } from './CreateProjectStep'


interface AzureBillingProjectWizardProps {

}

export const AzureBillingProjectWizard = ({ ...props }: AzureBillingProjectWizardProps) => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [managedApps, loadManagedApps] = useLoadedData<AzureManagedAppCoordinates[]>()
  const [billingProject, setBillingProject] = useState<BillingProject>()

  const signal = useCancellation()

  const onSubscriptionIdSelected = () => loadManagedApps(async () => {
    const json = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
    setActiveStep(2)
    return json.managedApps
  })

  return h(StepWizard,
    { title: 'Create an Azure Billing Project', intro: 'intro Text' },
    [
      AzureSubscriptionIdStep({
        isActive: activeStep === 1,
        subscriptionId,
        onChange: setSubscriptionId,
        submit: onSubscriptionIdSelected
      }),
      CreateProjectStep({
        isActive: activeStep === 2,
        subscriptionId,
        managedApps: managedApps.status === 'Ready' ? managedApps.state : [],
        submit: (newProject: BillingProject) => {
          setBillingProject(newProject)
          setActiveStep(3)
        }
      }),
      AddUserStep({ billingProject, isActive: activeStep === 3 }),
      managedApps.status === 'Loading' && spinnerOverlay
    ]
  )
}


