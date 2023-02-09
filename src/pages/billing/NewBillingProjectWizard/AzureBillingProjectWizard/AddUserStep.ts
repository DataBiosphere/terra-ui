import { CSSProperties, ReactNode, useState } from 'react'
import { div, h, li, ul } from 'react-hyperscript-helpers'
import { ButtonOutline, Select, useUniqueId } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import * as Utils from 'src/libs/utils'
import { allBillingRoles, BillingRole } from 'src/pages/billing/models/BillingRole'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'


export interface AddUserInfo {
  emails: string
  role: BillingRole
}

interface AddUserStepProps {
  isActive: boolean
  users: Array<AddUserInfo>
  setUsers: (users: Array<AddUserInfo>) => void
}


export const AddUserStep = ({ isActive, users, setUsers }: AddUserStepProps) => {
  const [emails, setEmails] = useState<string>()
  const [emailErrors, setEmailErrors] = useState<ReactNode>()
  const [role, setRole] = useState<BillingRole>()
  const emailFieldId = useUniqueId()
  const roleFieldId = useUniqueId()

  const validateEmail = () => {
    if (!emails || emails.length === 0) {
      setEmailErrors(Utils.summarizeErrors(['Enter an email to add a user']))
    } else {
      const errors = emails.split(',')
        .map(email => Utils.summarizeErrors(validate({ [email]: email }, { [email]: { email: true } })?.[email]))
        .filter(error => !!error)
      if (errors.length > 0) {
        setEmailErrors(errors)
      } else {
        setEmailErrors(undefined)
      }
    }
  }

  const addUser = () => {
    if (emails && role && !emailErrors) {
      setUsers([{ emails, role }, ...users])
      setRole(undefined)
      setEmails('')
    }
  }

  return h(Step, { isActive, style: { height: '16rem' } }, [
    h(StepHeader, { title: 'STEP 3' }, [
      'Optional: Add additional users to your Terra billing project. ',
      'For bulk upload, separate email addresses by a comma. ',
      'Any email addresses not associated with a Terra account will be sent an email to register.'
    ]),
    h(StepFields, { disabled: false }, [
      ul({ style: { display: 'flex', flexDirection: 'column-reverse', width: '100%', margin: 0, padding: 0 } }, [
        li({ style: addUserLIStyles, key: 'add-user-input' }, [
          div({ style: emailFieldStyles }, [
            h(LabeledField, { label: 'User email', formId: emailFieldId }, []),
            ValidatedInput({
              inputProps: {
                id: emailFieldId,
                value: emails,
                placeholder: 'Enter email of users to add',
                onChange: setEmails,
                onBlur: validateEmail
              },
              error: emailErrors
            })
          ]),
          div({ style: roleFieldStyles }, [
            h(LabeledField, { label: 'Role', formId: roleFieldId }, []),
            h(Select, { id: roleFieldId, placeholder: 'Select a role', value: role, onChange: ({ value }) => setRole(value), options: billingRoleOptions })
          ]),
          h(SpacedButton, { onClick: addUser, iconShape: 'plus', buttonLabel: 'add-user' })
        ]),
        ...users.map(user => h(AddedUserDisplay, { user, remove: () => setUsers(users.filter(u => u.emails !== user.emails)) })),
      ])
    ])
  ])
}


const billingRoleOptions = allBillingRoles.map(role => ({ label: role, value: role }))

const addUserLIStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  width: '75%',
  alignSelf: 'start',
  justifyContent: 'start',
  margin: '0',
  padding: 0,
  alignContent: 'center',
  alignItems: 'center'
}
const addUserFieldStyles: CSSProperties = {
  marginLeft: '0rem',
  marginRight: '2rem',
  marginTop: '0',
  marginBottom: '0'
}

const emailFieldStyles: CSSProperties = {
  width: '30%',
  ...addUserFieldStyles
}

const roleFieldStyles: CSSProperties = {
  width: '25%',
  ...addUserFieldStyles
}


interface AddedUserDisplayProps {
  user: AddUserInfo
  remove: () => void
}

const AddedUserDisplay = ({ user, ...props }: AddedUserDisplayProps) => {
  const emailFieldId = useUniqueId()
  const roleFieldId = useUniqueId()
  return li({ style: addUserLIStyles, key: user.emails }, [
    div({ style: emailFieldStyles }, [
      h(LabeledField, { label: 'User email', formId: emailFieldId }, []),
      ValidatedInput({ inputProps: { disabled: true, id: emailFieldId, value: user.emails } })
    ]),
    div({ style: roleFieldStyles }, [
      h(LabeledField, { label: 'Role', formId: roleFieldId }, []),
      h(Select, { id: roleFieldId, disabled: true, value: user.role, options: billingRoleOptions })
    ]),
    h(SpacedButton, { onClick: props.remove, iconShape: 'times', buttonLabel: 'remove-user' })
  ])
}

interface SpacedButtonProps {
  onClick: () => void
  iconShape: string
  buttonLabel: string
}

const SpacedButton = ({ onClick, ...props }: SpacedButtonProps) => div({ style: addUserFieldStyles }, [
  div({ style: { paddingTop: '2.25rem' } }), // spacer element to make two flex lines, so the button lines up with the input fields
  h(ButtonOutline, { onClick, role: 'button', 'aria-label': props.buttonLabel }, [icon(props.iconShape, {})])
])

