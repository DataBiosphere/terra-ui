import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { FormLabel } from 'src/libs/forms'


export const NameModal = ({ onSuccess, onDismiss, thing, value, validator = null, validationMessage = null }) => {
  const [name, setName] = useState(value || '')
  const [error, setError] = useState(null)
  const isUpdate = value !== undefined

  useEffect(() => {
    if (name !== '' && _.isRegExp(validator) && !validator.test(name)) {
      setError(validationMessage)
    } else if (name !== '' && _.isFunction(validator)) {
      const msg = validator(name)
      setError(msg === false ? null : _.isString(msg) ? msg : validationMessage !== null ? validationMessage : 'Invalid input')
    } else {
      setError(null)
    }
  }, [name]) // eslint-disable-line react-hooks/exhaustive-deps

  return h(Modal, {
    title: (isUpdate ? 'Update ' : 'Create a New ') + thing,
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: () => onSuccess({ name }),
      disabled: error !== null
    }, [
      isUpdate ? 'Update ' : 'Create ',
      thing
    ])
  }, [
    h(IdContainer, [
      id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, [thing, ' name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: v => setName(v)
          },
          error
        })
      ])
    ])
  ])
}
