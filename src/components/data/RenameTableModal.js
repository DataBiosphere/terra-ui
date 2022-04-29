import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


export const tableNameInput = ({ inputProps, ...props }) => h(ValidatedInput, {
  ...props,
  inputProps: {
    ...inputProps,
    autoFocus: true,
    placeholder: 'Enter a name'
  }
})

const RenameTableModal = ({ onDismiss, selectedDataType, workspace }) => {
  // State
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: console.log(workspace)
    }, ['Rename'])
  }, [h(IdContainer, [id => h(Fragment, [
    h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
    tableNameInput({
      inputProps: {
        id, value: newName,
        onChange: v => {
          console.log(v)
        }
      }
    })
  ])])])
}

export default RenameTableModal
