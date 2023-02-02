import { useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { LabeledCheckbox } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import {
  ExternalLink,
  Step,
  StepFieldLegend,
  StepFields,
  StepHeader,
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


interface ContactAccountAdminToAddUserStepProps {
  isActive: boolean
  persistenceId: string
  stepFinished: () => void

  authorizeAndLoadAccounts: () => Promise<void>

  isFinished: boolean
  setIsFinished: (boolean) => void

  setRefreshed: (boolean) => void
}

export const ContactAccountAdminToAddUserStep = ({ isActive, ...props }: ContactAccountAdminToAddUserStepProps) => {
  const [verified, setVerified] = useState<boolean>(() => getLocalPref(props.persistenceId)?.verified || false)
  useEffect(() => {
    setLocalPref(`${props.persistenceId}.verified`, verified)
  }, [props.persistenceId, verified])

  const resetStep = () => {
    props.setIsFinished(false)
    setVerified(false)
    props.setRefreshed(false)
  }

  return h(Step, { isActive }, [
    StepHeader({ title: 'STEP 3' }),
    h(StepFields, [
      h(StepFieldLegend, { style: { width: '60%' } }, [
        'Contact your billing account administrator and have them add you and ',
        span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']),
        ' as a Billing Account User',
        span({ style: { fontWeight: 'bold' } }, [' to your organization\'s billing account.'])

      ]),
      div({ style: { width: '40%' } }, [
        h(LabeledCheckbox, {
          checked: verified,
          onChange: async () => {
            Ajax().Metrics.captureEvent(Events.billingCreationStep3VerifyUserAdded)
            if (props.isFinished) {
              resetStep()
            } else {
              await props.authorizeAndLoadAccounts()
              setVerified(true)
              props.stepFinished()
            }
          }
        }, [
          span({ style: { marginLeft: '2rem', marginTop: '-1.3rem' } }, [
            'I have verified the user has been added to my account (requires reauthentication)'
          ])
        ]),
      ])
    ]),
    div({ style: { marginTop: '2rem' } }, [
      ExternalLink({
        text: 'Learn how to set up a Google Cloud Billing account',
        url: 'https://support.terra.bio/hc/en-us/articles/360026182251'
      })
    ])
  ])
}


