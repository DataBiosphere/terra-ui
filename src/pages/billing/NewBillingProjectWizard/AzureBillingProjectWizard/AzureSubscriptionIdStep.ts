import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { summarizeErrors } from 'src/libs/utils'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
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

  const subscriptionIdEntered = () => {
    Ajax().Metrics.captureEvent(Events.billingAzureCreationSubscriptionEntered)
    if (!subscriptionId) {
      setErrors('An Azure Subscription ID is required')
    } else {
      const err = summarizeErrors(validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })?.subscriptionId)
      setErrors(err)
      if (!err) {
        props.submit()
      }
    }
  }

  return h(Step, { isActive, style: { height: '12rem' } }, [
    h(StepHeader, { title: 'STEP 1' }, [
      'Link Terra to your Azure subscription. ',
      ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
      ' to access your Azure Subscription ID.'
    ]),
    h(StepFields, { style: { width: '100%', height: '100%' } }, [
      //h(StepFieldForm, { style: { height: '100%' } }, [
      h(LabeledField, { style: { width: '60%' }, label: 'Enter your Azure subscription ID', formId, required: true }, [
        h(ValidatedInput, {
          inputProps: {
            id: formId,
            placeholder: 'Azure Subscription ID',
            onChange: props.onChange,
            value: subscriptionId,
            onBlur: subscriptionIdEntered,
          },
          error: errors
        })
      ])
      // ])
    ])
  ])
}

