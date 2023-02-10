import _ from 'lodash/fp'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import { withBusyState } from 'src/libs/utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { BillingRole } from 'src/pages/billing/models/BillingRole'
import { CreateProjectStep } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/CreateProjectStep'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepWizard'

import { AddUserInfo, AddUserStep } from './AddUserStep'
import { AzureSubscriptionIdStep } from './AzureSubscriptionIdStep'
import { ProjectFieldsStep } from './ProjectFieldsStep'


interface AzureBillingProjectWizardProps {
  onSuccess: (string) => void
}

export const userInfoListToProjectAccessObjects = (userInfo: AddUserInfo[]): Array<{email: string; role: BillingRole}> => _.flatten(userInfo.map(info => info.emails.split(',').map(email => ({ email: email.trim(), role: info.role }))))


export const AzureBillingProjectWizard = ({ ...props }: AzureBillingProjectWizardProps) => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [managedApps, loadManagedApps] = useLoadedData<AzureManagedAppCoordinates[]>()
  const [billingProjectName, setBillingProjectName] = useState<string>()
  const [users, setUsers] = useState<AddUserInfo[]>([])

  const [isCreating, setIsCreating] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AzureManagedAppCoordinates>()

  const [existingProjectNames, setExistingProjectNames] = useState<string[]>([])
  const signal = useCancellation()

  const onSubscriptionIdSelected = () => loadManagedApps(async () => {
    const json = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
    stepFinished(1, true)
    return json.managedApps
  })


  const createBillingProject = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    withBusyState(setIsCreating)
  )(async () => {
    if (!billingProjectName) return
    try {
      Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateSubmit)

      const members = userInfoListToProjectAccessObjects(users)
      const response = await Ajax().Billing
        .createAzureProject(billingProjectName, selectedApp?.tenantId, subscriptionId, selectedApp?.managedResourceGroupId, members)
      if (response.ok) {
        Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateSuccess)
      }
    } catch (error: any) {
      if (error?.status === 409) {
        setExistingProjectNames(_.concat(billingProjectName, existingProjectNames))
      } else {
        Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateFail)
        throw error
      }
    }
  })

  const stepFinished = (step: number, finished: boolean) => {
    if (finished && activeStep === step) { // the user completed the active step
      setActiveStep(step + 1)
    } else if (!finished && activeStep > step) { // the user went back
      setActiveStep(step)
    } // the user is entering fields for later steps - don't change active step
  }

  return h(StepWizard, { title: 'Create an Azure Billing Project', intro: 'intro Text' }, [
    h(AzureSubscriptionIdStep, {
      isActive: activeStep === 1,
      subscriptionId,
      onChange: subscriptionId => {
        stepFinished(1, false)
        setSubscriptionId(subscriptionId)
      },
      submit: onSubscriptionIdSelected
    }),
    ProjectFieldsStep({
      isActive: activeStep === 2,
      stepFinished: finished => stepFinished(2, finished),
      selectedApp,
      setSelectedApp,
      billingProjectName,
      setBillingProjectName,
      managedApps: managedApps.status === 'Ready' ? managedApps.state : [],
      existingProjectNames
    }),
    h(AddUserStep, { users, setUsers, isActive: activeStep === 3 }),
    h(CreateProjectStep, {
      createBillingProject,
      isActive: activeStep > 2,
      createReady: activeStep > 2 && !!subscriptionId && !!billingProjectName && !!selectedApp
    }),
    managedApps.status === 'Loading' && spinnerOverlay,
    isCreating && spinnerOverlay
  ])
}
