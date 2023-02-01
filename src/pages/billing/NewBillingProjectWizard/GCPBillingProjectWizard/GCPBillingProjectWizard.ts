import _ from 'lodash/fp'
import { CSSProperties, useEffect, useState } from 'react'
import { div, fieldset, h, legend, p, span } from 'react-hyperscript-helpers'
import {
  ButtonOutline,
  ButtonPrimary,
  LabeledCheckbox,
  Link,
  RadioButton
} from 'src/components/common'
import { icon } from 'src/components/icons'
import SupportRequestWrapper from 'src/components/SupportRequest'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { contactUsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import CreateGCPBillingProject from 'src/pages/billing/CreateGCPBillingProject'
import { Step, StepFieldLegend, StepFields, StepHeader, StepWizard } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'


const GCPBillingProjectWizard = ({ onSuccess, billingAccounts, authorizeAndLoadAccounts }) => {
  const persistenceId = 'billing'
  const [accessToBillingAccount, setAccessToBillingAccount] = useState(() => getLocalPref(persistenceId)?.accessToBillingAccount)
  const [accessToAddBillingAccountUser, setAccessToAddBillingAccountUser] = useState<boolean | undefined>(() => getLocalPref(persistenceId)?.accessToAddBillingAccountUser)
  const [verified, setVerified] = useState<boolean>(() => getLocalPref(persistenceId)?.verified || false)
  const [billingProjectName, setBillingProjectName] = useState('')
  const [chosenBillingAccount, setChosenBillingAccount] = useState<any>()
  const [refreshed, setRefreshed] = useState<boolean>(false)
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const [existing, setExisting] = useState<string[]>([])
  // const [activeStep, setActiveStep] = useState<number>(( getLocalPref(persistenceId)?.activeStep || 1))
  const [activeStep, setActiveStep] = useState<number>(1)

  useEffect(() => {
    setLocalPref(persistenceId, { activeStep, accessToBillingAccount, verified, accessToAddBillingAccountUser })
  }, [persistenceId, activeStep, accessToBillingAccount, verified, accessToAddBillingAccountUser])

  const next = () => {
    setActiveStep(activeStep + 1)
  }

  const resetStep3 = () => {
    setActiveStep(3)
    setAccessToAddBillingAccountUser(undefined)
    setVerified(false)
    setRefreshed(false)
  }

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createGCPProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess(billingProjectName)
    } catch (error: any) {
      if (error.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })

  const step1 = () => h(Step, { isActive: activeStep === 1 }, [
    StepHeader({ title: 'STEP 1' }),
    StepFields({
      children: [
        StepFieldLegend({ children: ['Go to the Google Cloud Platform Billing Console and sign-in with the same user you use to login to Terra.'] }),
        h(ButtonOutline,
          {
            disabled: false,
            href: 'https://console.cloud.google.com',
            ...Utils.newTabLinkProps,
            onClick: () => {
              // FIXME: this seems wrong
              //  I would think the button would just be inactive if we're not on step 1
              //  then we wouldn't need this check, and we'd also only capture the metric when active
              //  before this was using the raw clickable, though - so I've preserved the exact funtionality for now
              Ajax().Metrics.captureEvent(Events.billingCreationStep1)
              if (activeStep === 1) {
                next()
              }
            },
            style: { textTransform: 'none', backgroundColor: 'none' }
          },
          ['Go to Google Cloud Console']
        )
      ]
    }
    )
  ]
  )


  const step2 = () => {
    const isActive = activeStep === 2
    const isDone = activeStep > 2

    const setNextStep = accessToBilling => {
      setAccessToBillingAccount(accessToBilling)
      if (activeStep === 1) {
        setActiveStep(3)
      } else if (isDone) {
        resetStep3()
      } else {
        next()
      }
    }

    return h(Step,
      { isActive },
      [
        StepHeader({ title: 'STEP 2' }),
        h(StepFields, [
          h(StepFieldLegend, [
            'Select an existing billing account or create a new one.\n\nIf you are creating a new billing account, you may be eligible for $300 in free credits. ' +
              'Follow the instructions to activate your account in the Google Cloud Console.'
          ]),
          div({
            role: 'radiogroup',
            style: {
              width: '25%',
              float: 'right',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around'
            }
          }, [
            h(div, [RadioButton({
              text: "I don't have access to a Cloud billing account", name: 'access-to-account',
              checked: accessToBillingAccount === false,
              labelStyle: { ...styles.radioButtonLabel },
              onChange: () => {
                setNextStep(false)
                Ajax().Metrics.captureEvent(Events.billingCreationStep2BillingAccountNoAccess)
              }
            })]),
            h(div, [RadioButton({
              text: 'I have a billing account', name: 'access-to-account',
              checked: accessToBillingAccount === true,
              labelStyle: { ...styles.radioButtonLabel },
              onChange: () => {
                setNextStep(true)
                Ajax().Metrics.captureEvent(Events.billingCreationStep2HaveBillingAccount)
              }
            })])
          ])
        ])
      ])
  }

  const step3 = () => {
    const isActive = activeStep === 3
    //const isDone = activeStep > 3

    const linkToSupport =
        h(Link, {
          ...Utils.newTabLinkProps, style: { textDecoration: 'underline', color: colors.accent() },
          href: 'https://support.terra.bio/hc/en-us/articles/360026182251'
        },
        ['Learn how to set up a Google Cloud Billing account']
        )

    const checkbox =
        div({ style: { width: '25%', float: 'right' } }, [
          h(LabeledCheckbox, {
            checked: verified === true,
            onChange: async () => {
              Ajax().Metrics.captureEvent(Events.billingCreationStep3VerifyUserAdded)
              if (activeStep > 3) {
                resetStep3()
              } else {
                await authorizeAndLoadAccounts()
                setVerified(true)
                next()
              }
            }
          }, [
            p({ style: { ...styles.radioButtonLabel, marginLeft: '2rem', marginTop: '-1.3rem' } }, [
              'I have verified the user has been added to my account (requires reauthentication)'
            ])
          ])
        ])

    const addTerraAsBillingAccountUser =
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
          div({ style: { marginTop: '3rem' } }, [linkToSupport])]),
          div({ style: { width: '25%', float: 'right' } }, [
            div({ style: { display: 'flex', flexDirection: 'row' } }, [
              h(RadioButton, {
                text: "I don't have access to do this", name: 'permission',
                checked: accessToAddBillingAccountUser === false,
                disabled: !isActive,
                labelStyle: { ...styles.radioButtonLabel },
                onChange: () => {
                  Ajax().Metrics.captureEvent(Events.billingCreationStep3BillingAccountNoAccess)
                  setAccessToAddBillingAccountUser(false)
                  if (activeStep > 3) {
                    setActiveStep(3)
                    setRefreshed(false)
                  }
                }
              }),
            ]),
            div({ style: { marginTop: '2rem', display: 'flex', flexDirection: 'row' } }, [
              h(RadioButton, {
                text: 'I have added terra-billing as a billing account user (requires reauthentication)',
                name: 'permission',
                checked: accessToAddBillingAccountUser === true,
                disabled: !isActive,
                labelStyle: { ...styles.radioButtonLabel },
                onChange: async () => {
                  Ajax().Metrics.captureEvent(Events.billingCreationStep3AddedTerraBilling)
                  setAccessToAddBillingAccountUser(true)
                  await authorizeAndLoadAccounts()
                  next()
                }
              })
            ])
          ])
        ])

    const contactBillingAccountAdministrator =
        fieldset({ style: { border: 'none', margin: 0, padding: 0, display: 'block' } }, [
          legend({
            style: {
              maxWidth: '55%',
              fontSize: 14,
              lineHeight: '22px',
              whiteSpace: 'pre-wrap',
              marginTop: '0.25rem',
              float: 'left'
            }
          },
          [
            span(['Contact your billing account administrator and have them add you and ',
              span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']), ' as a Billing Account User',
              span({ style: { fontWeight: 'bold' } }, [' to your organization\'s billing account.'])]),
            div({ style: { marginTop: '2rem' } }, [linkToSupport])
          ]),
          checkbox
        ])

    return h(Step, { isActive }, [
      StepHeader({ title: 'STEP 3' }),
      (activeStep >= 3) && (!accessToBillingAccount || (accessToAddBillingAccountUser === false)) ?
        contactBillingAccountAdministrator : addTerraAsBillingAccountUser
    ])
  }

  const step4 = () => {
    const isActive = activeStep === 4

    return h(Step, { isActive }, [
      StepHeader({ title: 'STEP 4' }),
      span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap', width: '75%' } },
        ['Create a Terra project to connect your Google billing account to Terra. ' +
          'Billing projects allow you to manage your workspaces and are required to create one.']),
      div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', height: 'auto' } }, [
        div({ style: { maxWidth: '35%', paddingBottom: '4rem' } }, [
          CreateGCPBillingProject({
            billingAccounts, chosenBillingAccount, setChosenBillingAccount,
            billingProjectName, setBillingProjectName, existing, disabled: !isActive
          })
        ]),
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
            !refreshed ? div({ style: { paddingInline: '0.5rem', lineHeight: '24px', fontWeight: 500 } }, [
              'You do not have access to any Google Billing Accounts. Please verify that a billing account has been created in the ' +
                    'Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your billing account.',
              div({ style: { marginTop: '0.5rem' } }, [
                h(Link, {
                  style: { textDecoration: 'underline', color: colors.accent() },
                  onClick: async () => {
                    Ajax().Metrics.captureEvent(Events.billingCreationRefreshStep3)
                    await authorizeAndLoadAccounts()
                    setRefreshed(true)
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
      ])
    ])
  }

  return StepWizard({
    title: 'Link a Google Cloud billing account to Terra',
    intro: `The linked billing account is required to cover all Google Cloud data storage, compute and egress costs incurred in a Terra workspace.
        Cloud costs are billed directly from Google and passed through Terra billing projects with no markup.`,
    children: [step1(), step2(), step3(), step4()]
  })
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
