import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment, useState } from 'react'
import { div, fieldset, h, legend, span } from 'react-hyperscript-helpers'
import {
  ButtonOutline, ButtonPrimary, ButtonSecondary, Clickable, IdContainer, LabeledCheckbox, Link, RadioButton, Select, SimpleTabBar, spinnerOverlay,
  Switch
} from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { NumberInput, PasteOnlyInput, TextInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { UriViewerLink } from 'src/components/UriViewer'
import { canUseWorkspaceProject } from 'src/components/workspace-utils'
import ReferenceData from 'src/data/reference-data'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const warningBoxStyle = {
  backgroundColor: colors.warning(0.15),
  padding: '1rem 1.25rem',
  color: colors.dark(), fontWeight: 'bold', fontSize: 12
}

const errorTextStyle = { color: colors.danger(), fontWeight: 'bold', fontSize: 12, marginTop: '0.5rem' }

export const parseGsUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))

export const getUserProjectForWorkspace = async workspace => (workspace && await canUseWorkspaceProject(workspace)) ? workspace.workspace.namespace : requesterPaysProjectStore.get()

export const renderDataCell = (data, namespace) => {
  const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum) || _.startsWith('drs://', datum)

  const renderCell = datum => {
    const stringDatum = Utils.convertValue('string', datum)

    return h(TextCell, { title: stringDatum },
      [isUri(datum) ? h(UriViewerLink, { uri: datum, googleProject: namespace }) : stringDatum])
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

export const ReferenceDataImporter = class ReferenceDataImporter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    this.state = { loading: false, selectedReference: undefined }
  }

  render() {
    const { onDismiss, onSuccess, namespace, name } = this.props
    const { loading, selectedReference } = this.state

    return h(Modal, {
      'aria-label': 'Add Reference Data',
      onDismiss,
      title: 'Add Reference Data',
      okButton: h(ButtonPrimary, {
        disabled: !selectedReference || loading,
        onClick: async () => {
          this.setState({ loading: true })
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
        onChange: ({ value }) => this.setState({ selectedReference: value }),
        options: _.keys(ReferenceData)
      }),
      loading && spinnerOverlay
    ])
  }
}

