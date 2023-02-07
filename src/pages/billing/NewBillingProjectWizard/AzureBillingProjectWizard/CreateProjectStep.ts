import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Select, spinnerOverlay, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { summarizeErrors, withBusyState } from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'

import { ExternalLink } from '../StepWizard/ExternalLink'


type CreateProjectStepProps = {
  isActive: boolean
  managedApps: AzureManagedAppCoordinates[]
  submit: (newProject: string) => void
  subscriptionId?: string
}


const managedAppsToOptions = (apps: AzureManagedAppCoordinates[]) => _.map(application => {
  return {
    value: application,
    label: !!application.region ?
      `${application.applicationDeploymentName} (${application.region})` :
      application.applicationDeploymentName
  }
}, apps)


export const CreateProjectStep = ({ isActive, managedApps, ...props }: CreateProjectStepProps) => {
  const [billingProjectName, setBillingProjectName] = useState<string>()
  const [nameErrors, setNameErrors] = useState<ReactNode>()
  const [existing, setExisting] = useState<string[]>([])

  const [selectedApp, setSelectedApp] = useState<AzureManagedAppCoordinates>()

  const [isCreating, setIsCreating] = useState(false)
  const appSelectId = useUniqueId()
  const nameInputId = useUniqueId()

  const createBillingProject = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    withBusyState(setIsCreating)
  )(async () => {
    if (!billingProjectName) return
    try {
      Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectCreateSubmit)
      const response = await Ajax().Billing
        .createAzureProject(billingProjectName, selectedApp?.tenantId, props.subscriptionId, selectedApp?.managedResourceGroupId)
      if (response.ok) {
        billingProjectName && props.submit(billingProjectName)
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


  const onNameInput = () => {
    Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectNameEntered)
    const errors = billingProjectName ?
      summarizeErrors(
        validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })?.billingProjectName
      ) : 'A name is required to create a billing project.'
    setNameErrors(errors)
  }

  const validSelections = () => !!billingProjectName && !nameErrors && !!selectedApp

  return Step({
    isActive, children: [
      StepHeader({
        title: 'STEP 2', children: [
          'Set up a Terra billing project. ',
          ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
          ' to find or create your managed resource group.'
        ]
      }),
      StepFields({
        disabled: !isActive, children: [
          LabeledField({
            label: 'Terra billing project',
            formId: nameInputId,
            required: true,
            style: { width: '30%' },
            children: [
              ValidatedInput({
                inputProps: {
                  id: nameInputId,
                  value: billingProjectName,
                  placeholder: 'Enter a name for the project',
                  onChange: setBillingProjectName,
                  onBlur: onNameInput
                },
                error: nameErrors
              })
            ]
          }),
          LabeledField({
            label: [
              'Unassigned managed application',
              InfoBox({
                style: { marginLeft: '0.25rem' }, children: [
                  'A managed application instance can only be assigned to a single Terra billing ',
                  'project. Only unassigned managed applications are included in the list below.'
                ]
              } as any)
            ],
            formId: appSelectId,
            required: true,
            children: [
              h(Select, {
                id: appSelectId,
                placeholder: 'Select a managed application',
                isDisabled: managedApps.length === 0,
                value: selectedApp,
                onChange: ({ value }) => {
                  Ajax().Metrics.captureEvent(Events.billingAzureCreationMRGSelected)
                  setSelectedApp(value)
                },
                options: managedAppsToOptions(managedApps)
              })
            ]
          }),
          ButtonPrimary({
            role: 'button',
            style: { margin: '2rem' },
            onClick: createBillingProject,
            disabled: !validSelections(),
            children: ['Create Billing Project']
          }),
        ]
      }),
      isCreating && spinnerOverlay
    ]
  })
}

