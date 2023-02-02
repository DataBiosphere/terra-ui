import { useEffect, useState } from 'react'
import { div, fieldset, h, legend, span } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { styles } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard'
import { LabeledRadioButton } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/LabeledRadioButton'
import {
  ExternalLink,
  Step,
  StepHeader,
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


interface AddTerraAsBillingAccountUserStepProps {
  isActive: boolean
  persistenceId: string

  authorizeAndLoadAccounts: () => Promise<void>

  accessToAddBillingAccountUser: boolean
  setAccessToAddBillingAccountUser: (boolean) => void

  isFinished: boolean
  setIsFinished: (boolean) => void

  setRefreshed: (boolean) => void
}

export const AddTerraAsBillingAccountUserStep = ({ isActive, ...props }: AddTerraAsBillingAccountUserStepProps) => {
  const [verified, setVerified] = useState<boolean>(() => getLocalPref(props.persistenceId)?.verified || false)

  useEffect(() => { setLocalPref(`${props.persistenceId}.verified`, verified) }, [props.persistenceId, verified])

  return h(Step, { isActive }, [
    StepHeader({ title: 'STEP 3' }),
    fieldset({ style: { border: 'none', margin: 0, padding: 0, display: 'block' } }, [
      legend({
        style: {
          maxWidth: '60%',
          fontSize: 14,
          lineHeight: '22px',
          whiteSpace: 'pre-wrap',
          marginTop: '0.25rem',
          float: 'left'
        }
      },
      [span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' } },
        ['Add ', span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']), ' as a Billing Account User',
          span({ style: { fontWeight: 'bold' } }, [' to your billing account.'])]),
      div({ style: { marginTop: '3rem' } }, [
        ExternalLink({
          text: 'Learn how to set up a Google Cloud Billing account',
          url: 'https://support.terra.bio/hc/en-us/articles/360026182251'
        })
      ])]),
      div({ style: { width: '25%', float: 'right' } }, [
        LabeledRadioButton({
          text: "I don't have access to do this", name: 'permission',
          checked: !props.accessToAddBillingAccountUser,
          disabled: !isActive,
          labelStyle: { ...styles.radioButtonLabel },
          onChange: () => {
            Ajax().Metrics.captureEvent(Events.billingCreationStep3BillingAccountNoAccess)
            if (!isActive) {
              props.setIsFinished(false)
              props.setAccessToAddBillingAccountUser(false)
              setVerified(false)
              props.setRefreshed(false)
            } else {
              props.setAccessToAddBillingAccountUser(false)
              props.setIsFinished(true)
            }
          }
        }),
        LabeledRadioButton({
          text: 'I have added terra-billing as a billing account user (requires reauthentication)',
          name: 'permission',
          checked: props.accessToAddBillingAccountUser,
          disabled: !isActive,
          onChange: async () => {
            Ajax().Metrics.captureEvent(Events.billingCreationStep3AddedTerraBilling)
            props.setAccessToAddBillingAccountUser(true)
            await props.authorizeAndLoadAccounts()
            props.setIsFinished(true)
          }
        })
      ])
    ])
  ])
}
