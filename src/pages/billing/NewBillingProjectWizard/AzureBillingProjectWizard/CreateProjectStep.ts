import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Select, spinnerOverlay, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import { reportErrorAndRethrow } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { AzureManagedAppCoordinates, BillingProject } from 'src/pages/billing/models'
import { LabeledField, Step, StepFields, StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'
import { validate } from 'validate.js'

import { ExternalLink } from '../StepWizard/ExternalLink'


type CreateProjectStepProps = {
  isActive: boolean
  managedApps: AzureManagedAppCoordinates[]
  submit: (newProject: BillingProject) => void
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

  const [selectedApp, setSelectedApp] = useState<AzureManagedAppCoordinates>()

  const [isCreating, setIsCreating] = useState(false)
  const appSelectId = useUniqueId()
  const nameInputId = useUniqueId()

  const createBillingProject = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsCreating)
  )(async () => {
    try {
      const response = await Ajax().Billing
        .createAzureProject(billingProjectName, selectedApp?.tenantId, props.subscriptionId, selectedApp?.managedResourceGroupId)
      const json = await response.json()
      props.submit(json)
    } catch (error) {
      throw error
    }
  })


  const onNameInput = () => {
    const errors = billingProjectName ?
      Utils.summarizeErrors(
        // todo: not sure if we need validate against existing projects here, since the user shouldn't have any at this step...
        validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator([]) })?.billingProjectName
      ) : 'A name is required to create a billing project.'
    setNameErrors(errors)
  }

  const validSelections = () => !!billingProjectName && !nameErrors && !!selectedApp

  return Step({
    isActive, children: [
      StepHeader({
        title: 'STEP 2', description: [
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
                onChange: ({ value }) => setSelectedApp(value),
                options: managedAppsToOptions(managedApps)
              })
            ]
          }),
          ButtonPrimary({
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

