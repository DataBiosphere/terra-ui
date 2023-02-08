import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { AzureCostWarnings } from 'src/pages/billing/AzureCostWarnings'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'


interface CreateProjectStepProps {
  isActive: boolean
  createBillingProject: () => void
  createReady: boolean
}

export const CreateProjectStep = ({ isActive, createReady, createBillingProject, ...props }: CreateProjectStepProps) => {
  return h(Step, { isActive }, [
    h(StepHeader, { title: 'Step 4' }, ['Create Terra Billing Project']),
    h(StepFields, { disabled: !isActive, style: { justifyContent: 'flex-start', width: '75%' } }, [
      h(AzureCostWarnings),
      div({ style: { margin: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' } }, [
        h(ButtonPrimary, { role: 'button', disabled: !createReady, onClick: createBillingProject }, ['Submit'])
      ]),
    ]),
  ])
}
