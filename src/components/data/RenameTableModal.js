import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, RadioButton, spinnerOverlay } from 'src/components/common'
import { warningBoxStyle } from 'src/components/data/data-utils'
import { allSavedColumnSettingsEntityTypeKey, useSavedColumnSettings } from 'src/components/data/SavedColumnSettings'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


const RenameTableModal = ({ onDismiss, onUpdateSuccess, namespace, name, selectedDataType, entityMetadata }) => {
  // State
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const setTableExists = _.includes(`${selectedDataType}_set`, _.keys(entityMetadata))
  const [renameSetTable, setRenameSetTable] = useState(false)

  const {
    getAllSavedColumnSettings,
    updateAllSavedColumnSettings
  } = useSavedColumnSettings({ workspaceId: { namespace, name }, entityType: selectedDataType, entityMetadata })

  const handleTableRename = async ({ oldName, newName }) => {
    await Ajax().Metrics.captureEvent(Events.workspaceDataRenameTable, { oldName, newName })
    await Ajax().Workspaces.workspace(namespace, name).renameEntityType(oldName, newName)

    // Move column settings to new table
    const oldTableColumnSettingsKey = allSavedColumnSettingsEntityTypeKey({ entityType: oldName })
    const newTableColumnSettingsKey = allSavedColumnSettingsEntityTypeKey({ entityType: newName })
    const allColumnSettings = await getAllSavedColumnSettings()
    const tableColumnSettings = _.get(oldTableColumnSettingsKey, allColumnSettings)
    if (tableColumnSettings) {
      await updateAllSavedColumnSettings(_.flow(
        _.set(newTableColumnSettingsKey, tableColumnSettings),
        _.unset(oldTableColumnSettingsKey)
      )(allColumnSettings))
    }
  }

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: _.flow(
        withErrorReporting('Error renaming data table.'),
        Utils.withBusyState(setRenaming)
      )(async () => {
        await handleTableRename({ oldName: selectedDataType, newName })
        if (renameSetTable) await handleTableRename({ oldName: `${selectedDataType}_set`, newName: `${newName}_set` })
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
    setTableExists && div({
      style: { ...warningBoxStyle, margin: '1rem 0 0.5rem' }
    }, [
      div({ style: { display: 'flex' } }, [
        icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
        'We have detected a set table that may be associated with the table that you are renaming. Please choose an option:'
      ]),
      div({ role: 'radiogroup', 'aria-label': 'we have detected a set table that may be associated with the table that you are renaming. please choose an option.' }, [
        div({ style: { paddingTop: '0.5rem' } }, [
          h(RadioButton, {
            text: 'Do not rename set table (default)',
            name: 'rename-set-table',
            checked: !renameSetTable,
            onChange: () => setRenameSetTable(false),
            labelStyle: { padding: '0.5rem', fontWeight: 'normal' }
          })
        ]),
        div({ style: { paddingTop: '0.5rem' } }, [
          h(RadioButton, {
            text: 'Rename set table',
            name: 'rename-set-table',
            checked: renameSetTable,
            onChange: () => setRenameSetTable(true),
            labelStyle: { padding: '0.5rem', fontWeight: 'normal' }
          })
        ])
      ])
    ]),
    renaming && spinnerOverlay
  ])])])
}

export default RenameTableModal
