import { CSSProperties, useEffect, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import colors from 'src/libs/colors'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'

import {
  AddTerraAsBillingAccountUserStep,
  BillingAccountAccessStep,
  ContactAccountAdminToAddUserStep,
  CreateTerraProjectStep,
  GoToGCPConsoleStep
} from './'


const GCPBillingProjectWizard = ({ onSuccess, billingAccounts, authorizeAndLoadAccounts }) => {
  const persistenceId = 'billing'
  const [accessToBillingAccount, setAccessToBillingAccount] = useState(() => getLocalPref(persistenceId)?.accessToBillingAccount)
  const [accessToAddBillingAccountUser, setAccessToAddBillingAccountUser] = useState<boolean | undefined>(() => getLocalPref(persistenceId)?.accessToAddBillingAccountUser)
  // const [verified, setVerified] = useState<boolean>(() => getLocalPref(persistenceId)?.verified || false)
  const [refreshed, setRefreshed] = useState<boolean>(false)
  const [existing, setExisting] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState<number>(1) //useState<number>(( getLocalPref(persistenceId)?.activeStep || 1))

  useEffect(() => {
    setLocalPref(persistenceId, { activeStep, accessToBillingAccount, accessToAddBillingAccountUser })
  }, [persistenceId, activeStep, accessToBillingAccount, accessToAddBillingAccountUser])


  return h(StepWizard, {
    title: 'Link a Google Cloud billing account to Terra',
    intro: `The linked billing account is required to cover all Google Cloud data storage, compute and egress costs incurred in a Terra workspace.
        Cloud costs are billed directly from Google and passed through Terra billing projects with no markup.`,
  }, [
    h(GoToGCPConsoleStep, { isActive: activeStep === 1, stepFinished: () => setActiveStep(2) }),
    h(BillingAccountAccessStep, {
      accessToBillingAccount,
      setAccessToBillingAccount: (access: boolean) => {
        setAccessToBillingAccount(access)
        setActiveStep(3)
      },
      isActive: activeStep === 2,
    }),
    accessToBillingAccount ?
      h(AddTerraAsBillingAccountUserStep, {
        persistenceId,
        authorizeAndLoadAccounts,
        setRefreshed,
        accessToAddBillingAccountUser: !!accessToAddBillingAccountUser,
        setAccessToAddBillingAccountUser,
        isActive: activeStep === 3,
        isFinished: activeStep > 3,
        setIsFinished: finished => {
          if (finished) setActiveStep(4)
          else setActiveStep(3)
        },
      }) :
      h(ContactAccountAdminToAddUserStep, {
        persistenceId,
        authorizeAndLoadAccounts,

        setRefreshed,
        isActive: activeStep === 3,
        isFinished: activeStep > 3,
        setIsFinished: finished => {
          if (!finished) setActiveStep(3)
        },
        stepFinished: () => setActiveStep(4),
      }),
    h(CreateTerraProjectStep, {
      isActive: activeStep === 4,
      billingAccounts,
      existing,
      setExisting,
      refreshed,
      setRefreshed,
      authorizeAndLoadAccounts,
      onSuccess
    })
  ]
  )
}


const radioButtonLabel: CSSProperties = {
  marginLeft: '1rem',
  color: colors.accent(),
  fontWeight: 500,
  lineHeight: '22px'
}

export const styles = {
  radioButtonLabel,
}


export default GCPBillingProjectWizard

