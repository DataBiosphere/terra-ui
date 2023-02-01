import { ReactNode, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { Step, StepFields, StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'
import { StepFieldForm } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { validate } from 'validate.js'

import { ExternalLink } from './ExternalLink'


type AzureSubscriptionIdStepProps = {
  isActive: boolean
  subscriptionId?: string
  onChange: (string) => void
  submit: () => void
}

export const AzureSubscriptionIdStep = ({ isActive, subscriptionId, ...props }: AzureSubscriptionIdStepProps) => {
  const [errors, setErrors] = useState<ReactNode>()
  const formId = useUniqueId()

  const validateSubscriptionId = () => {
    const errors = subscriptionId ?
      Utils.summarizeErrors(
        validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })?.subscriptionId
      ) : 'An Azure Subscription ID is required'
    if (errors) {
      setErrors(errors)
    } else {
      setErrors(undefined)
    }
  }

  return h(Step, { isActive }, [
    StepHeader({
      title: 'STEP 1', description: [
        'Link Terra to your Azure subscription. ',
        ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
        ' to access your Azure subscription ID'
      ]
    }),
    h(StepFields, { disabled: !isActive }, [
      StepFieldForm({
        children: [
          h(div, { style: { display: 'flex', flexDirection: 'column', maxWidth: '75%' } } as any, [
            h(FormLabel, { htmlFor: formId, required: true }, ['Enter your Azure subscription Id']),
            h(ValidatedInput, {
              inputProps: {
                id: formId,
                placeholder: 'Azure Subscription ID',
                onChange: props.onChange,
                value: subscriptionId,
                onBlur: validateSubscriptionId,
              },
              error: errors
            }),
          ]),
          h(ButtonPrimary,
            { style: { margin: '2rem' }, onClick: props.submit, disabled: !!errors || !subscriptionId },
            ['Submit']),
        ]
      })
    ])
  ])
}

