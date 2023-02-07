import _ from 'lodash/fp'
import { ReactNode, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Select, useUniqueId } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { billingRoles } from 'src/pages/billing/List'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import { LabeledField, StepFields } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate } from 'validate.js'


interface AddUserStepProps {
  isActive: boolean
  billingProjectName?: string
}

export const emailFieldId = 'azure-billing-wizard_add-user-step_email-field'

export const AddUserStep = ({ isActive, billingProjectName }: AddUserStepProps) => {
  const [emails, setEmails] = useState<string>()
  const [emailErrors, setEmailErrors] = useState<ReactNode>()
  const [selectedRole, setSelectedRole] = useState()
  const roleFieldId = useUniqueId()
  const signal = useCancellation()


  const addUsers = async () => {
    await Promise.all(_.map(
      email => Ajax(signal).Billing.addProjectUser(billingProjectName, [selectedRole], email),
      emails?.split(',')?.map(v => v?.trim()).filter(v => v?.length > 0)
    ))
    Ajax().Metrics.captureEvent(Events.billingAzureCreationUserAdded)
  }

  const validateEmails = () => {
    if (!emails || emails.length === 0) {
      // fixme: needs a key
      setEmailErrors(Utils.summarizeErrors(['Enter an email to add a user']))
    } else {
      const separateEmails = emails?.split(',').filter(v => !!(v.trim().length))
      const errors: ReactNode[] = []
      _.forEach(email => {
        const validation = validate({ [email]: email }, { [email]: { email: true } })?.[email]
        const error = Utils.summarizeErrors(validation)
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
      title: 'STEP 3', children: [
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
                placeholder: 'Enter emails of users to add',
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
          onClick: addUsers,
          role: 'button',
          'aria-label': 'add-users-to-azure-billing-project',
          disabled: !!(!isActive || !emails || !!emailErrors || !selectedRole),
          children: ['Add Users']
        }),
      ]
    })
  ])
}
