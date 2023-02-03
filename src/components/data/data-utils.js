import _ from 'lodash/fp'
import pluralize from 'pluralize'
import { Fragment, useState } from 'react'
import { b, div, fieldset, h, img, label, legend, li, p, span, ul } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import {
  absoluteSpinnerOverlay, ButtonOutline, ButtonPrimary, ButtonSecondary, Clickable, DeleteConfirmationModal, IdContainer, LabeledCheckbox, Link, RadioButton, Select, spinnerOverlay
} from 'src/components/common'
import { convertAttributeValue, getAttributeType } from 'src/components/data/attribute-utils'
import AttributeInput, { AttributeTypeInput } from 'src/components/data/AttributeInput'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { AutocompleteTextInput, PasteOnlyInput, TextInput, ValidatedInput } from 'src/components/input'
import Interactive from 'src/components/Interactive'
import { MenuButton } from 'src/components/MenuButton'
import Modal from 'src/components/Modal'
import { MenuDivider, MenuTrigger } from 'src/components/PopupTrigger'
import { SimpleTabBar } from 'src/components/tabBars'
import { Sortable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { UriViewerLink } from 'src/components/UriViewer'
import ReferenceData from 'src/data/reference-data'
import { Ajax } from 'src/libs/ajax'
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing'
import { wdsProviderName } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'
import { defaultAzureRegion, getRegionLabel } from 'src/libs/azure-utils'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import { notify } from 'src/libs/notifications'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import validate from 'validate.js'


export const warningBoxStyle = {
  backgroundColor: colors.warning(0.15),
  padding: '1rem 1.25rem',
  color: colors.dark(), fontWeight: 'bold', fontSize: 12
}

const errorTextStyle = { color: colors.danger(), fontWeight: 'bold', fontSize: 12, marginTop: '0.5rem' }

export const parseGsUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))

export const getDownloadCommand = (fileName, gsUri, accessUrl) => {
  const { url: httpUrl, headers: httpHeaders } = accessUrl || {}

  if (httpUrl) {
    const headers = _.flow(
      _.toPairs,
      _.reduce((acc, [header, value]) => `${acc}-H '${header}: ${value}' `, '')
    )(httpHeaders)
    const output = fileName ? `-o '${fileName}' ` : '-O '
    return `curl ${headers}${output}'${httpUrl}'`
  }

  if (gsUri) {
    return `gsutil cp ${gsUri} ${fileName || '.'}`
  }
}

export const getUserProjectForWorkspace = async workspace => (workspace && await canUseWorkspaceProject(workspace)) ?
  workspace.workspace.googleProject :
  requesterPaysProjectStore.get()

const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum) || _.startsWith('drs://', datum)

export const getRootTypeForSetTable = tableName => _.replace(/(_set)+$/, '', tableName)

export const entityAttributeText = (attributeValue, machineReadable) => {
  const { type, isList } = getAttributeType(attributeValue)

  return Utils.cond(
    [_.isNil(attributeValue), () => ''],
    [type === 'json', () => JSON.stringify(attributeValue)],
    [isList && machineReadable, () => JSON.stringify(attributeValue.items)],
    [type === 'reference' && isList, () => _.join(', ', _.map('entityName', attributeValue.items))],
    [type === 'reference', () => attributeValue.entityName],
    [isList, () => _.join(', ', attributeValue.items)],
    () => attributeValue?.toString()
  )
}

const maxListItemsRendered = 100

const renderDataCellTooltip = attributeValue => {
  const { type, isList } = getAttributeType(attributeValue)

  const renderArrayTooltip = items => {
    return _.flow(
      _.slice(0, maxListItemsRendered),
      items.length > maxListItemsRendered ?
        Utils.append(`and ${items.length - maxListItemsRendered} more`) :
        _.identity,
      _.join(', ')
    )(items)
  }

  return Utils.cond(
    [type === 'json' && _.isArray(attributeValue) && !_.some(_.isObject, attributeValue), () => renderArrayTooltip(attributeValue)],
    [type === 'json', () => JSON.stringify(attributeValue, undefined, 1)],
    [type === 'reference' && isList, () => renderArrayTooltip(_.map('entityName', attributeValue.items))],
    [type === 'reference', () => attributeValue.entityName],
    [isList, () => renderArrayTooltip(attributeValue.items)],
    () => attributeValue?.toString()
  )
}

