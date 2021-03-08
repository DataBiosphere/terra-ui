import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { FormLabel } from 'src/libs/forms'


export const NameModal = ({ onSuccess, onDismiss, thing, value }) => {
  const [name, setName] = useState(value || '')
  const isUpdate = value !== undefined

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
          }
        })
      ])
    ])
  ])
}
