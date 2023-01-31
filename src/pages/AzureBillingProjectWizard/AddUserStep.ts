import { h } from 'react-hyperscript-helpers'
import { BillingProject } from 'src/pages/billing/models'
import { Step, StepTitle } from 'src/pages/billing/StepWizard'


interface AddUserStepProps {
  isActive: boolean
  billingProject?: BillingProject
}

export const AddUserStep = ({ isActive, billingProject, ...props }: AddUserStepProps) => {
  return h(Step, { isActive }, [
    StepTitle({ text: 'STEP 3' })
  ])
}
