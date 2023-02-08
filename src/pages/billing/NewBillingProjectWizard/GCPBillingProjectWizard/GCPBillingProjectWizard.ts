import { CSSProperties, useEffect, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import colors from 'src/libs/colors'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { BillingAccount } from 'src/pages/billing/models/BillingAccount'
import { StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepWizard'

import { AddTerraAsBillingAccountUserStep } from './AddTerraAsBillingAccountUserStep'
import { BillingAccountAccessStep } from './BillingAccountAccessStep'
import { ContactAccountAdminToAddUserStep } from './ContactAccountAdminToAddUserStep'
import { CreateTerraProjectStep } from './CreateTerraProjectStep'
import { GoToGCPConsoleStep } from './GoToGCPConsoleStep'


interface GCPBillingProjectWizardProps {
  billingAccounts: Record<string, BillingAccount>
  onSuccess: (string) => void
  // calls Auth.ensureBillingScope, then re-loads billing accounts from rawls
  authorizeAndLoadAccounts: () => Promise<void>
}

export const GCPBillingProjectWizard = ({ onSuccess, billingAccounts, authorizeAndLoadAccounts }: GCPBillingProjectWizardProps) => {
  const persistenceId = 'billing'
  const [accessToBillingAccount, setAccessToBillingAccount] = useState<boolean>(() => getLocalPref(persistenceId)?.accessToBillingAccount)
  const [accessToAddBillingAccountUser, setAccessToAddBillingAccountUser] = useState<boolean | undefined>(() => getLocalPref(persistenceId)?.accessToAddBillingAccountUser)
  const [verifiedUsersAdded, setVerifiedUsersAdded] = useState<boolean | undefined>(false) // if no access to add billing account user, has the user verified access
  const [refreshed, setRefreshed] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<number>((getLocalPref(persistenceId)?.activeStep || 1))

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
        setAccessToAddBillingAccountUser(undefined)
        setVerifiedUsersAdded(undefined) // reset verification of step 3
        setRefreshed(false) // this might or might not be necessary
        setActiveStep(3)
      },
      isActive: activeStep === 2,
    }),
    // show AddTerraAsBillingAccountUserStep by default, and when the user selects that they have a billing account in step 2
    // show ContactAccountAdminToAddUserStep if the user selects that they don't have a billing account in step 2
    //     and transition to ContactAccountAdminToAddUserStep if the user selects that they don't have access to add a user in AddTerraAsBillingAccountUserStep
    // This may be better to combine into a separate component - then `refreshed` states in step 3 and 4 could be separate
    accessToBillingAccount !== false && accessToAddBillingAccountUser !== false ?
      h(AddTerraAsBillingAccountUserStep, {
        accessToAddBillingAccountUser,
        setAccessToAddBillingAccountUser: async hasUserAccess => {
          setAccessToAddBillingAccountUser(hasUserAccess)
          if (hasUserAccess) {
            await authorizeAndLoadAccounts()
            setActiveStep(4)
            setRefreshed(true)
          } else {
            setActiveStep(3)
            //await authorizeAndLoadAccounts()
            setRefreshed(false)
          }
        },
        isActive: activeStep === 3,
        isFinished: activeStep > 3,
      }) :
      h(ContactAccountAdminToAddUserStep, {
        //persistenceId,
        verifiedUsersAdded,
        setVerifiedUsersAdded: async verified => {
          setVerifiedUsersAdded(verified)
          if (verified) {
            await authorizeAndLoadAccounts()
            setActiveStep(4)
            // I think this makes sense here, since we just refreshed auth and accounts,
            // but the existing unit tests fail with it, since the refresh button in step 4 doesn't come up
            // setRefreshed(true)
          } else {
            setActiveStep(3)
            setRefreshed(false)
          }
        },
        isActive: activeStep === 3,
        isFinished: activeStep > 3,
      }),
    h(CreateTerraProjectStep, {
      isActive: activeStep === 4,
      billingAccounts,
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

