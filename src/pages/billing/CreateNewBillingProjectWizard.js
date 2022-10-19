import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, h2, li, ol, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Link, RadioButton, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import { formHint, FormLabel } from 'src/libs/forms'
import { setLocalPref } from 'src/libs/prefs'
import * as Utils from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import validate from 'validate.js'


const styles = {
  stepBanner: active => {
    return {
      borderRadius: '8px', boxSizing: 'border-box',
      padding: '1.5rem 2rem',
      marginTop: '1rem',
      display: 'flex',
      border: active ? '1px solid #4D72AA' : 'none',
      backgroundColor: active ? '#4D72AA0C' : '#6D6E700D',
      boxShadow: active ? '0 0 5px 0 rgba(77,114,170,0.5)' : 'none'
    }
  },
  radioButtonLabel: {
    marginLeft: '1rem', color: '#4D72AA', fontWeight: 500, lineHeight: '22px'
  }
}

const CreateNewBillingProjectWizard = ({ onSuccess, billingAccounts, authorizeAndLoadAccounts }) => {
  const persistenceId = 'billing'
  const [accessToBillingAccount, setAccessToBillingAccount] = useState()
  const [verified, setVerified] = useState(false)
  const [billingProjectName, setBillingProjectName] = useState('')
  const [chosenBillingAccount, setChosenBillingAccount] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [existing, setExisting] = useState([])
  const [billingProjectNameTouched, setBillingProjectNameTouched] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    setLocalPref(persistenceId, { activeStep, accessToBillingAccount, verified })
  }, [persistenceId, activeStep, accessToBillingAccount, verified])

  const next = () => {
    setActiveStep(activeStep + 1)
  }

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createGCPProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess(billingProjectName)
    } catch (error) {
      if (error.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })

  const step1 = () => {
    const isActive = activeStep === 1
    const isDone = activeStep > 1

    return li({ style: { ...styles.stepBanner(isActive), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      div({ style: { width: '60%' } }, [
        h2({ style: { fontSize: 18, marginTop: 0 } }, ['STEP 1']),
        span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' } },
          ['Go to the Google Cloud Platform Billing Console and sign-in with the same user you use to login to Terra.'])
      ]),
      h(Clickable, {
        style: {
          display: 'inline-flex', justifyContent: 'space-around', alignItems: 'center',
          height: '2.5rem', fontWeight: 500, fontSize: 14, borderRadius: 2, whiteSpace: 'nowrap',
          color: isDone ? 'white' : colors.accent(),
          backgroundColor: isDone ? colors.success() : 'none',
          border: isDone ? 'none' : `1px solid ${colors.accent()}`,
          paddingInline: isDone ? '1rem' : '1.5rem',
          marginLeft: '2rem', textTransform: 'none'
        },
        href: 'https://console.cloud.google.com',
        ...Utils.newTabLinkProps,
        onClick: () => {
          if (!isDone) {
            next()
          }
        }
      }, [
        isDone && icon('success-standard', { size: 16, style: { color: 'white', marginRight: '0.5rem' } }),
        'Go to Google Cloud Console'
      ])
    ])
  }

  const step2 = () => {
    const isActive = activeStep === 2
    const isDone = activeStep > 2

    return li({ style: { ...styles.stepBanner(isActive), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      div({ style: { width: '55%', marginLeft: '0.5rem' } }, [
        h2({ style: { fontSize: 18, marginTop: 0 } }, ['STEP 2']),
        span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' } },
          ['Select an existing billing account or create a new one.\n' +
          '\nIf you are creating a new billing account, you may be eligible for $300 in free credits. ' +
          'Follow the instructions to activate your account in the Google Cloud Console.'])
      ]),
      div({ style: { width: '25%' } }, [
        div({ style: { display: 'flex', displayDirection: 'row' } }, [
          h(RadioButton, {
            text: 'I don’t have access to a Cloud billing account',
            name: 'access-to-account',
            checked: accessToBillingAccount === false,
            labelStyle: { ...styles.radioButtonLabel },
            onChange: () => {
              if (!isDone) {
                next()
              } else {
                setActiveStep(3)
                setVerified(false)
              }
              setAccessToBillingAccount(false)
            }
          })
        ]),
        div({ style: { marginTop: '2rem', display: 'flex', displayDirection: 'row' } }, [
          h(RadioButton, {
            text: 'I have a billing account',
            name: 'access-to-account',
            checked: accessToBillingAccount === true,
            labelStyle: { ...styles.radioButtonLabel },
            onChange: () => {
              if (!isDone) {
                next()
              } else {
                setActiveStep(3)
                setVerified(false)
              }
              setAccessToBillingAccount(true)
            }
          })
        ])
      ])
    ])
  }

  const step3 = () => {
    const isActive = activeStep === 3
    const isDone = activeStep > 3

    const haveAccessToBillingHeader =
      div({ style: { width: '75%' } }, [
        h2({ style: { fontSize: 18, marginTop: 0 } }, ['STEP 3']),
        span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' } },
          ['Add ', span({ style: { fontWeight: 'bold' } }, 'terra-billing@terra.bio'), ' as a Billing Account User',
            span({ style: { fontWeight: 'bold' } }, ' to your billing account.')]),
        div({ style: { marginTop: '1rem' } }, [
          h(Link, {
            ...Utils.newTabLinkProps, style: { textDecoration: 'underline' },
            href: 'https://support.terra.bio/hc/en-us/articles/360026182251'
          }, [
            'Learn how to set up a Google Cloud Billing account'
          ])
        ])
      ])
    const dontHaveAccessToBillingHeader =
      div({ style: { width: '55%' } }, [
        h2({ style: { fontSize: 18, marginTop: 0 } }, ['STEP 3']),
        span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap' } }, [
          'Contact your billing account administrator and have them add you and ',
          span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']), ' as a Billing Account User',
          span({ style: { fontWeight: 'bold' } }, [' to your organization\'s billing account.'])
        ]),
        div({ style: { marginTop: '1rem' } }, [
          h(Link, {
            ...Utils.newTabLinkProps, style: { textDecoration: 'underline' },
            href: 'https://support.terra.bio/hc/en-us/articles/360026182251'
          }, [
            'Learn how to set up a Google Cloud Billing account'
          ])
        ])
      ])

    return li({ style: { ...styles.stepBanner(isActive), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      isActive || isDone ?
        (accessToBillingAccount ? haveAccessToBillingHeader : dontHaveAccessToBillingHeader) :
        haveAccessToBillingHeader,
      isActive || isDone ?
        div({ style: { width: '25%', display: 'flex', displayDirection: 'row' } }, [
          h(RadioButton, {
            text: 'I have verified the user has been added to my account',
            name: 'verified', checked: verified === true,
            labelStyle: { ...styles.radioButtonLabel },
            onChange: async () => {
              if (!Auth.hasBillingScope()) { await authorizeAndLoadAccounts() }
              setVerified(true)
              next()
            }
          })
        ]) : div({ style: { width: '25%' } }, [
          div({ style: { display: 'flex', displayDirection: 'row' } }, [
            h(RadioButton, {
              text: 'I don\'t have access to do this', name: 'access-to-account',
              disabled: !isActive, labelStyle: { ...styles.radioButtonLabel }
            })
          ]),
          div({ style: { marginTop: '2rem', display: 'flex', displayDirection: 'row' } }, [
            h(RadioButton, {
              text: 'I have a billing account', name: 'access-to-account',
              disabled: !isActive, labelStyle: { ...styles.radioButtonLabel }
            })
          ])
        ])
    ])
  }

  const step4 = () => {
    const isActive = activeStep === 4
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })

    return li({ style: { ...styles.stepBanner(isActive), flexDirection: 'column' } }, [
      h2({ style: { fontSize: 18, marginTop: 0 } }, ['STEP 4']),
      span({ style: { fontSize: 14, lineHeight: '22px', whiteSpace: 'pre-wrap', width: '75%' } },
        ['Create a Terra project to connect your Google billing account to Terra. ' +
        'Billing projects allow you to manage your workspaces and are required to create one.']),
      div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' } }, [
        div({ style: { maxWidth: '35%' } }, [
          h(Fragment, [
            h(IdContainer, [id => h(Fragment, [
              h(FormLabel, { htmlFor: id, required: true }, ['Terra billing project']),
              h(ValidatedInput, {
                inputProps: {
                  id,
                  autoFocus: true,
                  value: billingProjectName,
                  placeholder: 'Enter a name',
                  onChange: v => {
                    setBillingProjectName(v)
                    setBillingProjectNameTouched(true)
                  },
                  disabled: !isActive
                },
                error: billingProjectNameTouched && Utils.summarizeErrors(errors?.billingProjectName)
              })
            ])])
          ]),
          !(billingProjectNameTouched && errors) && formHint('Name must be unique and cannot be changed.'),
          h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
            div({ style: { fontSize: 14 } }, [
              h(Select, {
                id,
                isMulti: false,
                placeholder: 'Select a billing account',
                value: chosenBillingAccount,
                onChange: ({ value }) => setChosenBillingAccount(value),
                options: _.map(account => {
                  return {
                    value: account,
                    label: account.displayName
                  }
                }, billingAccounts),
                isDisabled: !isActive
              })
            ])
          ])])
        ]),
        isActive && _.isEmpty(billingAccounts) ?
          div({
            style: {
              display: 'flex', alignItems: 'flex-start',
              margin: '1rem 1rem 0', padding: '1rem',
              border: `1px solid ${colors.warning()}`, borderRadius: '5px',
              backgroundColor: colors.warning(0.15), maxWidth: '50%'
            }
          }, [
            icon('warning-standard', { style: { color: colors.warning(), marginRight: '0.5rem', marginTop: '0.25rem' } }),
            div({ style: { lineHeight: '24px', fontWeight: 500 } }, [
              'You do not have access to any Google Billing Accounts. Please verify that a billing account has been created in the ' +
              'Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your billing account.',
              div({ style: { marginTop: '1rem' } }, [
                h(Link, {
                  style: { textDecoration: 'underline' },
                  onClick: async () => {
                    if (!Auth.hasBillingScope()) { await authorizeAndLoadAccounts() }
                  }
                }, ['Refresh Step 3'])
              ])
            ])
          ]) :
          div({ style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
            h(ButtonPrimary, {
              style: { marginTop: '2rem', height: '2.5rem', borderRadius: 2, textTransform: 'none', paddingInline: isBusy ? '1rem' : '2rem' },
              onClick: submit,
              disabled: !isActive
            }, [
              isBusy && icon('loadingSpinner', { size: 16, style: { color: 'white', marginRight: '0.5rem' } }),
              'Create Terra Billing Project'
            ]),
            isBusy && div({ style: { marginTop: '1rem' } }, ['This may take a minute'])
          ])
      ])
    ])
  }

  return div({ style: { padding: '1.5rem 3rem' } }, [
    h2({ style: { fontWeight: 'bold', fontSize: 18 } },
      ['Link a Google Cloud billing account to Terra']),
    div({
      style: {
        marginTop: '0.5rem', fontSize: 14, lineHeight: '22px',
        width: 'calc(100% - 150px)', maxWidth: 720
      }
    }, [
      `The linked billing account is required to cover all Google Cloud data storage, compute and egress costs incurred in a Terra workspace.
        Cloud costs are billed directly from Google and passed through Terra billing projects with no markup.`
    ]),
    ol({ style: { margin: 0, padding: 0, listStyleType: 'none' } }, [
      h(step1),
      h(step2),
      h(step3),
      h(step4)
    ])
  ])
}

export default CreateNewBillingProjectWizard
