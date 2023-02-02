import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import SupportRequestWrapper from 'src/components/SupportRequest'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { contactUsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import CreateGCPBillingProject from 'src/pages/billing/CreateGCPBillingProject'
import { Step, StepFields, StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


interface CreateTerraProjectStepProps {
  isActive: boolean
  billingAccounts: any

  existing: any
  setExisting: (any) => void

  refreshed: boolean
  setRefreshed: (boolean) => void
  authorizeAndLoadAccounts: () => Promise<void>

  onSuccess: (string) => void
}

export const CreateTerraProjectStep = ({ isActive, billingAccounts, existing, onSuccess, ...props }: CreateTerraProjectStepProps) => {
  const [billingProjectName, setBillingProjectName] = useState('')
  const [chosenBillingAccount, setChosenBillingAccount] = useState<any>()
  const [isBusy, setIsBusy] = useState(false)

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createGCPProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess(billingProjectName)
    } catch (error: any) {
      if (error.status === 409) {
        props.setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })
  return h(Step, { isActive }, [
    StepHeader({
      title: 'STEP 4', description: [
        'Create a Terra project to connect your Google billing account to Terra. ',
        'Billing projects allow you to manage your workspaces and are required to create one.'
      ]
    }),
    StepFields({
      disabled: !isActive, children: [
        div([CreateGCPBillingProject({
          billingAccounts, chosenBillingAccount, setChosenBillingAccount,
          billingProjectName, setBillingProjectName, existing, disabled: !isActive
        })]),
        isActive && _.isEmpty(billingAccounts) ?
          div({
            style: {
              display: 'flex', alignItems: 'flex-start',
              margin: '1rem 1rem 0', padding: '1rem',
              border: `1px solid ${colors.warning()}`, borderRadius: '5px',
              backgroundColor: colors.warning(0.10), maxWidth: '45%'
            },
            role: 'alert'
          }, [
            icon('warning-standard', {
              style: {
                color: colors.warning(),
                height: '1.5rem',
                width: '1.5rem',
                marginRight: '0.5rem',
                marginTop: '0.25rem'
              }
            }),
            !props.refreshed ? div({ style: { paddingInline: '0.5rem', lineHeight: '24px', fontWeight: 500 } }, [
              'You do not have access to any Google Billing Accounts. Please verify that a billing account has been created in the ' +
                      'Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your billing account.',
              div({ style: { marginTop: '0.5rem' } }, [
                h(Link, {
                  style: { textDecoration: 'underline', color: colors.accent() },
                  onClick: async () => {
                    Ajax().Metrics.captureEvent(Events.billingCreationRefreshStep3)
                    await props.authorizeAndLoadAccounts()
                    props.setRefreshed(true)
                  }
                }, ['Refresh Step 3'])
              ])
            ]) :
              div({ style: { paddingInline: '0.5rem', lineHeight: '24px', fontWeight: 500 } }, [
                'Terra still does not have access to any Google Billing Accounts. Please contact Terra support for additional help.',
                div({ style: { marginTop: '0.5rem' } }, [
                  h(Link, {
                    style: { textDecoration: 'underline', color: colors.accent() },
                    onClick: () => {
                      Ajax().Metrics.captureEvent(Events.billingCreationContactTerraSupport)
                      contactUsActive.set(true)
                    }
                  }, ['Terra support'])
                ])
              ]),
            contactUsActive.get() && h(SupportRequestWrapper)
          ]) :
          div({ style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
            h(ButtonPrimary, {
              style: {
                marginTop: '2rem',
                height: '2.5rem',
                borderRadius: 2,
                textTransform: 'none',
                paddingInline: isBusy ? '1rem' : '2rem'
              },
              onClick: submit,
              disabled: !isActive
            }, [
              isBusy && icon('loadingSpinner', { size: 16, style: { color: 'white', marginRight: '0.5rem' } }),
              'Create Terra Billing Project'
            ]),
            isBusy && div({ role: 'alert', style: { marginTop: '1rem' } }, ['This may take a minute'])
          ])
      ]
    })
  ])
}