export const renderDataCell = (attributeValue, workspace) => {
  const { workspace: { bucketName: workspaceBucket } } = workspace

  const renderCell = datum => {
    const stringDatum = Utils.convertValue('string', datum)

    return isUri(datum) ? h(UriViewerLink, { uri: datum, workspace }) : stringDatum
  }

  const renderArray = items => {
    return _.flow(
      _.slice(0, maxListItemsRendered),
      items.length > maxListItemsRendered ?
        Utils.append(`and ${items.length - maxListItemsRendered} more`) :
        _.identity,
      Utils.toIndexPairs,
      _.flatMap(([i, v]) => h(Fragment, { key: i }, [
        i > 0 && span({ style: { marginRight: '0.5rem', color: colors.dark(0.85) } }, ','),
        renderCell(v)
      ]))
    )(items)
  }

  const { type, isList } = getAttributeType(attributeValue)

  const tooltip = renderDataCellTooltip(attributeValue)

  const isOtherBucketGsUri = datum => {
    const [bucket] = parseGsUri(datum)
    return !!bucket && bucket !== workspaceBucket
  }

  const hasOtherBucketUrls = Utils.cond(
    [type === 'json' && _.isArray(attributeValue), () => _.some(isOtherBucketGsUri, attributeValue)],
    [type === 'string' && isList, () => _.some(isOtherBucketGsUri, attributeValue.items)],
    [type === 'string', () => isOtherBucketGsUri(attributeValue)],
    () => false
  )

  return h(Fragment, [
    hasOtherBucketUrls && h(TooltipTrigger, { content: 'Some files are located outside of the current workspace' }, [
      h(Interactive, { as: 'span', tabIndex: 0, style: { marginRight: '1ch' } }, [
        icon('warning-info', { size: 20, style: { color: colors.accent(), cursor: 'help' } })
      ])
    ]),
    h(TextCell, { title: tooltip }, [
      Utils.cond(
        [type === 'json' && _.isArray(attributeValue) && !_.some(_.isObject, attributeValue), () => renderArray(attributeValue)],
        [type === 'json', () => JSON.stringify(attributeValue, undefined, 1)],
        [type === 'reference' && isList, () => renderArray(_.map('entityName', attributeValue.items))],
        [type === 'reference', () => attributeValue.entityName],
        [isList, () => renderArray(attributeValue.items)],
        () => renderCell(attributeValue)
      )
    ])
  ])
}

export const EditDataLink = props => h(Link, {
  className: 'cell-hover-only',
  style: { marginLeft: '1ch' },
  tooltip: 'Edit value',
  ...props
}, [icon('edit')])

export const ReferenceDataImporter = ({ onSuccess, onDismiss, namespace, name }) => {
  const [loading, setLoading] = useState(false)
  const [selectedReference, setSelectedReference] = useState(undefined)

  return h(Modal, {
    'aria-label': 'Add Reference Data',
    onDismiss,
    title: 'Add Reference Data',
    okButton: h(ButtonPrimary, {
      disabled: !selectedReference || loading,
      onClick: async () => {
        setLoading(true)
        try {
          await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes(
            _.mapKeys(k => `referenceData_${selectedReference}_${k}`, ReferenceData[selectedReference])
          )
          onSuccess()
        } catch (error) {
          await reportError('Error importing reference data', error)
          onDismiss()
        }
      }
    }, 'OK')
  }, [
    h(Select, {
      'aria-label': 'Select data',
      autoFocus: true,
      isSearchable: false,
      placeholder: 'Select data',
      value: selectedReference,
      onChange: ({ value }) => setSelectedReference(value),
      options: _.keys(ReferenceData)
    }),
    loading && spinnerOverlay
  ])
}

export const ReferenceDataDeleter = ({ onSuccess, onDismiss, namespace, name, referenceDataType }) => {
  const [deleting, setDeleting] = useState(false)

  return h(DeleteConfirmationModal, {
    objectType: 'reference',
    objectName: referenceDataType,
    onConfirm: async () => {
      setDeleting(true)
      try {
        await Ajax().Workspaces.workspace(namespace, name).deleteAttributes(
          _.map(key => `referenceData_${referenceDataType}_${key}`, _.keys(ReferenceData[referenceDataType]))
        )
        onSuccess()
      } catch (error) {
        reportError('Error deleting reference data', error)
        onDismiss()
      }
    },
    onDismiss
  }, [
    div(['Are you sure you want to delete the ', b([referenceDataType]), ' reference data?']),
    deleting && absoluteSpinnerOverlay
  ])
}

export const EntityDeleter = ({ onDismiss, onSuccess, namespace, name, selectedEntities, selectedDataType, runningSubmissionsCount }) => {
  const [additionalDeletions, setAdditionalDeletions] = useState([])
  const [deleting, setDeleting] = useState(false)

  const selectedKeys = _.keys(selectedEntities)

  const doDelete = async () => {
    const entitiesToDelete = _.flow(
      _.map(({ name: entityName, entityType }) => ({ entityName, entityType })),
      entities => _.concat(entities, additionalDeletions)
    )(selectedEntities)

    setDeleting(true)

    try {
      await Ajax().Workspaces.workspace(namespace, name).deleteEntities(entitiesToDelete)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          setAdditionalDeletions(_.filter(entity => entity.entityType !== selectedDataType, await error.json()))
          setDeleting(false)
          break
        default:
          reportError('Error deleting data entries', error)
          onDismiss()
      }
    }
  }

  const moreToDelete = !!additionalDeletions.length

  const total = selectedKeys.length + additionalDeletions.length
  return h(DeleteConfirmationModal, {
    objectType: 'data',
    title: `Delete ${total} ${total > 1 ? 'entries' : 'entry'}`,
    onConfirm: doDelete,
    onDismiss
  }, [
    runningSubmissionsCount > 0 && b({ style: { display: 'block', margin: '1rem 0' } }, [
      `WARNING: ${runningSubmissionsCount} workflows are currently running in this workspace. ` +
      'Deleting the following data could cause failures if a workflow is using this data.'
    ]),
    moreToDelete && b({ style: { display: 'block', margin: '1rem 0' } }, [
      'In order to delete the selected data entries, the following entries that reference them must also be deleted.'
    ]),
    // Size the scroll container to cut off the last row to hint that there's more content to be scrolled into view
    // Row height calculation is font size * line height + padding + border
    div({ style: { maxHeight: 'calc((1em * 1.15 + 1.2rem + 1px) * 10.5)', overflowY: 'auto', margin: '0 -1.25rem' } },
      _.map(([i, entity]) => div({
        style: {
          borderTop: (i === 0 && runningSubmissionsCount === 0) ? undefined : `1px solid ${colors.light()}`,
          padding: '0.6rem 1.25rem'
        }
      }, moreToDelete ? `${entity.entityName} (${entity.entityType})` : entity),
      Utils.toIndexPairs(moreToDelete ? additionalDeletions : selectedKeys))
    ),
    deleting && absoluteSpinnerOverlay
  ])
}

