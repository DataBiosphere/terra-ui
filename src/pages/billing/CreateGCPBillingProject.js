import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { IdContainer, Select } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { formHint, FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import validate from 'validate.js'


const CreateGCPBillingProject = ({
  billingAccounts, chosenBillingAccount, setChosenBillingAccount,
  billingProjectName, setBillingProjectName, existing, disabled = false
}) => {
  const [billingProjectNameTouched, setBillingProjectNameTouched] = useState(false)

  const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })

  return h(Fragment, [
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
            if (!billingProjectNameTouched) {
              Ajax().Metrics.captureEvent(Events.billingCreationGCPProjectNameEntered)
            }
            setBillingProjectNameTouched(true)
          },
          disabled
        },
        error: billingProjectNameTouched && Utils.summarizeErrors(errors?.billingProjectName)
      })
    ])]),
    !(billingProjectNameTouched && errors) && formHint('Name must be unique and cannot be changed.'),
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
      div({ style: { fontSize: 14 } }, [
        h(Select, {
          id,
          isMulti: false,
          placeholder: 'Select a billing account',
          value: chosenBillingAccount,
          onChange: ({ value }) => {
            setChosenBillingAccount(value)
            Ajax().Metrics.captureEvent(Events.billingCreationGCPBillingAccountSelected)
          },
          options: _.map(account => {
            return {
              value: account,
              label: account.displayName
            }
          }, billingAccounts),
          isDisabled: disabled
        })
      ])
    ])])
  ])
}

export default CreateGCPBillingProject