export const ReferenceDataDeleter = class ReferenceDataDeleter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    referenceDataType: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    this.state = { deleting: false }
  }

  render() {
    const { onDismiss, onSuccess, namespace, name, referenceDataType } = this.props
    const { deleting } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Confirm Delete',
      okButton: h(ButtonPrimary, {
        disabled: deleting,
        onClick: async () => {
          this.setState({ deleting: true })
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
}

export const EntityDeleter = class EntityDeleter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    selectedEntities: PropTypes.array.isRequired,
    selectedDataType: PropTypes.string.isRequired,
    runningSubmissionsCount: PropTypes.number.isRequired
  }

  constructor(props) {
    super(props)

    this.state = { additionalDeletions: [] }
  }

  async doDelete() {
    const { onDismiss, onSuccess, namespace, name, selectedEntities, selectedDataType } = this.props
    const { additionalDeletions } = this.state
    const entitiesToDelete = _.concat(_.map(entityName => ({ entityName, entityType: selectedDataType }), selectedEntities), additionalDeletions)

    this.setState({ deleting: true })

    try {
      await Ajax().Workspaces.workspace(namespace, name).deleteEntities(entitiesToDelete)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          this.setState({ additionalDeletions: _.filter(entity => entity.entityType !== selectedDataType, await error.json()), deleting: false })
          break
        default:
          await reportError('Error deleting data entries', error)
          onDismiss()
      }
    }
  }

  render() {
    const { onDismiss, selectedEntities, runningSubmissionsCount } = this.props
    const { deleting, additionalDeletions } = this.state
    const moreToDelete = !!additionalDeletions.length

    const fullWidthWarning = {
      ...warningBoxStyle,
      borderLeft: 'none', borderRight: 'none',
      margin: '0 -1.25rem'
    }

    const total = selectedEntities.length + additionalDeletions.length
    return h(Modal, {
      onDismiss,
      title: 'Confirm Delete',
      okButton: h(ButtonPrimary, {
        disabled: deleting,
        onClick: () => this.doDelete()
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
      ..._.map(([i, entity]) => div({
        style: {
          borderTop: (i === 0 && runningSubmissionsCount === 0) ? undefined : Style.standardLine,
          padding: '0.6rem 1.25rem', margin: '0 -1.25rem'
        }
      }, moreToDelete ? `${entity.entityName} (${entity.entityType})` : entity),
      Utils.toIndexPairs(moreToDelete ? additionalDeletions : selectedEntities)),
      div({
        style: { ...fullWidthWarning, textAlign: 'right' }
      }, [`${total} data ${total > 1 ? 'entries' : 'entry'} to be deleted.`]),
      deleting && spinnerOverlay
    ])
  }
}

const supportsFireCloudDataModel = entityType => _.includes(entityType, ['pair', 'participant', 'sample'])

export const EntityUploader = class EntityUploader extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    entityTypes: PropTypes.array.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      useFireCloudDataModel: false, isFileImportCurrMode: true, isFileImportLastUsedMode: undefined,
      file: undefined, fileContents: '', showInvalidEntryMethodWarning: false
    }
  }

  async doUpload() {
    const { onDismiss, onSuccess, namespace, name } = this.props
    const { file, useFireCloudDataModel } = this.state
    this.setState({ uploading: true })
    try {
      const workspace = Ajax().Workspaces.workspace(namespace, name)
      await (useFireCloudDataModel ? workspace.importEntitiesFile : workspace.importFlexibleEntitiesFile)(file)
      onSuccess()
    } catch (error) {
      await reportError('Error uploading entities', error)
      onDismiss()
    }
  }

  render() {
    const { onDismiss, entityTypes } = this.props
    const { uploading, file, useFireCloudDataModel, isFileImportCurrMode, fileContents, isFileImportLastUsedMode, showInvalidEntryMethodWarning } = this.state
    const match = /(?:membership|entity):([^\s]+)_id/.exec(fileContents)
    const isInvalid = isFileImportCurrMode === isFileImportLastUsedMode && file && !match
    const newEntityType = match && match[1]
    const currentFile = isFileImportCurrMode === isFileImportLastUsedMode ? file : undefined

    return h(Dropzone, {
      multiple: false,
      style: { flexGrow: 1 },
      activeStyle: { cursor: 'copy' },
      onDropAccepted: async ([file]) => {
        this.setState({ file, fileContents: await Utils.readFileAsText(file.slice(0, 1000)), isFileImportLastUsedMode: true })
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
            onClick: () => this.doUpload()
          }, ['Upload'])
        }, [
          div({ style: { padding: '0 0 1rem' } },
            ['Choose the data import option below. ',
              h(Link, {
                ...Utils.newTabLinkProps,
                href: 'https://support.terra.bio/hc/en-us/articles/360025758392'
              }, ['Click here for more info on the table.'])]),
          h(SimpleTabBar, {
            tabs: [{ title: 'File Import', key: true, width: 121 }, { title: 'Text Import', key: false, width: 127 }],
            value: isFileImportCurrMode,
            onChange: value => {
              this.setState({ isFileImportCurrMode: value, showInvalidEntryMethodWarning: false })
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
                    this.setState({ fileContents: '', file: undefined, useFireCloudDataModel: false })
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
              span({ style: { color: colors.dark(1), fontWeight: 550 } },
                (currentFile && currentFile.name) ? currentFile.name : 'None')
            ])
          ]) : div([
            h(PasteOnlyInput, {
              'aria-label': 'Paste text data here',
              readOnly: !!fileContents,
              placeholder: 'entity:participant_id(tab)column1(tab)column2...',
              onPaste: pastedText => {
                this.setState(
                  { file: new File([pastedText], 'upload.tsv'), fileContents: pastedText, isFileImportLastUsedMode: false, showInvalidEntryMethodWarning: false })
              },
              onChange: () => this.setState({ showInvalidEntryMethodWarning: true }),
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
          currentFile && supportsFireCloudDataModel(newEntityType) && div([
            h(LabeledCheckbox, {
              checked: useFireCloudDataModel,
              onChange: checked => this.setState({ useFireCloudDataModel: checked }),
              style: { margin: '0.5rem' }
            }, [' Create participant, sample, and pair associations']),
            h(Link, {
              style: { marginLeft: '1rem', verticalAlign: 'middle' },
              href: 'https://software.broadinstitute.org/firecloud/documentation/article?id=10738',
              ...Utils.newTabLinkProps
            }, ['Learn more ', icon('pop-out', { size: 12 })])
          ]),
          div({ style: errorTextStyle }, [
            Utils.cond(
              [isInvalid, () => 'Invalid format: Data does not start with entity or membership definition.'],
              [showInvalidEntryMethodWarning, () => 'Invalid Data Entry Method: Copy and paste only']
            )
          ])
        ]),
        uploading && spinnerOverlay
      ])
    ])
  }
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

