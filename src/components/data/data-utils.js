import _ from 'lodash/fp'
import pluralize from 'pluralize'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, fieldset, h, img, label, legend, p, span } from 'react-hyperscript-helpers'
import {
  ButtonOutline, ButtonPrimary, ButtonSecondary, Clickable, IdContainer, LabeledCheckbox, Link, RadioButton, Select, spinnerOverlay, Switch
} from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { AutocompleteTextInput, NumberInput, PasteOnlyInput, TextInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { SimpleTabBar } from 'src/components/tabBars'
import { Sortable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { UriViewerLink } from 'src/components/UriViewer'
import ReferenceData from 'src/data/reference-data'
import { Ajax, canUseWorkspaceProject } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import { notify } from 'src/libs/notifications'
import { useCancellation } from 'src/libs/react-utils'
import { asyncImportJobStore, requesterPaysProjectStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
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

export const renderDataCell = (data, googleProject) => {
  const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum) || _.startsWith('drs://', datum)

  const renderCell = datum => {
    const stringDatum = Utils.convertValue('string', datum)

    return h(TextCell, { title: stringDatum },
      [isUri(datum) ? h(UriViewerLink, { uri: datum, googleProject }) : stringDatum])
  }

  const renderArray = items => {
    return _.map(([i, v]) => h(Fragment, { key: i }, [
      renderCell(v.toString()), i < (items.length - 1) && div({ style: { marginRight: '0.5rem', color: colors.dark(0.85) } }, ',')
    ]), Utils.toIndexPairs(items))
  }

  return Utils.cond(
    [_.isArray(data), () => renderArray(data)],
    [_.isObject(data) && !!data.itemsType && _.isArray(data.items), () => renderArray(data.items)],
    [_.isObject(data), () => JSON.stringify(data, undefined, 1)],
    () => renderCell(data?.toString())
  )
}

export const EditDataLink = props => h(Link, {
  className: 'cell-hover-only',
  style: { marginLeft: '1rem' },
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

  return h(Modal, {
    onDismiss,
    title: 'Confirm Delete',
    okButton: h(ButtonPrimary, {
      disabled: deleting,
      onClick: async () => {
        setDeleting(true)
        try {
          await Ajax().Workspaces.workspace(namespace, name).deleteAttributes(
            _.map(key => `referenceData_${referenceDataType}_${key}`, _.keys(ReferenceData[referenceDataType]))
          )
          onSuccess()
        } catch (error) {
          await reportError('Error deleting reference data', error)
          onDismiss()
        }
      }
    }, ['Delete'])
  }, [`Are you sure you want to delete ${referenceDataType}?`])
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
          await reportError('Error deleting data entries', error)
          onDismiss()
      }
    }
  }

  const moreToDelete = !!additionalDeletions.length

  const fullWidthWarning = {
    ...warningBoxStyle,
    borderLeft: 'none', borderRight: 'none',
    margin: '0 -1.25rem'
  }

  const total = selectedKeys.length + additionalDeletions.length
  return h(Modal, {
    onDismiss,
    title: 'Confirm Delete',
    okButton: h(ButtonPrimary, {
      disabled: deleting,
      onClick: doDelete
    }, ['Delete'])
  }, [
    runningSubmissionsCount > 0 && div({ style: { ...fullWidthWarning, display: 'flex', alignItems: 'center' } }, [
      icon('warning-standard', { size: 36, style: { flex: 'none', marginRight: '0.5rem' } }),
      `WARNING: ${runningSubmissionsCount} workflows are currently running in this workspace. ` +
      'Deleting the following data could cause failures if a workflow is using this data.'
    ]),
    moreToDelete && div({ style: { ...fullWidthWarning, display: 'flex', alignItems: 'center' } }, [
      icon('warning-standard', { size: 36, style: { flex: 'none', marginRight: '0.5rem' } }),
      'In order to delete the selected data entries, the following entries that reference them must also be deleted.'
    ]),
    // Size the scroll container to cut off the last row to hint that there's more content to be scrolled into view
    // Row height calculation is font size * line height + padding + border
    div({ style: { maxHeight: 'calc((1em * 1.15 + 1.2rem + 1px) * 10.5)', overflowY: 'auto', margin: '0 -1.25rem' } },
      _.map(([i, entity]) => div({
        style: {
          borderTop: (i === 0 && runningSubmissionsCount === 0) ? undefined : Style.standardLine,
          padding: '0.6rem 1.25rem'
        }
      }, moreToDelete ? `${entity.entityName} (${entity.entityType})` : entity),
      Utils.toIndexPairs(moreToDelete ? additionalDeletions : selectedKeys))
    ),
    div({
      style: { ...fullWidthWarning, textAlign: 'right' }
    }, [`${total} data ${total > 1 ? 'entries' : 'entry'} to be deleted.`]),
    deleting && spinnerOverlay
  ])
}

