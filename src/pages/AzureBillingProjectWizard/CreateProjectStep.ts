import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Select, spinnerOverlay, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import { reportErrorAndRethrow } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { AzureManagedAppCoordinates, BillingProject } from 'src/pages/billing/models'
import { Step, StepTitle } from 'src/pages/billing/StepWizard'


type CreateProjectStepProps = {
  isActive: boolean
  managedApps: AzureManagedAppCoordinates[]
  billingProjectNameValidator: (string) => any // any => errors, but no type defined in project yet
  submit: (newProject: BillingProject) => void
  subscriptionId?: string
}
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
      const response = await Ajax().Billing.createAzureProject(billingProjectName, selectedApp?.tenantId, props.subscriptionId,
        selectedApp?.managedResourceGroupId)
      const json = await response.json()
      props.submit(json)
    } catch (error) {
      throw error
    }
  })


  const onNameInput = () => {
    const errors = billingProjectName ?
      Utils.summarizeErrors(billingProjectNameValidator(billingProjectName)?.billingProjectName) :
      'A name is required to create a billing project.'
    if (errors) {
      setNameErrors([errors])
    } else {
      setNameErrors(undefined)
    }
  }

  const validSelections = () => !!billingProjectName && !nameErrors && !!selectedApp

  return h(Step, { isActive }, [
    StepTitle({ text: 'STEP 2' }),
    div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-around' } }, [
      div({ style: { width: '40%', display: 'flex', flexDirection: 'column', margin: '2rem' } }, [
        h(FormLabel, { htmlFor: nameInputId, required: true }, ['Terra billing project']),
        h(ValidatedInput, {
          inputProps: {
            id: nameInputId,
            billingProjectName,
            placeholder: 'Enter a name for the project',
            onChange: setBillingProjectName,
            onBlur: onNameInput
          },
          error: nameErrors
        })
      ]),
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        h(FormLabel, { htmlFor: appSelectId, required: true }, [
          'Unassigned managed application',
          InfoBox({
            style: ({ marginLeft: '0.25rem' } as any), children: [
              'A managed application instance can only be assigned to a single Terra billing ',
              'project. Only unassigned managed applications are included in the list below.'
            ]
          } as any)
        ]), //{ size, children, style, side, tooltip, iconOverride }
        div({ style: { fontSize: 14 } }, [
          h(Select, {
            id: appSelectId,
            //isMulti: false,
            placeholder: 'Select a managed application',
            isDisabled: managedApps.length === 0,
            value: selectedApp,
            onChange: ({ value }) => setSelectedApp(value),
            options: _.map(application => {
              return {
                value: application,
                label: !!application.region ?
                  `${application.applicationDeploymentName} (${application.region})` :
                  application.applicationDeploymentName
              }
            }, managedApps)
          })
        ])
      ]),
      h(ButtonPrimary, {
        style: { margin: '2rem' },
        onClick: createBillingProject,
        disabled: !isActive || !validSelections()
      }, [
        'Create Billing Project'
      ]),
    ]),
    isCreating && spinnerOverlay
  ])
}