export const EntityEditor = ({ entityType, entityName, attributeName, attributeValue, entityTypes, workspaceId: { namespace, name }, onDismiss, onSuccess }) => {
  const initialIsReference = _.isObject(attributeValue) && (attributeValue.entityType || attributeValue.itemsType === 'EntityReference')
  const initialIsList = _.isObject(attributeValue) && attributeValue.items
  const initialType = Utils.cond(
    [initialIsReference, () => 'reference'],
    [(initialIsList ? attributeValue.items[0] : attributeValue) === undefined, () => 'string'],
    [initialIsList, () => typeof attributeValue.items[0]],
    () => typeof attributeValue
  )

  const [newValue, setNewValue] = useState(() => Utils.cond(
    [initialIsReference && initialIsList, () => _.map('entityName', attributeValue.items)],
    [initialIsList, () => attributeValue.items],
    [initialIsReference, () => attributeValue.entityName],
    () => attributeValue
  ))
  const [linkedEntityType, setLinkedEntityType] = useState(() => Utils.cond(
    [initialIsReference && initialIsList, () => attributeValue.items[0] ? attributeValue.items[0].entityType : undefined],
    [initialIsReference, () => attributeValue.entityType],
    () => entityTypes[0]
  ))
  const [editType, setEditType] = useState(() => Utils.cond(
    [initialIsReference, () => 'reference'],
    [(initialIsList ? attributeValue.items[0] : attributeValue) === undefined, () => 'string'],
    [initialIsList, () => typeof attributeValue.items[0]],
    () => typeof attributeValue
  ))
  const [isBusy, setIsBusy] = useState()
  const [consideringDelete, setConsideringDelete] = useState()

  const isList = _.isArray(newValue)
  const isUnchanged = (initialType === editType && initialIsList === isList && _.isEqual(attributeValue, newValue))

  const makeTextInput = placeholder => ({ value = '', ...props }) => h(TextInput, { autoFocus: true, placeholder, value, ...props })

  const { prepForUpload, makeInput, blankVal } = Utils.switchCase(editType,
    ['string', () => ({
      prepForUpload: _.trim,
      makeInput: makeTextInput('Enter a value'),
      blankVal: ''
    })],
    ['reference', () => ({
      prepForUpload: v => ({ entityName: _.trim(v), entityType: linkedEntityType }),
      makeInput: makeTextInput(`Enter a ${linkedEntityType}_id`),
      blankVal: ''
    })],
    ['number', () => ({
      prepForUpload: _.identity,
      makeInput: ({ value = 0, ...props }) => h(NumberInput, { autoFocus: true, isClearable: false, value, ...props }),
      blankVal: 0
    })],
    ['boolean', () => ({
      prepForUpload: _.identity,
      makeInput: ({ value = false, ...props }) => div({ style: { flexGrow: 1, display: 'flex', alignItems: 'center', height: '2.25rem' } },
        [h(Switch, { checked: value, ...props })]),
      blankVal: false
    })]
  )

  const doEdit = async () => {
    try {
      setIsBusy(true)

      await Ajax()
        .Workspaces
        .workspace(namespace, name)
        .upsertEntities([{
          name: entityName, entityType,
          attributes: { [attributeName]: isList ? _.map(prepForUpload, newValue) : prepForUpload(newValue) }
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
        div({ style: { marginBottom: '1rem' } }, [
          fieldset({ style: { border: 'none', margin: 0, padding: 0 } }, [
            legend({ style: { marginBottom: '0.5rem' } }, [isList ? 'List item type:' : 'Attribute type:']),
            h(Fragment, _.map(({ type, tooltip }) => h(TooltipTrigger, {
              content: tooltip
            }, [
              span({ style: { marginRight: '1.2rem' } }, [h(RadioButton, {
                text: _.startCase(type),
                name: 'edit-type',
                checked: editType === type,
                onChange: () => {
                  const convertFn = type === 'number' ?
                    v => {
                      const numberVal = _.toNumber(v)
                      return _.isNaN(numberVal) ? 0 : numberVal
                    } :
                    Utils.convertValue(type === 'reference' ? 'string' : type)
                  const convertedValue = isList ? _.map(convertFn, newValue) : convertFn(newValue)

                  setNewValue(convertedValue)
                  setEditType(type)
                },
                labelStyle: { paddingLeft: '0.5rem' }
              })])
            ]), [
              { type: 'string' },
              { type: 'reference', tooltip: 'A link to another entity' },
              { type: 'number' },
              { type: 'boolean' }
            ]))
          ]),
          editType === 'reference' && div({ style: { marginTop: '0.5rem' } }, [
            div({ style: { marginBottom: '0.5rem' } }, 'Referenced entity type:'),
            h(Select, {
              value: linkedEntityType,
              options: entityTypes,
              onChange: ({ value }) => setLinkedEntityType(value)
            })
          ])
        ]),
        div({ style: { marginBottom: '0.5rem' } }, [
          h(LabeledCheckbox, {
            checked: isList,
            onChange: willBeList => setNewValue(willBeList ? [newValue] : newValue[0])
          }, [span({ style: { marginLeft: '0.5rem' } }, ['Attribute is a list'])])
        ]),
        isList ?
          div({ style: { marginTop: '1.5rem' } }, _.map(([i, value]) => div({
            style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }
          }, [
            makeInput({
              'aria-label': `List value ${i + 1}`,
              autoFocus: true,
              value,
              onChange: v => setNewValue(_.set(i, v))
            }),
            h(Link, {
              'aria-label': `Remove list value ${i + 1}`,
              disabled: newValue.length === 1,
              onClick: () => setNewValue(_.pullAt(i)),
              style: { marginLeft: '0.5rem' }
            }, [
              icon('times', { size: 20 })
            ])
          ]), Utils.toIndexPairs(newValue))) :
          div({ style: { marginTop: '1.5rem' } }, [
            makeInput({
              'aria-label': 'New value',
              autoFocus: true,
              value: newValue,
              onChange: setNewValue
            })
          ]),
        isList && h(Link, {
          style: { display: 'block', marginTop: '1rem' },
          onClick: () => setNewValue(Utils.append(blankVal))
        }, [icon('plus', { style: { marginRight: '0.5rem' } }), 'Add item']),
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
