import { Fragment, useState, useEffect } from 'react'
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
    if (name !== '' && (
      (_.isRegExp(validator) && !validator.test(name)) ||
      (_.isFunction(validator) && !validator(name))
    )) {
      setError(validationMessage)
    }
    else {
      setError(null)
    }
  }, [name])

  return h(Modal, {
    title: (isUpdate ? 'Update ' : 'Create a New ') + thing,
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: () => onSuccess({ name })
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