const supportsFireCloudDataModel = entityType => _.includes(entityType, ['pair', 'participant', 'sample'])

export const notifyDataImportProgress = jobId => {
  notify('info', 'Data import in progress.', {
    id: jobId,
    message: 'Data will show up incrementally as the job progresses.'
  })
}

export const EntityUploader = ({ onSuccess, onDismiss, namespace, name, entityTypes }) => {
  const [useFireCloudDataModel, setUseFireCloudDataModel] = useState(false)
  const [isFileImportCurrMode, setIsFileImportCurrMode] = useState(true)
  const [isFileImportLastUsedMode, setIsFileImportLastUsedMode] = useState(undefined)
  const [file, setFile] = useState(undefined)
  const [fileContents, setFileContents] = useState('')
  const [showInvalidEntryMethodWarning, setShowInvalidEntryMethodWarning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteEmptyValues, setDeleteEmptyValues] = useState(false)

  const doUpload = async () => {
    setUploading(true)
    try {
      const workspace = Ajax().Workspaces.workspace(namespace, name)
      if (useFireCloudDataModel) {
        await workspace.importEntitiesFile(file, deleteEmptyValues)
      } else {
        const filesize = file?.size || Number.MAX_SAFE_INTEGER
        if (filesize < 524288) { // 512k
          await workspace.importFlexibleEntitiesFileSynchronous(file, deleteEmptyValues)
        } else {
          const { jobId } = await workspace.importFlexibleEntitiesFileAsync(file, deleteEmptyValues)
          asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
          notifyDataImportProgress(jobId)
        }
      }
      onSuccess()
      Ajax().Metrics.captureEvent(Events.workspaceDataUpload, {
        workspaceNamespace: namespace, workspaceName: name
      })
    } catch (error) {
      await reportError('Error uploading entities', error)
      onDismiss()
    }
  }

  const match = /(?:membership|entity):([^\s]+)_id/.exec(fileContents)
  const isInvalid = isFileImportCurrMode === isFileImportLastUsedMode && file && !match
  const newEntityType = match?.[1]
  const currentFile = isFileImportCurrMode === isFileImportLastUsedMode ? file : undefined
  const containsNullValues = fileContents.match('\t\t')

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
          disabled: !currentFile || isInvalid || uploading,
          tooltip: !currentFile || isInvalid ? 'Please select valid data to upload' : 'Upload selected data',
          onClick: doUpload
        }, ['Start Import Job'])
      }, [
        div({ style: { padding: '0 0 1rem' } },
          ['Choose the data import option below. ',
            h(Link, {
              ...Utils.newTabLinkProps,
              href: 'https://support.terra.bio/hc/en-us/articles/360025758392'
            }, ['Click here for more info on the table.']),
            p(['Data will be saved in location: 🇺🇸 ', span({ style: { fontWeight: 'bold' } }, 'US '), '(Terra-managed).'])]),
        h(SimpleTabBar, {
          'aria-label': 'import type',
          tabs: [{ title: 'File Import', key: 'file', width: 121 }, { title: 'Text Import', key: 'text', width: 127 }],
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
            placeholder: 'entity:participant_id(tab)column1(tab)column2...',
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
        currentFile && _.includes(_.toLower(newEntityType), entityTypes) && div({
          style: { ...warningBoxStyle, margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center' }
        }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          `Data with the type '${newEntityType}' already exists in this workspace. `,
          'Uploading more data for the same type may overwrite some entries.'
        ]),
        currentFile && containsNullValues && _.includes(_.toLower(newEntityType), entityTypes) && div({
          style: { ...warningBoxStyle, margin: '1rem 0 0.5rem' }
        }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          'We have detected empty cells in your TSV. Please choose an option:',
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
              name: 'overwrite-existing-cells',
              checked: deleteEmptyValues,
              onChange: () => setDeleteEmptyValues(true),
              labelStyle: { padding: '0.5rem', fontWeight: 'normal' }
            })
          ])
        ]),
        currentFile && supportsFireCloudDataModel(newEntityType) && div([
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
            [isInvalid, () => 'Invalid format: Data does not start with entity or membership definition.'],
            [showInvalidEntryMethodWarning, () => 'Invalid Data Entry Method: Copy and paste only']
          )
        ]),
        div({ style: { borderTop: Style.standardLine, marginTop: '1rem' } }, [
          div({ style: { marginTop: '1rem', fontWeight: 600 } }, ['TSV file templates']),
          div({ style: { marginTop: '1rem' } }, [
            icon('downloadRegular', { style: { size: 14, marginRight: '0.5rem' } }),
            'Download ',
            h(Link, {
              href: 'https://storage.googleapis.com/terra-featured-workspaces/Table_templates/2-template_sample-table.tsv',
              ...Utils.newTabLinkProps,
              onClick: () => Ajax().Metrics.captureEvent(Events.workspaceSampleTsvDownload, {
                workspaceNamespace: namespace, workspaceName: name
              })
            }, ['sample_template.tsv '])
          ]),
          div({ style: { marginTop: '1rem' } }, [
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

export const getAttributeType = attributeValue => {
  const isList = Boolean(_.isObject(attributeValue) && attributeValue.items)

  const isReference = _.isObject(attributeValue) && (attributeValue.entityType || attributeValue.itemsType === 'EntityReference')
  const type = Utils.cond(
    [isReference, () => 'reference'],
    // explicit double-equal to check for null and undefined, since entity attribute lists can contain nulls
    // eslint-disable-next-line eqeqeq
    [(isList ? attributeValue.items[0] : attributeValue) == undefined, () => 'string'],
    [isList, () => typeof attributeValue.items[0]],
    () => typeof attributeValue
  )

  return { type, isList }
}

export const convertAttributeValue = (attributeValue, newType, referenceEntityType) => {
  if (newType === 'reference' && !referenceEntityType) {
    throw new Error('An entity type is required to convert an attribute to a reference')
  }

  const { type, isList } = getAttributeType(attributeValue)

  const baseConvertFn = Utils.switchCase(
    newType,
    ['reference', () => value => ({
      entityType: referenceEntityType,
      entityName: _.toString(value) // eslint-disable-line lodash-fp/preferred-alias
    })],
    ['number', () => value => {
      const numberVal = _.toNumber(value)
      return _.isNaN(numberVal) ? 0 : numberVal
    }],
    [Utils.DEFAULT, () => Utils.convertValue(newType)]
  )
  const convertFn = type === 'reference' ? _.flow(_.get('entityName'), baseConvertFn) : baseConvertFn

  if (isList) {
    return _.flow(
      _.update('items', _.map(convertFn)),
      _.set('itemsType', newType === 'reference' ? 'EntityReference' : 'AttributeValue')
    )(attributeValue)
  }

  return convertFn(attributeValue)
}

const renderInputForAttributeType = _.curry((attributeType, props) => {
  return Utils.switchCase(attributeType,
    ['string', () => {
      const { value = '', ...otherProps } = props
      return h(TextInput, {
        autoFocus: true,
        placeholder: 'Enter a value',
        value,
        ...otherProps
      })
    }],
    ['reference', () => {
      const { value, onChange, ...otherProps } = props
      return h(TextInput, {
        autoFocus: true,
        placeholder: `Enter a ${value.entityType}_id`,
        value: value.entityName,
        onChange: v => onChange({ ...value, entityName: v }),
        ...otherProps
      })
    }],
    ['number', () => {
      const { value = 0, ...otherProps } = props
      return h(NumberInput, { autoFocus: true, isClearable: false, value, ...otherProps })
    }],
    ['boolean', () => {
      const { value = false, ...otherProps } = props
      return div({ style: { flexGrow: 1, display: 'flex', alignItems: 'center', height: '2.25rem' } },
        [h(Switch, { checked: value, ...otherProps })])
    }]
  )
})

const defaultValueForAttributeType = (attributeType, referenceEntityType) => {
  return Utils.switchCase(
    attributeType,
    ['string', () => ''],
    ['reference', () => ({ entityName: '', entityType: referenceEntityType })],
    ['number', () => 0],
    ['boolean', () => false]
  )
}

const AttributeInput = ({ autoFocus = false, value: attributeValue, onChange, entityTypes = [] }) => {
  const { type: attributeType, isList } = getAttributeType(attributeValue)

  const renderInput = renderInputForAttributeType(attributeType)

  const defaultReferenceEntityType = Utils.cond(
    [attributeType === 'reference' && isList, () => !_.isEmpty(attributeValue.items) ? attributeValue.items[0].entityType : entityTypes[0]],
    [attributeType === 'reference', () => attributeValue.entityType],
    () => entityTypes[0]
  )
  const defaultValue = defaultValueForAttributeType(attributeType, defaultReferenceEntityType)

  const focusLastListItemInput = useRef(false)
  const lastListItemInput = useRef(null)
  useEffect(() => {
    if (!isList) {
      lastListItemInput.current = null
    }
    if (focusLastListItemInput.current && lastListItemInput.current) {
      lastListItemInput.current.focus()
      focusLastListItemInput.current = false
    }
  }, [attributeValue, isList])

  return h(Fragment, [
    div({ style: { marginBottom: '1rem' } }, [
      fieldset({ style: { border: 'none', margin: 0, padding: 0 } }, [
        legend({ style: { marginBottom: '0.5rem' } }, [isList ? 'List item type:' : 'Attribute type:']),
        h(Fragment, _.map(({ type, tooltip }) => h(TooltipTrigger, { content: tooltip }, [
          span({ style: { marginRight: '1.2rem' } }, [
            h(RadioButton, {
              text: _.startCase(type),
              name: 'edit-type',
              checked: attributeType === type,
              onChange: () => {
                const newAttributeValue = convertAttributeValue(attributeValue, type, defaultReferenceEntityType)
                onChange(newAttributeValue)
              },
              labelStyle: { paddingLeft: '0.5rem' }
            })
          ])
        ]),
        [
          { type: 'string' },
          { type: 'reference', tooltip: 'A link to another entity' },
          { type: 'number' },
          { type: 'boolean' }
        ])
        )
      ]),
      attributeType === 'reference' && div({ style: { marginTop: '0.5rem' } }, [
        h(IdContainer, [id => h(Fragment, [
          label({ htmlFor: id, style: { marginBottom: '0.5rem' } }, 'Referenced entity type:'),
          h(Select, {
            id,
            value: defaultReferenceEntityType,
            options: entityTypes,
            onChange: ({ value }) => {
              const newAttributeValue = isList ?
                _.update('items', _.map(_.set('entityType', value)), attributeValue) :
                _.set('entityType', value, attributeValue)
              onChange(newAttributeValue)
            }
          })
        ])])
      ])
    ]),
    div({ style: { marginBottom: '0.5rem' } }, [
      h(LabeledCheckbox, {
        checked: isList,
        onChange: willBeList => {
          const newAttributeValue = willBeList ?
            { items: [attributeValue], itemsType: attributeType === 'reference' ? 'EntityReference' : 'AttributeValue' } :
            attributeValue.items[0]
          onChange(newAttributeValue)
        }
      }, [
        span({ style: { marginLeft: '0.5rem' } }, ['Attribute is a list'])
      ])
    ]),
    isList ?
      h(Fragment, [
        div({ style: { marginTop: '1.5rem' } }, _.map(([i, value]) => div({
          style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }
        }, [
          renderInput({
            'aria-label': `List value ${i + 1}`,
            autoFocus: i === 0 && autoFocus,
            ref: i === attributeValue.items.length - 1 ? lastListItemInput : undefined,
            value,
            onChange: v => {
              const newAttributeValue = _.update('items', _.set(i, v), attributeValue)
              onChange(newAttributeValue)
            }
          }),
          h(Link, {
            'aria-label': `Remove list value ${i + 1}`,
            disabled: _.size(attributeValue.items) === 1,
            onClick: () => {
              const newAttributeValue = _.update('items', _.pullAt(i), attributeValue)
              onChange(newAttributeValue)
            },
            style: { marginLeft: '0.5rem' }
          }, [
            icon('times', { size: 20 })
          ])
        ]), Utils.toIndexPairs(attributeValue.items))),
        h(Link, {
          style: { display: 'block', marginTop: '1rem' },
          onClick: () => {
            focusLastListItemInput.current = true
            const newAttributeValue = _.update('items', Utils.append(defaultValue), attributeValue)
            onChange(newAttributeValue)
          }
        }, [icon('plus', { style: { marginRight: '0.5rem' } }), 'Add item'])
      ]) : div({ style: { marginTop: '1.5rem' } }, [
        renderInput({
          'aria-label': 'New value',
          autoFocus,
          value: attributeValue,
          onChange
        })
      ])
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
          name: entityName, entityType,
          attributes: { [attributeName]: prepareAttributeForUpload(newValue) }
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
    title: 'Modify Attribute',
    onDismiss,
    showButtons: false
  }, [
    consideringDelete ?
      h(Fragment, [
        'Are you sure you want to delete the attribute ', boldish(attributeName),
        ' from the ', boldish(entityType), ' called ', boldish(entityName), '?',
        div({ style: { marginTop: '1rem' } }, [boldish('This cannot be undone.')]),
        div({ style: { marginTop: '1rem', display: 'flex', alignItems: 'baseline' } }, [
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: () => setConsideringDelete(false) }, ['Back to editing']),
          h(ButtonPrimary, { onClick: doDelete }, ['Delete Attribute'])
        ])
      ]) :
      h(Fragment, [
        h(AttributeInput, {
          autoFocus: true,
          value: newValue,
          onChange: setNewValue,
          entityTypes
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

export const MultipleEntityEditor = ({ entityType, entityNames, attributeNames, entityTypes, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const [attributeToEdit, setAttributeToEdit] = useState('')
  const [attributeToEditTouched, setAttributeToEditTouched] = useState(false)
  const attributeToEditError = attributeToEditTouched && !attributeToEdit ? 'An attribute name is required.' : null
  const isNewAttribute = !_.includes(attributeToEdit, attributeNames)

  const [newValue, setNewValue] = useState('')

  const signal = useCancellation()
  const [isBusy, setIsBusy] = useState()
  const [consideringDelete, setConsideringDelete] = useState()

  const doEdit = async () => {
    try {
      setIsBusy(true)

      const entityUpdates = _.map(entityName => ({
        entityType,
        name: entityName,
        attributes: { [attributeToEdit]: prepareAttributeForUpload(newValue) }
      }), entityNames)

      await Ajax(signal)
        .Workspaces
        .workspace(namespace, name)
        .upsertEntities(entityUpdates)
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to modify entities.', e)
    }
  }

  const doDelete = async () => {
    try {
      setIsBusy(true)
      await Ajax(signal).Workspaces.workspace(namespace, name).deleteAttributeFromEntities(entityType, attributeToEdit, entityNames)
      onSuccess()
    } catch (e) {
      onDismiss()
      reportError('Unable to modify entities.', e)
    }
  }

  const boldish = text => span({ style: { fontWeight: 600 } }, [text])

  return h(Modal, {
    title: `Modify attribute on ${pluralize(entityType, entityNames.length, true)}`,
    onDismiss,
    showButtons: false
  }, [
    consideringDelete ?
      h(Fragment, [
        'Are you sure you want to delete the attribute ', boldish(attributeToEdit),
        ' from ', boldish(`${entityNames.length} ${entityType}s`), '?',
        div({ style: { marginTop: '1rem' } }, [boldish('This cannot be undone.')]),
        div({ style: { marginTop: '1rem', display: 'flex', alignItems: 'baseline' } }, [
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: () => setConsideringDelete(false) }, ['Back to editing']),
          h(ButtonPrimary, { onClick: doDelete }, ['Delete Attribute'])
        ])
      ]) :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: { marginBottom: '0.5rem' } }, 'Select an attribute or enter a new attribute'),
              div({ style: { position: 'relative', display: 'flex', alignItems: 'center' } }, [
                h(AutocompleteTextInput, {
                  id,
                  value: attributeToEdit,
                  suggestions: _.uniq(_.concat(attributeNames, attributeToEdit)),
                  placeholder: 'Attribute name',
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
          h(AttributeInput, {
            value: newValue,
            onChange: setNewValue,
            entityTypes
          }),
          div({ style: { marginTop: '2rem', display: 'flex', alignItems: 'baseline' } }, [
            h(ButtonOutline, {
              disabled: attributeToEditError || isNewAttribute,
              tooltip: Utils.cond(
                [attributeToEditError, () => attributeToEditError],
                [isNewAttribute, () => 'The selected attribute does not exist.']
              ),
              onClick: () => setConsideringDelete(true)
            }, ['Delete']),
            div({ style: { flexGrow: 1 } }),
            h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: onDismiss }, ['Cancel']),
            h(ButtonPrimary, {
              disabled: attributeToEditError,
              tooltip: attributeToEditError,
              onClick: doEdit
            }, [isNewAttribute ? 'Add attribute' : 'Save changes'])
          ])
        ]) : div({ style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline' } }, [
          h(ButtonSecondary, { onClick: onDismiss }, ['Cancel'])
        ])
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
      _.map(({ label, onClick }) => h(MenuButton, { key: label, onClick }, [label]), extraActions)
    ])
  }, [
    h(Link, { 'aria-label': 'Workflow menu', onClick: e => e.stopPropagation() }, [
      icon('cardMenuIcon', { size: 16 })
    ])
  ])

  return h(Sortable, {
    sort, field, onSort
  }, [
    children,
    div({ style: { marginRight: '0.5rem', marginLeft: 'auto' } }, [columnMenu])
  ])
}

export const saveScroll = _.throttle(100, (initialX, initialY) => {
  StateHistory.update({ initialX, initialY })
})

// Accepts two arrays of attribute names. Concatenates, uniquifies, and sorts those attribute names, returning
// the resultant array. Uniqification is case-insensitive but case-preserving, to mirror backend behavior of the
// entity type metadata API. Uniqification prefers the leftmost attribute.
export const concatenateAttributeNames = (attrList1, attrList2) => {
  return _.uniqWith((left, right) => !left.localeCompare(right, undefined, { sensitivity: 'accent' }), _.concat(attrList1, attrList2)).sort()
}