const supportsFireCloudDataModel = entityType => _.includes(entityType, ['pair', 'participant', 'sample'])

export const notifyDataImportProgress = jobId => {
  notify('info', 'Data import in progress.', {
    id: jobId,
    message: 'Data will show up incrementally as the job progresses.'
  })
}

export const EntityUploader = ({ onSuccess, onDismiss, namespace, name, entityTypes, workspaceId, dataProvider, isGoogleWorkspace }) => {
  const [useFireCloudDataModel, setUseFireCloudDataModel] = useState(false)
  const [isFileImportCurrMode, setIsFileImportCurrMode] = useState(true)
  const [isFileImportLastUsedMode, setIsFileImportLastUsedMode] = useState(undefined)
  const [file, setFile] = useState(undefined)
  const [fileContents, setFileContents] = useState('')
  const [showInvalidEntryMethodWarning, setShowInvalidEntryMethodWarning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteEmptyValues, setDeleteEmptyValues] = useState(false)
  const [recordType, setRecordType] = useState(undefined)
  const [recordTypeInputTouched, setRecordTypeInputTouched] = useState(false)

  // TODO: https://broadworkbench.atlassian.net/browse/WOR-614
  // This value is mostly hard-coded for now for Azure public preview. Once WOR-614 is complete, this value can be dynamically updated
  const regionLabelToDisplay = isGoogleWorkspace ? 'US' : getRegionLabel(defaultAzureRegion)

  const doUpload = async () => {
    setUploading(true)
    try {
      await dataProvider.uploadTsv({ workspaceId, recordType, file, useFireCloudDataModel, deleteEmptyValues, namespace, name })
      onSuccess()
      Ajax().Metrics.captureEvent(Events.workspaceDataUpload, {
        workspaceNamespace: namespace, workspaceName: name, providerName: dataProvider.providerName,
        cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label
      })
    } catch (error) {
      await reportError('Error uploading entities', error)
      onDismiss()
    }
  }

  const recordTypeNameErrors = validate.single(recordType, {
    presence: {
      allowEmpty: false,
      message: 'Table name is required'
    },
    format: {
      pattern: '^(?!sys_)[a-z0-9_.-]*',
      flags: 'i',
      message: 'Table name may only contain alphanumeric characters, underscores, dashes, and periods and cannot start with \'sys_\'.'
    }
  })

  const match = /(?:membership|entity):([^\s]+)_id/.exec(fileContents) // Specific to Google Workspaces -- Azure workspaces do not have this requirement for TSV headers
  const isInvalid = dataProvider.tsvFeatures.isInvalid({ fileImportModeMatches: isFileImportCurrMode === isFileImportLastUsedMode, match: !match, filePresent: file })
  const newEntityType = match?.[1]
  const entityTypeAlreadyExists = _.includes(_.toLower(newEntityType), entityTypes)
  const currentFile = isFileImportCurrMode === isFileImportLastUsedMode ? file : undefined
  const containsNullValues = fileContents.match(/^\t|\t\t+|\t$|\n\n+/gm)

  return h(Dropzone, {
    multiple: false,
    style: { flexGrow: 1 },
    activeStyle: { cursor: 'copy' },
    onDropAccepted: async ([file]) => {
      setFile(file)
      setFileContents(await Utils.readFileAsText(file.slice(0, 1000)))
      setIsFileImportLastUsedMode(true)
    }
  }, [
    ({ dragging, openUploader }) => h(Fragment, [
      h(Modal, {
        onDismiss,
        title: 'Import Table Data',
        width: '35rem',
        okButton: h(ButtonPrimary, {
          disabled: dataProvider.tsvFeatures.disabled({ filePresent: currentFile, isInvalid, uploading, recordTypePresent: recordType }),
          tooltip: dataProvider.tsvFeatures.tooltip({ filePresent: currentFile, isInvalid, recordTypePresent: recordType, uploading }),
          onClick: doUpload
        }, [Utils.cond([uploading, () => icon('loadingSpinner')], () => 'Start Import Job')])
      }, [
        div(
          ['Choose the data import option below. ',
            dataProvider.tsvFeatures.dataTableSupportLink && h(Link, {
              ...Utils.newTabLinkProps,
              href: 'https://support.terra.bio/hc/en-us/articles/360025758392'
            }, ['Click here for more info on the table.']),
            p(['Data will be saved in location: 🇺🇸  ', span({ style: { fontWeight: 'bold' } }, regionLabelToDisplay), ' (Terra-managed).'])]),
        dataProvider.tsvFeatures.needsTypeInput && div({ style: { paddingTop: '0.1rem', paddingBottom: '2rem' } }, [
          h(FormLabel, { htmlFor: 'add-table-name' }, ['Table name']),
          h(ValidatedInput, {
            inputProps: {
              id: 'add-table-name',
              autoFocus: true,
              placeholder: 'Enter a table name',
              value: recordType,
              onChange: value => {
                setRecordType(value)
                setRecordTypeInputTouched(true)
              }
            },
            error: recordTypeInputTouched && Utils.summarizeErrors(recordTypeNameErrors)
          })
        ]),
        h(SimpleTabBar, {
          'aria-label': 'import type',
          tabs: [{ title: 'File Import', key: 'file', width: 127 }, { title: 'Text Import', key: 'text', width: 127 }],
          value: isFileImportCurrMode ? 'file' : 'text',
          onChange: value => {
            setIsFileImportCurrMode(value === 'file')
            setShowInvalidEntryMethodWarning(false)
          }
        }),
        div({
          style: {
            padding: '1rem 0 0',
            height: '3.25rem'
          }
        }, [
          isFileImportCurrMode ? div([
            'Select the ',
            h(TooltipTrigger, { content: 'Tab Separated Values', side: 'bottom' },
              [span({ style: { textDecoration: 'underline dashed' } }, 'TSV')]),
            ' file containing your data: '
          ]) : div(['Copy and paste tab separated data here:']),
          currentFile && div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
            h(Link,
              {
                onClick: () => {
                  setFile(undefined)
                  setFileContents('')
                  setUseFireCloudDataModel(false)
                }
              }, ['Clear'])
          ])
        ]),
        isFileImportCurrMode ? div([
          h(Clickable, {
            style: {
              ...Style.elements.card.container, flex: 1, backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1),
              border: isInvalid ? `1px solid ${colors.danger()}` : `1px dashed ${colors.dark(0.7)}`, boxShadow: 'none'
            },
            onClick: openUploader
          }, [div(['Drag or ', h(Link, ['Click']), ' to select a .tsv file'])]),
          div({ style: { paddingTop: '0.5rem' } }, [
            'Selected File: ',
            span({ style: { color: colors.dark(1), fontWeight: 550 } }, [currentFile?.name || 'None'])
          ])
        ]) : div([
          h(PasteOnlyInput, {
            'aria-label': 'Paste text data here',
            readOnly: !!fileContents,
            placeholder: dataProvider.tsvFeatures.textImportPlaceholder,
            onPaste: pastedText => {
              setFile(new File([pastedText], 'upload.tsv'))
              setFileContents(pastedText)
              setIsFileImportLastUsedMode(false)
              setShowInvalidEntryMethodWarning(false)
            },
            onChange: () => setShowInvalidEntryMethodWarning(true),
            value: !isFileImportLastUsedMode ? fileContents : '',
            wrap: 'off',
            style: {
              fontFamily: 'monospace', height: 100,
              backgroundColor: isInvalid ? colors.danger(0.1) : colors.light(0.1),
              border: isInvalid ? `1px solid ${colors.danger()}` : undefined,
              boxShadow: 'none'
            }
          })
        ]),
        ((currentFile && entityTypeAlreadyExists) || _.includes(recordType, entityTypes)) && div({
          style: { ...warningBoxStyle, margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center' }
        }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          `Data with the type '${recordType ? recordType : newEntityType}' already exists in this workspace. `,
          'Uploading more data for the same type may overwrite some entries.'
        ]),
        currentFile && containsNullValues && entityTypeAlreadyExists && div({
          style: { ...warningBoxStyle, margin: '1rem 0 0.5rem' }
        }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          'We have detected empty cells in your TSV. Please choose an option:',
          div({ role: 'radiogroup', 'aria-label': 'we have detected empty cells in your tsv. please choose an option.' }, [
            div({ style: { paddingTop: '0.5rem' } }, [
              h(RadioButton, {
                text: 'Ignore empty cells (default)',
                name: 'ignore-empty-cells',
                checked: !deleteEmptyValues,
                onChange: () => setDeleteEmptyValues(false),
                labelStyle: { padding: '0.5rem', fontWeight: 'normal' }
              })
            ]),
            div({ style: { paddingTop: '0.5rem' } }, [
              h(RadioButton, {
                text: 'Overwrite existing cells with empty cells',
                name: 'ignore-empty-cells',
                checked: deleteEmptyValues,
                onChange: () => setDeleteEmptyValues(true),
                labelStyle: { padding: '0.5rem', fontWeight: 'normal' }
              })
            ])
          ])
        ]),
        currentFile && supportsFireCloudDataModel(newEntityType) && isGoogleWorkspace && div([
          h(LabeledCheckbox, {
            checked: useFireCloudDataModel,
            onChange: setUseFireCloudDataModel,
            style: { margin: '0.5rem' }
          }, [' Create participant, sample, and pair associations']),
          h(Link, {
            style: { marginLeft: '1rem', verticalAlign: 'middle' },
            href: 'https://support.terra.bio/hc/en-us/articles/360033913771-Understanding-entity-types-and-the-standard-genomic-data-model#h_01EN5PCAEDPX020T2EFGN8TJD6',
            ...Utils.newTabLinkProps
          }, ['Learn more ', icon('pop-out', { size: 12 })])
        ]),
        div({ style: errorTextStyle }, [
          Utils.cond(
            [isInvalid, () => dataProvider.tsvFeatures.invalidFormatWarning],
            [showInvalidEntryMethodWarning, () => 'Invalid Data Entry Method: Copy and paste only']
          )
        ]),
        div({ style: { borderTop: Style.standardLine, marginTop: '1rem' } }, [
          div({ style: { marginTop: '1rem', fontWeight: 600 } }, ['TSV file templates']),
          div({ style: { marginTop: '1rem' } }, [
            icon('downloadRegular', { style: { size: 14, marginRight: '0.5rem' } }),
            'Download ',
            h(Link, {
              href: dataProvider.tsvFeatures.sampleTSVLink,
              ...Utils.newTabLinkProps,
              onClick: () => Ajax().Metrics.captureEvent(Events.workspaceSampleTsvDownload, {
                workspaceNamespace: namespace, workspaceName: name, providerName: dataProvider.providerName,
                cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label
              })
            }, ['sample_template.tsv '])
          ]),
          dataProvider.tsvFeatures.dataImportSupportLink && div({ style: { marginTop: '1rem' } }, [
            icon('pop-out', { style: { size: 14, marginRight: '0.5rem' } }),
            'Terra Support: ',
            h(Link, {
              href: 'https://support.terra.bio/hc/en-us/articles/360059242671',
              ...Utils.newTabLinkProps
            }, [' Importing Data - Using a Template'])
          ])
        ])
      ]),
      uploading && spinnerOverlay
    ])
  ])
}

