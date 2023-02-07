import { h } from 'react-hyperscript-helpers'
import { ButtonOutline } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import * as Utils from 'src/libs/utils'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { StepFieldLegend, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'


interface GoToGCPConsoleStepProps {
  isActive: boolean
  stepFinished: () => void
}

export const GoToGCPConsoleStep = ({ isActive, ...props }: GoToGCPConsoleStepProps) => {
  return h(Step, { isActive }, [
    StepHeader({ title: 'STEP 1' }),
    h(StepFields, [
      h(StepFieldLegend, ['Go to the Google Cloud Platform Billing Console and sign-in with the same user you use to login to Terra.']),
      h(ButtonOutline, {
        disabled: false,
        href: 'https://console.cloud.google.com',
        ...Utils.newTabLinkProps,
        onClick: () => {
          // FIXME: this seems wrong
          //  I would think the button would just be inactive if we're not on step 1
          //  then we wouldn't need this check, and we'd also only capture the metric when active
          //  before this was using the raw clickable, though - so I've preserved the exact funtionality for now
          Ajax().Metrics.captureEvent(Events.billingGCPCreationStep1)
          if (isActive) {
            props.stepFinished()
          }
        },
        style: { textTransform: 'none', backgroundColor: 'none' }
      },
      ['Go to Google Cloud Console']
      )
    ])
  ])
}
