import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { summarizeErrors } from 'src/libs/utils'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFieldForm, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'

import { ExternalLink } from '../StepWizard/ExternalLink'


type AzureSubscriptionIdStepProps = {
  isActive: boolean
  subscriptionId?: string
  onChange: (string) => void
  submit: () => void
}

export const AzureSubscriptionIdStep = ({ isActive, subscriptionId, ...props }: AzureSubscriptionIdStepProps) => {
  const [errors, setErrors] = useState<ReactNode | undefined>()
  const formId = useUniqueId()

  const validateSubscriptionId = () => {
    if (!subscriptionId) {
      setErrors('An Azure Subscription ID is required')
    } else {
      setErrors(summarizeErrors(validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })?.subscriptionId))
    }
  }

  return h(Step, { isActive }, [
    h(StepHeader, { title: 'STEP 1' }, [
      'Link Terra to your Azure subscription. ',
      ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
      ' to access your Azure subscription ID'
    ]),
    h(StepFields, { disabled: !isActive, style: { width: '100%', height: '100%' } }, [
      h(StepFieldForm, { style: { height: '100%' } }, [
        h(LabeledField, { label: 'Enter your Azure subscription Id', formId, required: true }, [
          h(ValidatedInput, {
            inputProps: {
              id: formId,
              placeholder: 'Azure Subscription ID',
              onChange: props.onChange,
              value: subscriptionId,
              onBlur: validateSubscriptionId,
            },
            error: errors
          })
        ]),
        h(ButtonPrimary, {
          style: { margin: '2rem' },
          onClick: props.submit,
          disabled: !!errors || !subscriptionId
        }, ['Submit']),
      ])
    ])
  ])
}

