import { h, span } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { styles } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard'
import {
  LabeledRadioButton,
  LabeledRadioGroup
} from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/LabeledRadioButton'
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'


export interface AddTerraAsBillingAccountUserStepProps {
  isActive: boolean
  accessToAddBillingAccountUser?: boolean
  setAccessToAddBillingAccountUser: (boolean) => void
  isFinished: boolean
}

export const AddTerraAsBillingAccountUserStep = ({ isActive, ...props }: AddTerraAsBillingAccountUserStepProps) => {
  // disable buttons if we haven't gotten to this step yet, but allow user to go back
  const disabled = !isActive && !props.isFinished

  return h(Step, { isActive }, [
    h(StepHeader, { title: 'STEP 3' }),
    h(StepFields, [
      h(StepFieldLegend, [
        'Add ',
        span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']),
        ' as a Billing Account User',
        span({ style: { fontWeight: 'bold' } }, [' to your billing account.']), //]),
      ]),
      h(LabeledRadioGroup, [
        h(LabeledRadioButton, {
          disabled,
          text: "I don't have access to do this", name: 'permission',
          checked: props.accessToAddBillingAccountUser === false,
          labelStyle: { ...styles.radioButtonLabel },
          onChange: () => {
            Ajax().Metrics.captureEvent(Events.billingCreationStep3BillingAccountNoAccess)
            props.setAccessToAddBillingAccountUser(false)
          }
        }),
        h(LabeledRadioButton, {
          disabled,
          text: 'I have added terra-billing as a billing account user (requires reauthentication)',
          name: 'permission',
          checked: props.accessToAddBillingAccountUser,
          onChange: () => {
            Ajax().Metrics.captureEvent(Events.billingCreationStep3AddedTerraBilling)
            props.setAccessToAddBillingAccountUser(true)
          }
        })
      ]),
    ]),
    ExternalLink({
      text: 'Learn how to set up a Google Cloud Billing account',
      url: 'https://support.terra.bio/hc/en-us/articles/360026182251'
    })
  ])
}
