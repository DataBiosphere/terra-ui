import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
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

const RenameColumnModal = ({ onDismiss, onSuccess, namespace, name, entityType, oldAttributeName }) => {
  // State
  const [newAttributeName, setNewAttributeName] = useState('')
  const [renaming, setRenaming] = useState(false)

  return h(Modal, {
    onDismiss,
    title: 'Rename Column',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: _.flow(
        withErrorReporting('Error renaming column.'),
        Utils.withBusyState(setRenaming)
      )(async () => {
        await Ajax().Workspaces.workspace(namespace, name).renameEntityColumn(entityType, oldAttributeName, newAttributeName)
        onSuccess()
      })
    }, ['Rename'])
  }, [h(IdContainer, [id => h(Fragment, [
    div('Workflow configurations that reference the current column name will need to be updated manually.'),
    h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
    tableNameInput({
      inputProps: {
        id, value: newAttributeName,
        onChange: v => {
          setNewAttributeName(v)
        }
      }
    }),
    renaming && spinnerOverlay
  ])])])
}

export default RenameColumnModal
