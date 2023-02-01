import { ReactNode, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import colors from 'src/libs/colors'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { Step, StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'
import { validate } from 'validate.js'


type ExternalLinkProps = {
  text: string
  url: string
}
const externalLinkProps = {
  ...Utils.newTabLinkProps, style: { textDecoration: 'underline', color: colors.accent() }
}
const ExternalLink = ({ text, url }: ExternalLinkProps) => h(Link, { ...externalLinkProps, href: url }, [text])

type AzureSubscriptionIdStepProps = {
  isActive: boolean
  subscriptionId?: string
  onChange: (string) => void
  submit: () => void
}

export const AzureSubscriptionIdStep = ({ isActive, subscriptionId, ...props }: AzureSubscriptionIdStepProps) => {
  const [errors, setErrors] = useState<ReactNode>()

  const formId = useUniqueId()

  const validateInput = () => {
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
  return h(Step, { isActive, title: 'STEP 1' }, [
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, [
        'Link Terra to your Azure subscription. ',
        ExternalLink({ text: 'Go to Azure Marketplace', url: 'https://portal.azure.com/' }),
        ' to access your Azure subscription ID'
      ]),

      div({ style: { width: '40%' } }, [
        h(FormLabel, { htmlFor: formId, required: true }, ['Enter your Azure subscription Id']),
        div({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }
        }, [
          h(ValidatedInput, {
            inputProps: {
              id: formId,
              placeholder: 'Azure Subscription ID',
              onChange: props.onChange,
              value: subscriptionId,
              onBlur: validateInput,
            },
            error: errors
          }),
          h(ButtonPrimary, {
            style: { margin: '2rem' }, onClick: props.submit, disabled: !isActive || errors || !subscriptionId
          }, [
            'Submit'
          ]),
        ]),

      ])
    ])
  ])
}
