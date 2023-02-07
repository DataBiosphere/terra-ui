import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { useCancellation } from 'src/libs/react-utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepWizard'

import { AddUserStep } from './AddUserStep'
import { AzureSubscriptionIdStep } from './AzureSubscriptionIdStep'
import { CreateProjectStep } from './CreateProjectStep'


interface AzureBillingProjectWizardProps {
  onSuccess: (string) => void
}

export const AzureBillingProjectWizard = ({ ...props }: AzureBillingProjectWizardProps) => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [managedApps, loadManagedApps] = useLoadedData<AzureManagedAppCoordinates[]>()
  const [billingProjectName, setBillingProjectName] = useState<string>()

  const signal = useCancellation()

  const onSubscriptionIdSelected = () => loadManagedApps(async () => {
    const json = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
    setActiveStep(2)
    return json.managedApps
  })

  return h(StepWizard, { title: 'Create an Azure Billing Project', intro: 'intro Text' }, [
    h(AzureSubscriptionIdStep, {
      isActive: activeStep === 1,
      subscriptionId,
      onChange: setSubscriptionId,
      submit: onSubscriptionIdSelected
    }),
    CreateProjectStep({
      isActive: activeStep === 2,
      subscriptionId,
      managedApps: managedApps.status === 'Ready' ? managedApps.state : [],
      submit: (newProject: string) => {
        setBillingProjectName(newProject)
        setActiveStep(3)
      }
    }),
    h(AddUserStep, { billingProjectName, isActive: activeStep === 3 }),
    div({ style: { margin: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' } }, [
      h(ButtonPrimary, { role: 'button', disabled: activeStep < 3, onClick: props.onSuccess }, ['Finish'])
    ]),
    managedApps.status === 'Loading' && spinnerOverlay
  ])
}