export const EntityRenamer = ({ entityType, entityName, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const [newName, setNewName] = useState(entityName)
  const [isBusy, setIsBusy] = useState()
  const [takenName, setTakenName] = useState()

  const errors = validate.single(newName, {
    presence: { allowEmpty: false, message: 'Name can\'t be blank' },
    exclusion: { within: [takenName], message: 'An entity with this name already exists' }
  })

  const doRename = async () => {
    try {
      setIsBusy(true)
      await Ajax().Workspaces.workspace(namespace, name).renameEntity(entityType, entityName, _.trim(newName))
      onSuccess()
    } catch (e) {
      if (e.status === 409) {
        setTakenName(newName)
        setIsBusy(false)
      } else {
        onDismiss()
        reportError('Unable to rename entity', e)
      }
    }
  }

  return h(Modal, {
    onDismiss,
    title: `Rename ${entityName}`,
    okButton: h(ButtonPrimary, {
      onClick: doRename,
      disabled: entityName === newName || errors,
      tooltip: entityName === newName ? 'No change to save' : Utils.summarizeErrors(errors)
    }, ['Rename'])
  }, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id }, ['New entity name']),
      h(ValidatedInput, {
        inputProps: {
          id,
          autoFocus: true,
          placeholder: 'Enter a name',
          value: newName,
          onChange: setNewName
        },
        error: Utils.summarizeErrors(errors)
      })
    ])]),
    isBusy && spinnerOverlay
  ])
}

