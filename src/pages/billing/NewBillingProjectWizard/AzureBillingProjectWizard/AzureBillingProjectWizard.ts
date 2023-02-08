import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import { withBusyState } from 'src/libs/utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepWizard'

import { AddUserInfo, AddUserStep } from './AddUserStep'
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
  const [users, setUsers] = useState<AddUserInfo[]>([])

  const [isCreating, setIsCreating] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AzureManagedAppCoordinates>()

  const [existing, setExisting] = useState<string[]>([])
  const signal = useCancellation()

  const onSubscriptionIdSelected = () => loadManagedApps(async () => {
    const json = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
    setActiveStep(2)
    return json.managedApps
  })

  const createBillingProject = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    withBusyState(setIsCreating)
  )(async () => {
    if (!billingProjectName) return
    try {
      Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateSubmit)
      const response = await Ajax().Billing
        .createAzureProject(billingProjectName, selectedApp?.tenantId, subscriptionId, selectedApp?.managedResourceGroupId)
      if (response.ok) {
        //billingProjectName && props.submit(billingProjectName)
        Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateSuccess)
      }
    } catch (error: any) {
      if (error?.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateFail)
        throw error
      }
    }
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
      selectedApp,
      setSelectedApp: app => {
        setSelectedApp(app)
        if (app && billingProjectName) {
          setActiveStep((3))
        }
      },
      billingProjectName,
      setBillingProjectName: name => {
        setBillingProjectName(name)
        if (name && selectedApp) {
          setActiveStep((3))
        }
      },
      managedApps: managedApps.status === 'Ready' ? managedApps.state : [],
      existingProjectNames: existing
    }),
    h(AddUserStep, { users, setUsers, isActive: activeStep === 3 }),
    div({ style: { margin: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' } }, [
      h(ButtonPrimary, { role: 'button', disabled: activeStep < 3, onClick: createBillingProject }, ['Submit'])
    ]),
    managedApps.status === 'Loading' && spinnerOverlay,
    isCreating && spinnerOverlay
  ])
}
