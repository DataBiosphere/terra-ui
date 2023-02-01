import { h } from 'react-hyperscript-helpers'
import { BillingProject } from 'src/pages/billing/models'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


interface AddUserStepProps {
  isActive: boolean
  billingProject?: BillingProject
}

export const AddUserStep = ({ isActive, billingProject, ...props }: AddUserStepProps) => {
  return h(Step, { isActive, title: 'STEP 3' }, [

  ])
}