export const prepareAttributeForUpload = attributeValue => {
  const { type, isList } = getAttributeType(attributeValue)

  const transform = Utils.switchCase(type,
    ['string', () => _.trim],
    ['reference', () => _.update('entityName', _.trim)],
    [Utils.DEFAULT, () => _.identity]
  )

  return isList ?
    _.update('items', _.map(transform), attributeValue) :
    transform(attributeValue)
}

export const SingleEntityEditor = ({ entityType, entityName, attributeName, attributeValue, entityTypes, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const { type: originalValueType } = getAttributeType(attributeValue)
  const [newValue, setNewValue] = useState(attributeValue)
  const isUnchanged = _.isEqual(attributeValue, newValue)

  const [isBusy, setIsBusy] = useState()
  const [consideringDelete, setConsideringDelete] = useState()

  const doEdit = async () => {
    try {
      setIsBusy(true)

      await Ajax()
        .Workspaces
        .workspace(namespace, name)
        .upsertEntities([{
          entityType,
          name: entityName,
          operations: [{
            op: 'AddUpdateAttribute',
            attributeName,
            addUpdateAttribute: prepareAttributeForUpload(newValue)
          }]
        }])
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to modify entity', e)
    }
  }

  const doDelete = async () => {
    try {
      setIsBusy(true)
      await Ajax().Workspaces.workspace(namespace, name).deleteEntityAttribute(entityType, entityName, attributeName)
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to modify entity', e)
    }
  }

  const boldish = text => span({ style: { fontWeight: 600 } }, [text])

  return h(Modal, {
    title: 'Edit value',
    onDismiss,
    showButtons: false
  }, [
    consideringDelete ?
      h(Fragment, [
        'Are you sure you want to delete the value ', boldish(attributeName),
        ' from the ', boldish(entityType), ' called ', boldish(entityName), '?',
        div({ style: { marginTop: '1rem' } }, [boldish('This cannot be undone.')]),
        div({ style: { marginTop: '1rem', display: 'flex', alignItems: 'baseline' } }, [
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: () => setConsideringDelete(false) }, ['Back to editing']),
          h(ButtonPrimary, { onClick: doDelete }, ['Delete'])
        ])
      ]) :
      h(Fragment, [
        h(AttributeInput, {
          autoFocus: true,
          value: newValue,
          onChange: setNewValue,
          initialValue: attributeValue,
          entityTypes,
          showJsonTypeOption: originalValueType === 'json'
        }),
        div({ style: { marginTop: '2rem', display: 'flex', alignItems: 'baseline' } }, [
          h(ButtonOutline, { onClick: () => setConsideringDelete(true) }, ['Delete']),
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: onDismiss }, ['Cancel']),
          h(ButtonPrimary, {
            onClick: doEdit,
            disabled: isUnchanged || newValue === undefined || newValue === '',
            tooltip: isUnchanged && 'No changes to save'
          }, ['Save Changes'])
        ])
      ]),
    isBusy && spinnerOverlay
  ])
}

