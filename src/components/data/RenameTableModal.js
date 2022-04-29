import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


export const tableNameInput = ({ inputProps, ...props }) => h(ValidatedInput, {
  ...props,
  inputProps: {
    ...inputProps,
    autoFocus: true,
    placeholder: 'Enter a name'
  }
})

const RenameTableModal = ({ onDismiss, namespace, name, selectedDataType }) => {
  // State
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const signal = useCancellation()

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: async () => {
        try {
          await Ajax(signal).Workspaces.workspace(namespace, name).renameEntityType(selectedDataType, newName)
        } catch (err) {
          reportError('Error renaming data table.', err)
        }
      }
    }, ['Rename'])
  }, [h(IdContainer, [id => h(Fragment, [
    h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
    tableNameInput({
      inputProps: {
        id, value: newName,
        onChange: v => {
          setNewName(v)
        }
      }
    })
  ])])])
}

export default RenameTableModal
