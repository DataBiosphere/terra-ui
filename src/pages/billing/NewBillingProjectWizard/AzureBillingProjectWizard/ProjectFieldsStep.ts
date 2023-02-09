import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Select, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { summarizeErrors } from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'

import { ExternalLink } from '../StepWizard/ExternalLink'


interface CreateProjectStepProps {
  isActive: boolean
  stepFinished: (boolean) => void // signals next step, and returns focus later if the user goes back
  managedApps: AzureManagedAppCoordinates[]
  selectedApp?: AzureManagedAppCoordinates
  setSelectedApp: (AzureManagedAppCoordinates) => void
  billingProjectName?: string
  setBillingProjectName: (string) => void
  existingProjectNames: string[]
}


const managedAppsToOptions = (apps: AzureManagedAppCoordinates[]) => _.map(application => {
  return {
    value: application,
    label: !!application.region ?
      `${application.applicationDeploymentName} (${application.region})` :
      application.applicationDeploymentName
  }
}, apps)


export const ProjectFieldsStep = ({
  isActive,
  managedApps,
  selectedApp,
  billingProjectName,
  ...props
}: CreateProjectStepProps) => {
  const [nameErrors, setNameErrors] = useState<ReactNode>()
  const appSelectId = useUniqueId()
  const nameInputId = useUniqueId()


  const onNameInput = () => {
    Ajax().Metrics.captureEvent(Events.billingAzureCreationProjectNameEntered)
    const errors = billingProjectName ?
      summarizeErrors(
        validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(props.existingProjectNames) })?.billingProjectName
      ) : 'A name is required to create a billing project.'
    setNameErrors(errors)
    if (!errors && !!selectedApp) {
      props.stepFinished(true)
    }
  }

  return h(Step, { isActive, style: { height: '13rem' } }, [
    h(StepHeader, { title: 'STEP 2' }, [
      'Set up a Terra billing project. ',
      ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
      ' to find or create your managed resource group.'
    ]),
    h(StepFields, { style: { justifyContent: 'flex-start', width: '75%', marginTop: '1rem' } }, [
      h(LabeledField, { label: 'Terra billing project', formId: nameInputId, required: true, style: { width: '30%', marginLeft: 0, marginRight: '2rem' } }, [
        ValidatedInput({
          error: nameErrors,
          inputProps: {
            id: nameInputId,
            value: billingProjectName,
            placeholder: 'Enter a name for the project',
            onChange: value => {
              if (!isActive) {
                props.stepFinished(false)
              }
              props.setBillingProjectName(value)
            },
            onBlur: onNameInput
          }
        })
      ]),
      h(LabeledField, {
        formId: appSelectId, required: true, label: [
          'Unassigned managed application',
          h(InfoBox, { style: { marginLeft: '0.25rem' } } as any, [
            'A managed application instance can only be assigned to a single Terra billing ',
            'project. Only unassigned managed applications are included in the list below.'
          ])
        ]
      }, [
        h(Select, {
          id: appSelectId,
          placeholder: 'Select a managed application',
          isDisabled: managedApps.length === 0,
          value: selectedApp,
          onChange: ({ value }) => {
            if (!isActive) {
              props.stepFinished(false)
            }
            Ajax().Metrics.captureEvent(Events.billingAzureCreationMRGSelected)
            props.setSelectedApp(value)
          },
          onBlur: () => {
            if (!!billingProjectName && !nameErrors && !!selectedApp) {
              props.stepFinished(true)
            }
          },
          options: managedAppsToOptions(managedApps)
        })
      ]),
    ]),
  ])
}