export const MultipleEntityEditor = ({ entityType, entities, attributeNames, entityTypes, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const [attributeToEdit, setAttributeToEdit] = useState('')
  const [attributeToEditTouched, setAttributeToEditTouched] = useState(false)
  const attributeToEditError = attributeToEditTouched && Utils.cond(
    [!attributeToEdit, () => 'An attribute name is required.'],
    [!_.includes(attributeToEdit, attributeNames), () => 'The selected attribute does not exist.']
  )

  const operations = {
    setValue: 'setValue',
    convertType: 'convertType'
  }
  const [operation, setOperation] = useState(operations.setValue)

  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState({ type: 'string' })

  const [isBusy, setIsBusy] = useState()
  const [consideringDelete, setConsideringDelete] = useState()

  const withBusyStateAndErrorHandling = operation => async () => {
    try {
      setIsBusy(true)
      await operation()
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to modify entities.', e)
    }
  }

  const saveAttributeEdits = withBusyStateAndErrorHandling(() => {
    const entityUpdates = _.map(entity => ({
      entityType,
      name: entity.name,
      operations: [{
        op: 'AddUpdateAttribute',
        attributeName: attributeToEdit,
        addUpdateAttribute: Utils.switchCase(operation,
          [operations.setValue, () => prepareAttributeForUpload(newValue)],
          [operations.convertType, () => convertAttributeValue(entity.attributes[attributeToEdit], newType.type, newType.entityType)]
        )
      }]
    }), entities)

    return Ajax()
      .Workspaces
      .workspace(namespace, name)
      .upsertEntities(entityUpdates)
  })
  const deleteAttributes = withBusyStateAndErrorHandling(() => Ajax().Workspaces.workspace(namespace, name).deleteAttributeFromEntities(entityType, attributeToEdit, _.map('name', entities)))

  const boldish = text => span({ style: { fontWeight: 600 } }, [text])

  return h(Modal, {
    title: `Edit fields in ${pluralize('row', entities.length, true)}`,
    onDismiss,
    showButtons: false
  }, [
    consideringDelete ?
      h(Fragment, [
        'Are you sure you want to delete the value ', boldish(attributeToEdit),
        ' from ', boldish(`${entities.length} ${entityType}s`), '?',
        div({ style: { marginTop: '1rem' } }, [boldish('This cannot be undone.')]),
        div({ style: { marginTop: '1rem', display: 'flex', alignItems: 'baseline' } }, [
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: () => setConsideringDelete(false) }, ['Back to editing']),
          h(ButtonPrimary, { onClick: deleteAttributes }, ['Delete'])
        ])
      ]) :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ id, style: { marginBottom: '0.5rem', fontWeight: 'bold' } }, 'Select a column to edit'),
              div({ style: { position: 'relative', display: 'flex', alignItems: 'center' } }, [
                h(AutocompleteTextInput, {
                  labelId: id,
                  value: attributeToEdit,
                  suggestions: attributeNames,
                  placeholder: 'Column name',
                  style: attributeToEditError ? {
                    paddingRight: '2.25rem',
                    border: `1px solid ${colors.danger()}`
                  } : undefined,
                  onChange: value => {
                    setAttributeToEdit(value)
                    setAttributeToEditTouched(true)
                  }
                }),
                attributeToEditError && icon('error-standard', {
                  size: 24,
                  style: {
                    position: 'absolute', right: '0.5rem',
                    color: colors.danger()
                  }
                })
              ]),
              attributeToEditError && div({
                'aria-live': 'assertive',
                'aria-relevant': 'all',
                style: {
                  marginTop: '0.5rem',
                  color: colors.danger()
                }
              }, attributeToEditError)
            ])
          ])
        ]),
        attributeToEditTouched ? h(Fragment, [
          div({ style: { marginBottom: '1rem' } }, [
            fieldset({ style: { border: 'none', margin: 0, padding: 0 } }, [
              legend({ style: { marginBottom: '0.5rem', fontWeight: 'bold' } }, ['Operation']),
              div({ style: { display: 'flex', flexDirection: 'row', marginBottom: '0.5rem' } }, [
                _.map(({ operation: operationOption, label }) => span({
                  key: operationOption,
                  style: { display: 'inline-block', marginRight: '1ch', whiteSpace: 'nowrap' }
                }, [
                  h(RadioButton, {
                    text: label,
                    name: 'operation',
                    checked: operation === operationOption,
                    onChange: () => {
                      setOperation(operationOption)
                    },
                    labelStyle: { paddingLeft: '0.5rem' }
                  })
                ]), [
                  { operation: operations.setValue, label: 'Set value' },
                  { operation: operations.convertType, label: 'Convert type' }
                ])
              ])
            ])
          ]),
          Utils.cond(
            [operation === operations.setValue, () => h(Fragment, [
              p({ style: { fontWeight: 'bold' } }, ['Set selected values to:']),
              h(AttributeInput, {
                value: newValue,
                onChange: setNewValue,
                entityTypes
              })
            ])],
            [operation === operations.convertType, () => h(Fragment, [
              p({ style: { fontWeight: 'bold' } }, ['Convert selected values to:']),
              h(AttributeTypeInput, {
                value: newType,
                onChange: setNewType,
                entityTypes
              })
            ])]
          ),
          div({ style: { marginTop: '2rem', display: 'flex', alignItems: 'baseline' } }, [
            h(ButtonOutline, {
              disabled: !!attributeToEditError,
              tooltip: attributeToEditError,
              onClick: () => setConsideringDelete(true)
            }, ['Delete']),
            div({ style: { flexGrow: 1 } }),
            h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: onDismiss }, ['Cancel']),
            h(ButtonPrimary, {
              disabled: attributeToEditError,
              tooltip: attributeToEditError,
              onClick: saveAttributeEdits
            }, ['Save edits'])
          ])
        ]) : div({ style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline' } }, [
          h(ButtonSecondary, { onClick: onDismiss }, ['Cancel'])
        ])
      ]),
    isBusy && spinnerOverlay
  ])
}

