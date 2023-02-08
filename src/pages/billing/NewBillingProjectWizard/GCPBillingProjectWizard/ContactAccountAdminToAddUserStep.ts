import { div, h, span } from 'react-hyperscript-helpers'
import { LabeledCheckbox } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { styles } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard'
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'


interface ContactAccountAdminToAddUserStepProps {
  isActive: boolean
  isFinished: boolean
  verifiedUsersAdded: boolean | undefined
  setVerifiedUsersAdded: (boolean) => void

}

export const ContactAccountAdminToAddUserStep = ({ isActive, ...props }: ContactAccountAdminToAddUserStepProps) => h(Step, { isActive }, [
  StepHeader({ title: 'STEP 3' }),
  h(StepFields, [
    h(StepFieldLegend, { style: { width: '70%' } }, [
      'Contact your billing account administrator and have them add you and ',
      span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']),
      ' as a Billing Account User',
      span({ style: { fontWeight: 'bold' } }, [' to your organization\'s billing account.'])
    ]),
    div({ style: { width: '30%', display: 'flex', flexDirection: 'row' } }, [
      h(LabeledCheckbox, {
        style: { margin: '.25rem', marginTop: '.375rem' },
        checked: props.verifiedUsersAdded,
        disabled: !isActive && !props.isFinished, // disabled when we haven't gotten to this step - still allow users to go back, though
        onChange: () => {
          Ajax().Metrics.captureEvent(Events.billingGCPCreationStep3VerifyUserAdded)
          props.setVerifiedUsersAdded(!props.verifiedUsersAdded)
        }
      }, [
        span({ style: { float: 'right', ...styles.radioButtonLabel } }, ['I have verified the user has been added to my account (requires reauthentication)'])
      ]),
    ])
  ]),
  ExternalLink({
    style: { marginTop: '2rem' },
    text: 'Learn how to set up a Google Cloud Billing account',
    url: 'https://support.terra.bio/hc/en-us/articles/360026182251'
  })
])


