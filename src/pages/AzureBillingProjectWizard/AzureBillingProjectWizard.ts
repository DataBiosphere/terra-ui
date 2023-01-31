import _ from 'lodash/fp'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { reportErrorAndRethrow } from 'src/libs/error'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { AddUserStep } from 'src/pages/AzureBillingProjectWizard/AddUserStep'
import { AzureSubscriptionIdStep } from 'src/pages/AzureBillingProjectWizard/AzureSubscriptionIdStep'
import { CreateProjectStep } from 'src/pages/AzureBillingProjectWizard/CreateProjectStep'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { BillingProject } from 'src/pages/billing/models'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { StepWizard } from 'src/pages/billing/StepWizard'
import { validate } from 'validate.js'


type AzureBillingProjectWizardProps = {}

export const AzureBillingProjectWizard = ({ ...props }: AzureBillingProjectWizardProps) => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [managedApps, setManagedApps] = useState<AzureManagedAppCoordinates[]>([])
  const [billingProject, setBillingProject] = useState<BillingProject>()
  const [isBusy, setIsBusy] = useState(false)

  const signal = useCancellation()


  const onSubscriptionIdSelected = _.flow(
    reportErrorAndRethrow('Error retrieving Azure subscriptions'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    const json = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
    setManagedApps(json.managedApps)
    setActiveStep(2)
  })


  return h(StepWizard,
    { title: 'Hello', intro: 'intro Text' },
    [
      AzureSubscriptionIdStep({
        isActive: activeStep === 1,
        subscriptionId,
        onChange: setSubscriptionId,
        submit: onSubscriptionIdSelected
      }),
      CreateProjectStep({
        isActive: activeStep === 2,
        billingProjectNameValidator: (billingProjectName: String) => validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator([]) }), // todo: use real projects
        managedApps,
        submit: (newProject: BillingProject) => {
          setBillingProject(newProject)
          setActiveStep(3)
        }
      }),
      AddUserStep({ billingProject, isActive: activeStep === 3 }),
      isBusy && spinnerOverlay
    ]
  )
}