export const CreateEntitySetModal = ({ entityType, entityNames, workspaceId: { namespace, name: workspaceName }, onDismiss, onSuccess }) => {
  const [name, setName] = useState('')
  const [nameInputTouched, setNameInputTouched] = useState(false)
  const nameError = nameInputTouched && Utils.cond(
    [!name, () => 'A name for the set is required.'],
    [!/^[A-Za-z0-9_-]+$/.test(name), () => 'Set name may only contain alphanumeric characters, underscores, dashes, and periods.']
  )

  const [isBusy, setIsBusy] = useState()

  const createSet = async () => {
    setIsBusy(true)
    try {
      await Ajax()
        .Workspaces
        .workspace(namespace, workspaceName)
        .createEntity({
          name,
          entityType: `${entityType}_set`,
          attributes: {
            [`${entityType}s`]: {
              itemsType: 'EntityReference',
              items: _.map(entityName => ({ entityType, entityName }), entityNames)
            }
          }
        })
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to create set.', e)
    }
  }

  return h(Modal, {
    title: `Create a ${entityType} set`,
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: !name || nameError,
      tooltip: nameError,
      onClick: createSet
    }, ['Save'])
  }, [
    div({ style: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' } }, [
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: { fontWeight: 'bold', marginBottom: '0.5rem' } }, 'Set name (required)'),
          div({ style: { position: 'relative', display: 'flex', alignItems: 'center' } }, [
            h(TextInput, {
              id,
              value: name,
              placeholder: 'Enter a name for the set',
              style: nameError ? {
                paddingRight: '2.25rem',
                border: `1px solid ${colors.danger()}`
              } : undefined,
              onChange: value => {
                setName(value)
                setNameInputTouched(true)
              }
            }),
            nameError && icon('error-standard', {
              size: 24,
              style: {
                position: 'absolute', right: '0.5rem',
                color: colors.danger()
              }
            })
          ]),
          nameError && div({
            'aria-live': 'assertive',
            'aria-relevant': 'all',
            style: {
              marginTop: '0.5rem',
              color: colors.danger()
            }
          }, nameError)
        ])
      ])
    ]),
    isBusy && spinnerOverlay
  ])
}

export const AddColumnModal = ({ entityType, entityMetadata, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const [columnName, setColumnName] = useState('')
  const [columnNameTouched, setColumnNameTouched] = useState(false)
  const columnNameError = columnNameTouched && Utils.cond(
    [!columnName, () => 'A column name is required.'],
    [_.includes(columnName, entityMetadata[entityType].attributeNames), () => 'This column already exists.']
  )

  const [value, setValue] = useState('')

  const [isBusy, setIsBusy] = useState()

  const addColumn = async () => {
    try {
      setIsBusy(true)

      const queryResults = await Ajax().Workspaces.workspace(namespace, name).paginatedEntitiesOfType(entityType, {
        pageSize: entityMetadata[entityType].count,
        fields: ''
      })
      const allEntityNames = _.map(_.get('name'), queryResults.results)

      const entityUpdates = _.map(entityName => ({
        entityType,
        name: entityName,
        operations: [{
          op: 'AddUpdateAttribute',
          attributeName: columnName,
          addUpdateAttribute: prepareAttributeForUpload(value)
        }]
      }), allEntityNames)

      await Ajax()
        .Workspaces
        .workspace(namespace, name)
        .upsertEntities(entityUpdates)
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to add column.', e)
    }
  }

  return h(Modal, {
    title: 'Add a new column',
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: !columnName || columnNameError,
      tooltip: columnNameError,
      onClick: addColumn
    }, ['Save'])
  }, [
    div({ style: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' } }, [
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: { fontWeight: 'bold', marginBottom: '0.5rem' } }, 'Column name'),
          div({ style: { position: 'relative', display: 'flex', alignItems: 'center' } }, [
            h(TextInput, {
              id,
              value: columnName,
              placeholder: 'Enter a name (required)',
              style: columnNameError ? {
                paddingRight: '2.25rem',
                border: `1px solid ${colors.danger()}`
              } : undefined,
              onChange: value => {
                setColumnName(value)
                setColumnNameTouched(true)
              }
            }),
            columnNameError && icon('error-standard', {
              size: 24,
              style: {
                position: 'absolute', right: '0.5rem',
                color: colors.danger()
              }
            })
          ]),
          columnNameError && div({
            'aria-live': 'assertive',
            'aria-relevant': 'all',
            style: {
              marginTop: '0.5rem',
              color: colors.danger()
            }
          }, columnNameError)
        ])
      ])
    ]),
    p([
      span({ style: { fontWeight: 'bold' } }, ['Default value']),
      ' (optional, will be entered for all rows)'
    ]),
    h(AttributeInput, {
      value,
      onChange: setValue,
      entityTypes: _.keys(entityMetadata)
    }),
    isBusy && spinnerOverlay
  ])
}

