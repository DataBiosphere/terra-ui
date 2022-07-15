import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import { allSavedColumnSettingsEntityTypeKey, useSavedColumnSettings } from 'src/components/data/SavedColumnSettings'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


const RenameTableModal = ({ onDismiss, onUpdateSuccess, namespace, name, selectedDataType, entityMetadata }) => {
  // State
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const {
    getAllSavedColumnSettings,
    updateAllSavedColumnSettings
  } = useSavedColumnSettings({ workspaceId: { namespace, name }, entityType: selectedDataType, entityMetadata })

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: _.flow(
        withErrorReporting('Error renaming data table.'),
        Utils.withBusyState(setRenaming)
      )(async () => {
        await Ajax().Metrics.captureEvent(Events.workspaceDataRenameTable, { oldName: selectedDataType, newName })
        await Ajax().Workspaces.workspace(namespace, name).renameEntityType(selectedDataType, newName)

        // Move column settings to new table
        const oldTableColumnSettingsKey = allSavedColumnSettingsEntityTypeKey({ entityType: selectedDataType })
        const newTableColumnSettingsKey = allSavedColumnSettingsEntityTypeKey({ entityType: newName })
        const allColumnSettings = await getAllSavedColumnSettings()
        const tableColumnSettings = _.get(oldTableColumnSettingsKey, allColumnSettings)
        if (tableColumnSettings) {
          await updateAllSavedColumnSettings(_.flow(
            _.set(newTableColumnSettingsKey, tableColumnSettings),
            _.unset(oldTableColumnSettingsKey)
          )(allColumnSettings))
        }

        onUpdateSuccess()
      })
    }, ['Rename'])
  }, [h(IdContainer, [id => h(Fragment, [
    div('Workflow configurations that reference the current table name will need to be updated manually.'),
    h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
    h(ValidatedInput, {
      inputProps: {
        id, value: newName,
        autoFocus: true,
        placeholder: 'Enter a name',
        onChange: v => {
          setNewName(v)
        }
      }
    }),
    renaming && spinnerOverlay
  ])])])
}

export default RenameTableModal
