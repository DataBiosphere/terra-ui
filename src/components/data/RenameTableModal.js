import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
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

const RenameTableModal = ({ onDismiss, onSuccess, namespace, name, selectedDataType }) => {
  // State
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: _.flow(
        Utils.withBusyState(setRenaming),
        withErrorReporting('Error renaming data table.')
      )(async () => {
        await Ajax().Metrics.captureEvent(Events.workspaceDataRenameTable, { oldName: selectedDataType, newName })
        await Ajax().Workspaces.workspace(namespace, name).renameEntityType(selectedDataType, newName)
        onSuccess()
      })
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
    }),
    renaming && spinnerOverlay
  ])])])
}

export default RenameTableModal
