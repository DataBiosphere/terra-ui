import { h, p } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { LabeledRadioButton, LabeledRadioGroup } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/LabeledRadioButton'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'


export interface BillingAccountAccessStepProps {
  isActive: boolean
  accessToBillingAccount?: boolean
  setAccessToBillingAccount: (boolean) => void
}

export const BillingAccountAccessStep = ({ isActive, ...props }: BillingAccountAccessStepProps) => h(Step, { isActive }, [
  h(StepHeader, { title: 'STEP 2', children: [] }),
  h(StepFields, [
    h(StepFieldLegend, { style: { width: '70%' } }, [
      'Select an existing billing account or create a new one.'
    ]),
    h(LabeledRadioGroup, { style: { width: '30%' } }, [
      LabeledRadioButton({
        text: "I don't have access to a Cloud billing account", name: 'access-to-account',
        checked: props.accessToBillingAccount === false,
        onChange: () => {
          props.setAccessToBillingAccount(false)
          Ajax().Metrics.captureEvent(Events.billingGCPCreationStep2BillingAccountNoAccess)
        }
      }),
      LabeledRadioButton({
        text: 'I have a billing account', name: 'access-to-account',
        checked: props.accessToBillingAccount,
        onChange: () => {
          props.setAccessToBillingAccount(true)
          Ajax().Metrics.captureEvent(Events.billingGCPCreationStep2HaveBillingAccount)
        }
      })
    ])
  ]),
  p({ style: { fontSize: '.875rem', lineHeight: '22px', width: '75%' } }, [
    'If you are creating a new billing account, you may be eligible for $300 in free credits. ' +
    'Follow the instructions to activate your account in the Google Cloud Console.'
  ]),

])

