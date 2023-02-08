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
  email: string
  role: BillingRole
}

interface AddUserStepProps {
  isActive: boolean
  users: Array<AddUserInfo>
  setUsers: (users: Array<AddUserInfo>) => void
}


export const AddUserStep = ({ isActive, users, setUsers }: AddUserStepProps) => {
  const [email, setEmail] = useState<string>()
  const [emailErrors, setEmailErrors] = useState<ReactNode>()
  const [role, setRole] = useState<BillingRole>()
  const emailFieldId = useUniqueId()
  const roleFieldId = useUniqueId()

  const validateEmail = () => {
    if (!email || email.length === 0) {
      setEmailErrors(Utils.summarizeErrors(['Enter an email to add a user']))
    } else {
      const validation = validate({ [email]: email }, { [email]: { email: true } })?.[email]
      setEmailErrors(Utils.summarizeErrors(validation))
    }
  }

  const addUser = () => {
    if (email && role && !emailErrors) {
      setUsers([{ email, role }, ...users])
      setRole(undefined)
      setEmail('')
    }
  }

  return h(Step, { isActive }, [
    h(StepHeader, { title: 'STEP 3' }, [
      'Optional: Add additional users to your Terra billing project. ',
      'For bulk upload, separate email addresses by a comma. ',
      'Any email addresses not associated with a Terra account will be sent an email to register'
    ]),
    h(StepFields, { disabled: false }, [
      ul({ style: { display: 'flex', flexDirection: 'column-reverse', width: '100%', margin: 0, padding: 0 } }, [
        li({ style: addUserLIStyles, key: 'add-user-input' }, [
          div({ style: emailFieldStyles }, [
            h(LabeledField, { label: 'User email', formId: emailFieldId }, []),
            ValidatedInput({
              inputProps: {
                id: emailFieldId,
                value: email,
                placeholder: 'Enter email of users to add',
                onChange: setEmail,
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
        ...users.map(user => h(AddedUserDisplay, { user, remove: () => setUsers(users.filter(u => u.email !== user.email)) })),
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
  alignItems: 'center'//
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
  return li({ style: addUserLIStyles, key: user.email }, [
    div({ style: emailFieldStyles }, [
      h(LabeledField, { label: 'User email', formId: emailFieldId }, []),
      ValidatedInput({ inputProps: { disabled: true, id: emailFieldId, value: user.email } })
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

/*
interface AddUserFieldProps {
  addUser: (AddUserInfo) => void
}


const AddUserField = ({...props}: AddUserFieldProps) => {
  const [userEmail, setUserEmail] = useState<string>()
  const [emailErrors, setEmailErrors] = useState<ReactNode>()
  const [role, setRole] = useState<BillingRole>()
  const emailFieldId = useUniqueId()
  const roleFieldId = useUniqueId()

  const validateEmail = () => {
    if (!userEmail || userEmail.length === 0) {
      setEmailErrors(Utils.summarizeErrors(['Enter an email to add a user']))
    } else {
      const validation = validate({[userEmail]: userEmail}, {[userEmail]: {email: true}})?.[userEmail]
      setEmailErrors(Utils.summarizeErrors(validation))
    }
  }

  return li({style: addUserLIStyles, key: 'add-user-input'}, [
    div({style: emailFieldStyles}, [
      h(LabeledField, {label: 'User email', formId: emailFieldId,}, []),
      ValidatedInput({
        inputProps: {
          id: emailFieldId,
          value: userEmail,
          placeholder: 'Enter email of users to add',
          onChange: setUserEmail,
          onBlur: validateEmail
        },
        error: emailErrors
      })
    ]),
    div({style: roleFieldStyles}, [
      h(LabeledField, {label: 'Role', formId: roleFieldId}, []),
      h(Select, {
        id: roleFieldId,
        placeholder: 'Select a role',
        value: role,
        onChange: ({value}) => setRole(value),
        options: billingRoleOptions
      })
    ]),
    div({style: buttonWrapperStyles}, [
      div({style: {paddingTop: '2.25rem'}}),
      h(ButtonOutline, {
        onClick: () => {
          if (userEmail && role && !emailErrors) {
            props.addUser({email: userEmail, role})
            setRole(undefined)
            setUserEmail('')
          }
        },
        role: 'button',
        'aria-label': 'add-user',
        disabled: !userEmail || !role || emailErrors,//!!(!isActive || !emails || !!emailErrors || !selectedRole),
      }, [icon('plus', {})])
    ])
  ])
}
*/

