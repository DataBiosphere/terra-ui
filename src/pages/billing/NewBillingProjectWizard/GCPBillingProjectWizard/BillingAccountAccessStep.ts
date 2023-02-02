import { div, h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { styles } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard'
import { LabeledRadioButton } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/LabeledRadioButton'
import { Step, StepFieldLegend, StepFields, StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


export interface BillingAccountAccessStepProps {
  isActive: boolean
  accessToBillingAccount?: boolean
  setAccessToBillingAccount: (boolean) => void
}

export const BillingAccountAccessStep = ({ isActive, ...props }: BillingAccountAccessStepProps) => {
  return h(Step, { isActive }, [
    StepHeader({ title: 'STEP 2', description: ['Select an existing billing account or create a new one.'] }),
    h(StepFields, [
      h(StepFieldLegend, [
        'If you are creating a new billing account, you may be eligible for $300 in free credits. ' +
        'Follow the instructions to activate your account in the Google Cloud Console.'
      ]),
      div({
        role: 'radiogroup',
        style: {
          width: '25%',
          float: 'right',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around'
        }
      }, [
        LabeledRadioButton({
          text: "I don't have access to a Cloud billing account", name: 'access-to-account',
          checked: props.accessToBillingAccount === false,
          labelStyle: { ...styles.radioButtonLabel },
          onChange: () => {
            props.setAccessToBillingAccount(false)
            Ajax().Metrics.captureEvent(Events.billingCreationStep2BillingAccountNoAccess)
          }
        }),
        LabeledRadioButton({
          text: 'I have a billing account', name: 'access-to-account',
          checked: props.accessToBillingAccount,
          labelStyle: { ...styles.radioButtonLabel },
          onChange: () => {
            props.setAccessToBillingAccount(true)
            Ajax().Metrics.captureEvent(Events.billingCreationStep2HaveBillingAccount)
          }
        })
      ])
    ])
  ])
}
