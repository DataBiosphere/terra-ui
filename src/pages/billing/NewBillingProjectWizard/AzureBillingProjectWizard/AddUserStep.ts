import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Select, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'
import { BillingProject } from 'src/pages/billing/models'
import { LabeledField, Step, StepFields, StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard'
import { validate } from 'validate.js'


interface AddUserStepProps {
  isActive: boolean
  billingProject?: BillingProject
}


export const AddUserStep = ({ isActive, billingProject }: AddUserStepProps) => {
  const [emails, setEmails] = useState<string>()
  const [emailErrors, setEmailErrors] = useState<ReactNode>()
  const emailFieldId = useUniqueId()

  const [selectedRole, setSelectedRole] = useState()
  const roleFieldId = useUniqueId()


  const addUsers = async () => {
    await Promise.all(_.map(
      async email => await Ajax().Billing.addProjectUser(billingProject?.projectName, [selectedRole], email),
      emails?.split(',')?.map(v => v?.trim()).filter(v => v?.length > 0)
    ))
    // TODO: do something with results
  }

  const validateEmails = () => {
    if (!emails) {
      setEmailErrors('Enter an email to add a user')
    } else {
      const separateEmails = emails?.split(',').filter(v => !!(v.trim().length))
      const errors: ReactNode[] = []
      _.forEach(email => {
        const error = Utils.summarizeErrors(validate({ [email]: email }, { [email]: { email: true } })?.[email])
        if (error) {
          errors.push(...error)
        }
      }, separateEmails)
      if (!!errors.length) {
        setEmailErrors(errors)
      } else {
        setEmailErrors(undefined)
      }
    }
  }

  return h(Step, { isActive }, [
    StepHeader({
      title: 'STEP 3', description: [
        'Optional: Add additional users to your Terra billing project. ',
        'For bulk upload, separate email addresses by a comma. ',
        'Any email addresses not associated with a Terra account will be sent an email to register'
      ]
    }),
    StepFields({
      disabled: !isActive, children: [
        LabeledField({
          label: 'User email', formId: emailFieldId, style: { width: '30%' }, children: [
            ValidatedInput({
              inputProps: {
                id: emailFieldId,
                value: emails,
                placeholder: 'Enter a name for the project',
                onChange: setEmails,
                onBlur: validateEmails
              },
              error: emailErrors
            })
          ]
        }),
        LabeledField({
          label: 'Role', formId: roleFieldId, style: { width: '30%' }, children: [
            h(Select, {
              id: roleFieldId,
              placeholder: 'Select a role',
              value: selectedRole,
              onChange: ({ value }) => setSelectedRole(value),
              options: [
                { label: billingRoles.owner, value: billingRoles.owner },
                { label: billingRoles.user, value: billingRoles.user }
              ]
            })
          ]
        }),
        ButtonPrimary({
          style: { margin: '2rem' },
          onClick: () => {
            addUsers()
          },
          disabled: !isActive || !emails || !!emailErrors || !selectedRole,
          children: ['Add']
        }),
      ]
    })
  ])
}
