import pluralize from 'pluralize'
import { ReactNode, useEffect, useState } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { formHint, FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import {
  columnEntryStyle,
  columnStyle, hintStyle,
  rowStyle
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles'
import {
  LabeledRadioButton, LabeledRadioGroup
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/LabeledRadioButton'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import {
  legendDetailsStyle,
  StepFieldLegend,
  StepFields
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'


interface EmailInputProps {
  emails: string
  onSetEmails: (emails: string, hasError: boolean) => void
  disabled: boolean
  errors: ReactNode
  setErrors: (ReactNode) => void
  onFocus: () => void
  label: string
  addSpacing: boolean
  inputDebounce?: number
}

const EmailInput = (props: EmailInputProps) => {
  const inputId = useUniqueId()
  const [debouncedEmails, setDebouncedEmails] = useState<ReactNode>()
  const [debouncedErrors, setDebouncedErrors] = useState<ReactNode>()

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedEmails(props.emails)
      setDebouncedErrors(props.errors)
    }, props.inputDebounce)
    return () => clearTimeout(timeoutId)
  }, [props.emails, props.errors, props.inputDebounce])

  const getIndividualEmails = emails => emails?.split(',').map(email => email.trim()).filter(email => !!email)
  const validateEmails = individualEmails => {
    const errors = individualEmails
      .map(email => !!email && Utils.summarizeErrors(validate({ [email]: email }, { [email]: { email: true } })?.[email]))
      .filter(error => !!error)
    return errors
  }

  return div({ style: columnEntryStyle(props.addSpacing) }, [
    h(FormLabel, { htmlFor: inputId }, [props.label]),
    h(ValidatedInput, {
      inputProps: {
        id: inputId,
        placeholder: 'comma-separated email addresses',
        disabled: props.disabled,
        onChange: emails => {
          const individualEmails = getIndividualEmails(emails)
          const emailErrors = validateEmails(individualEmails)
          if (emailErrors.length > 0) {
            props.setErrors(emailErrors)
            props.onSetEmails(emails, true)
          } else {
            props.setErrors(null)
            props.onSetEmails(emails, false)
          }
        },
        value: props.emails,
        onFocus: props.onFocus
      },
      error: debouncedErrors,
    }),
    !debouncedErrors && !!debouncedEmails && div({ style: hintStyle },
      [formHint(`${pluralize('email', getIndividualEmails(debouncedEmails).length, true)} entered`)])
  ])
}

interface AddUserStepProps {
  isActive: boolean
  userEmails: string
  ownerEmails: string
  onSetUserEmails: (emails: string, hasError: boolean) => void
  onSetOwnerEmails: (emails: string, hasError: boolean) => void
  addUsersOrOwners?: boolean
  onAddUsersOrOwners: (boolean) => void
  onOwnersOrUsersInputFocused: () => void
  inputDebounce?: number
}

export const AddUsersStep = ({ isActive, inputDebounce = 1000, ...props }: AddUserStepProps) => {
  const [userEmailErrors, setUserEmailErrors] = useState<ReactNode>()
  const [ownerEmailErrors, setOwnerEmailErrors] = useState<ReactNode>()

  return h(Step, { isActive, style: { minHeight: '21.5rem', paddingBottom: '0.5rem' } }, [
    h(StepHeader, { title: 'STEP 2' }),
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, { style: { width: '100%' } }, [
        'Add additional owners and users to your Terra Billing Project ',
        p({ style: { ...legendDetailsStyle, width: '95%' } }, [
          'Owners can assign permissions for their billing project, create new workspaces, and manage costs for all workspaces within the project. ' +
          'Users can create new workspaces and manage costs for workspaces they create within the project.'
        ]),
      ]),
      div({ style: columnStyle }, [
        h(LabeledRadioGroup, { style: { marginTop: 0, marginBottom: 0 } }, [
          LabeledRadioButton({
            text: "I don't have additional owners or users to add at this time", name: 'add-users',
            checked: props.addUsersOrOwners === false,
            onChange: changed => {
              props.onAddUsersOrOwners(!changed.target.checked)

              // clear any emails that they previously supplied.
              if (changed.target.checked) {
                setOwnerEmailErrors(null)
                setUserEmailErrors(null)
                props.onSetUserEmails('', false)
                props.onSetOwnerEmails('', false)
              }
            }
          }),
          LabeledRadioButton({
            text: 'Add the following owners and/or users', name: 'add-users',
            onChange: changed => {
              props.onAddUsersOrOwners(changed.target.checked)
            },
          })
        ]),
        div({ style: rowStyle },
          [
            h(EmailInput, {
              disabled: !props.addUsersOrOwners,
              emails: props.ownerEmails,
              onSetEmails: props.onSetOwnerEmails,
              errors: ownerEmailErrors,
              setErrors: setOwnerEmailErrors,
              onFocus: props.onOwnersOrUsersInputFocused,
              label: 'Owners',
              addSpacing: true,
              inputDebounce
            }),
            h(EmailInput, {
              disabled: !props.addUsersOrOwners,
              emails: props.userEmails,
              onSetEmails: props.onSetUserEmails,
              errors: userEmailErrors,
              setErrors: setUserEmailErrors,
              onFocus: props.onOwnersOrUsersInputFocused,
              label: 'Users',
              addSpacing: false,
              inputDebounce
            }),
          ])
      ])
    ])
  ])
}