export const AddEntityModal = ({ workspaceId: { namespace, name }, entityType, attributeNames, entityTypes, onDismiss, onSuccess }) => {
  const [entityName, setEntityName] = useState('')
  const [entityNameInputTouched, setEntityNameInputTouched] = useState(false)
  const [takenNames, setTakenNames] = useState([])
  // Default all attribute values to empty strings
  const [attributeValues, setAttributeValues] = useState(_.fromPairs(_.map(attributeName => [attributeName, ''], attributeNames)))
  const [isBusy, setIsBusy] = useState(false)

  // The data table colum heading shows this as `${entityType}_id`, but `${entityType} ID` works better in a screen reader
  const entityNameLabel = `${entityType} ID`

  const entityNameErrors = validate.single(entityName, {
    presence: {
      allowEmpty: false,
      message: `${entityNameLabel} is required`
    },
    format: {
      pattern: '[a-z0-9_.-]*',
      flags: 'i',
      message: `${entityNameLabel} may only contain alphanumeric characters, underscores, dashes, and periods.`
    },
    exclusion: {
      within: takenNames,
      message: `A ${entityType} with this name already exists`
    }
  })

  const createEntity = async () => {
    setIsBusy(true)
    try {
      await Ajax().Workspaces.workspace(namespace, name).createEntity({
        entityType,
        name: _.trim(entityName),
        attributes: _.mapValues(prepareAttributeForUpload, attributeValues)
      })
      setIsBusy(false)
      onDismiss()
      onSuccess()
    } catch (err) {
      setIsBusy(false)
      if (err.status === 409) {
        setTakenNames(prevTakenNames => _.uniq(Utils.append(entityName, prevTakenNames)))
      } else {
        onDismiss()
        reportError('Unable to add row.', err)
      }
    }
  }

  return h(Modal, {
    onDismiss,
    title: 'Add a new row',
    okButton: h(ButtonPrimary, {
      disabled: !!entityNameErrors,
      tooltip: Utils.summarizeErrors(entityNameErrors),
      onClick: createEntity
    }, ['Add'])
  }, [
    label({ htmlFor: 'add-row-entity-name', style: { display: 'block', marginBottom: '0.5rem' } }, entityNameLabel),
    h(ValidatedInput, {
      inputProps: {
        id: 'add-row-entity-name',
        placeholder: 'Enter a value (required)',
        value: entityName,
        onChange: value => {
          setEntityName(value)
          setEntityNameInputTouched(true)
        }
      },
      error: entityNameInputTouched && Utils.summarizeErrors(entityNameErrors)
    }),
    p({ id: 'add-row-attributes-label' }, 'Expand each value to edit.'),
    ul({ 'aria-labelledby': 'add-row-attributes-label', style: { padding: 0, margin: 0 } }, [
      _.map(([i, attributeName]) => li({
        key: attributeName,
        style: {
          borderTop: i === 0 ? undefined : `1px solid ${colors.light()}`,
          listStyleType: 'none'
        }
      }, [
        h(Collapse, {
          title: `${attributeName}: ${entityAttributeText(attributeValues[attributeName], false)}`,
          noTitleWrap: true,
          summaryStyle: { margin: '0.5rem 0' }
        }, [
          div({ style: { margin: '0.5rem 0' } }, [
            h(AttributeInput, {
              value: attributeValues[attributeName],
              onChange: value => setAttributeValues(_.set(attributeName, value)),
              entityTypes
            })
          ])
        ])
      ]), Utils.toIndexPairs(attributeNames))
    ]),
    isBusy && spinnerOverlay
  ])
}

export const ModalToolButton = ({ icon, text, disabled, ...props }) => {
  return h(Clickable, _.merge({
    disabled,
    style: {
      color: disabled ? colors.secondary() : colors.accent(),
      opacity: disabled ? 0.5 : undefined,
      border: '1px solid transparent',
      padding: '0 0.875rem', marginBottom: '0.5rem',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      height: '3rem',
      fontSize: 18,
      userSelect: 'none'
    },
    hover: {
      border: `1px solid ${colors.accent(0.8)}`,
      boxShadow: Style.standardShadow
    }
  }, props), [
    !!icon && div({ style: { display: 'flex', alignItems: 'center', width: 45, marginRight: '1rem' } }, [
      img({ src: icon, style: { opacity: disabled ? 0.5 : undefined, maxWidth: 45, maxHeight: 40 } })
    ]),
    text
  ])
}

export const HeaderOptions = ({ sort, field, onSort, extraActions, children }) => {
  const columnMenu = h(MenuTrigger, {
    closeOnClick: true,
    side: 'bottom',
    content: h(Fragment, [
      h(MenuButton, { onClick: () => onSort({ field, direction: 'asc' }) }, ['Sort Ascending']),
      h(MenuButton, { onClick: () => onSort({ field, direction: 'desc' }) }, ['Sort Descending']),
      !_.isEmpty(extraActions) && h(Fragment, [
        h(MenuDivider),
        _.map(({ label, disabled, tooltip, onClick }) => h(MenuButton, { key: label, disabled, tooltip, onClick }, [label]), extraActions)
      ])
    ])
  }, [
    h(Link, { 'aria-label': 'Column menu' }, [
      icon('cardMenuIcon', { size: 16 })
    ])
  ])

  return h(Fragment, [
    h(Sortable, {
      sort, field, onSort
    }, [
      children,
      div({ style: { marginRight: '0.5rem', marginLeft: 'auto' } })
    ]),
    columnMenu
  ])
}
