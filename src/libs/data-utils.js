import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers/lib/index'
import { ButtonPrimary, Clickable, LabeledCheckbox, Link, RadioButton, Select, SimpleTabBar, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { NotebookCreator } from 'src/components/notebook-utils'
import { TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { UriViewerLink } from 'src/components/UriViewer'
import ReferenceData from 'src/data/reference-data'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { getAppName } from 'src/libs/logos'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const warningBoxStyle = {
  border: '1px solid #DC8412',
  backgroundColor: colors.warning(1),
  padding: '1rem 1.25rem',
  color: colors.warning(), fontWeight: 'bold', fontSize: 12
}

export const renderDataCell = (data, namespace) => {
  const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum) || _.startsWith('drs://', datum)

  const renderCell = datum => h(TextCell, { title: datum },
    [isUri(datum) ? h(UriViewerLink, { uri: datum, googleProject: namespace }) : datum])

  const renderArray = items => {
    return items.map((v, i) => h(Fragment, { key: i }, [
      renderCell(v.toString()), i < (items.length - 1) && div({ style: { marginRight: '0.5rem', color: colors.dark(0.85) } }, ',')
    ]))
  }

  return Utils.cond(
    [_.isArray(data), () => renderArray(data)],
    [_.isObject(data), () => renderArray(data.items)],
    () => renderCell(data && data.toString())
  )
}

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
    this.state = { newEntityType: '', useFireCloudDataModel: false, isFileImportMode: true }
  }

  async doUpload() {
    const { onDismiss, onSuccess, namespace, name } = this.props
    const { file, pastedText, useFireCloudDataModel } = this.state
    this.setState({ uploading: true })
    try {
      const workspace = Ajax().Workspaces.workspace(namespace, name)
      await (useFireCloudDataModel ? workspace.importEntitiesFile : workspace.importFlexibleEntitiesFile)(
        !!pastedText ? new File([pastedText], 'upload.tsv') : file
      )
      onSuccess()
    } catch (error) {
      await reportError('Error uploading entities', error)
      onDismiss()
    }
  }

  updatePastedText(pastedText) {
    const { file } = this.state
    const checkUpload = text => /(?:membership|entity):([^\s]+)_id/.exec(text)
    const definedTypeMatch = checkUpload(pastedText)
    if (file) {
      window.confirm(
        'The file currently selected will not be imported if you choose to paste in text data instead, to continue and paste in data anyway click OK.') &&
      this.setState({ file: undefined })
    }

    if (definedTypeMatch) {
      const parsedEntityType = definedTypeMatch[1]
      this.setState(
        {
          pastedText, isInvalidFile: false, newEntityType: parsedEntityType, useFireCloudDataModel: false, isInvalidText: false,
          file: undefined
        })
    } else {
      this.setState({ pastedText: undefined, isInvalidFile: false, isInvalidText: true })
    }
  }

  render() {
    const { onDismiss, entityTypes, fileImportView } = this.props
    const { uploading, file, newEntityType, isInvalidFile, isInvalidText, useFireCloudDataModel, pastedText, isFileImportMode } = this.state

    const checkUpload = text => /(?:membership|entity):([^\s]+)_id/.exec(text)

    return h(Dropzone, {
      multiple: false,
      style: { flexGrow: 1 },
      activeStyle: { cursor: 'copy' },
      onDropAccepted: async ([file]) => {
        const firstBytes = await Utils.readFileAsText(file.slice(0, 1000))
        const definedTypeMatch = checkUpload(firstBytes)

        if (definedTypeMatch) {
          const parsedEntityType = definedTypeMatch[1]
          this.setState(
            { file, isInvalidFile: false, newEntityType: parsedEntityType, useFireCloudDataModel: false, pastedText: '', isInvalidText: false })
        } else {
          this.setState({ file: undefined, isInvalidFile: true, pastedText: '', isInvalidText: false })
        }
      }
    }, [({ dragging, openUploader }) => h(Fragment, [
      h(Modal, {
        onDismiss,
        title: 'Import Table Data',
        width: '35rem',
        okButton: h(ButtonPrimary, {
          disabled: (!file && !pastedText) || uploading,
          tooltip: (!file && !pastedText) ? 'Please select valid data to upload' : 'Upload selected data',
          onClick: () => this.doUpload()
        }, ['Upload'])
      }, [
        div({ style: { fontWeight: 'bold', borderTop: Style.standardLine, marginTop: '1rem', paddingTop: '1rem' } }),
        '• The first column header must be:',
        span({ style: { fontFamily: 'monospace', margin: '0.5rem', fontWeight: '600' } }, ['entity:[type]_id']),
        'where ',
        span({ style: { fontFamily: 'monospace', fontWeight: '600' } }, ['[type]']),
        ` is the desired name of the data table in ${getAppName()}.`,
        ' For example, to create or update a ',
        span({ style: { fontFamily: 'monospace', fontWeight: '600' } }, ['participant']),
        ' table use ',
        span({ style: { fontFamily: 'monospace', fontWeight: '600' } }, ['entity:participant_id']),
        div({ style: { marginTop: '0.5rem', marginBottom: '0.5rem' } }, ['• All of the values in the ID column must be unique.']),
        div({ style: { borderTop: Style.standardLine, paddingTop: '1rem', fontWeight: 'bold', marginTop: '1rem' } }, ['Choose an import type:']),
        div({ style: { marginTop: '0.1rem', marginBottom: '0.1rem', fontSize: 12 } },
          ['(Switching import types will lose any currently inputted data)']),
        (file || pastedText) && _.includes(_.toLower(newEntityType), entityTypes) && div({
          style: { ...warningBoxStyle, marginTop: '0.5rem', marginBottom: '0.5rem', color: colors.light(.1), display: 'flex', alignItems: 'center' }
        }, [
          icon('warning-standard', { size: 19, style: { color: colors.light(.1), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          `Data with the type '${newEntityType}' already exists in this workspace. `,
          'Uploading more data for the same type may overwrite some entries.'
        ]),
        (file || pastedText) && supportsFireCloudDataModel(newEntityType) && div([
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
        h(SimpleTabBar, {
          tabs: [{ title: 'File Import', key: true }, { title: 'Text Import', key: false }],
          value: isFileImportMode,
          onChange: value => {
            this.setState({ isFileImportMode: value })
          }
        }),
        isFileImportMode ? div([
          div([
            div({ style: { marginTop: '0.5rem' } }, ['Select the ',
              h(TooltipTrigger, { content: 'Tab Separated Values', side: 'bottom' },
                [span({ style: { textDecoration: 'underline dashed' } }, 'TSV')]),
              ' file containing your data: ']),
            h(Clickable, {
              style: {
                ...Style.elements.card.container, flex: 1,
                margin: '0.5rem 0',
                backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1),
                border: isInvalidFile ? `1px solid ${colors.danger()}` : `1px dashed ${colors.dark(0.7)}`,
                boxShadow: 'none'
              },
              onClick: pastedText ?
                () => window.confirm(
                  'The data currently typed in will not be imported if you choose to upload a file instead, to continue and upload a file anyway click OK.') &&
                  openUploader() :
                openUploader
            }, [div(['Drag or ', h(Link, ['Click']), ' to select a .tsv file'])]),
            div({ style: { marginLeft: '1rem', marginTop: '0.5rem', fontSize: 12 } }, ['Selected File: ',
              div({ style: { color: colors.dark(0.7) } }, (file && file.name) ? file.name : 'None')])
          ])
        ]) : div([div({ style: { marginTop: '0.5rem' } }, ['Paste the data directly to the text field below:']),
          h(TextArea, {
            'aria-label': 'Paste text data',
            placeholder: 'Paste/Enter text data here...',
            onChange: pastedText => this.updatePastedText(pastedText),
            value: pastedText,
            wrap: 'off',
            style: {
              ...Style.elements.card.container, flex: 1, fontFamily: 'monospace', resize: 'vertical',
              maxHeight: 300, minHeight: 60, margin: '0.5rem 0',
              backgroundColor: isInvalidText ? colors.danger(.1) : (pastedText ? colors.light(0.1) : colors.dark(0.1)),
              border: isInvalidText ? `1px solid ${colors.danger()}` : `1px dashed ${colors.dark(0.7)}`,
              boxShadow: 'none'
            }
          })]),
        (isInvalidText || isInvalidFile) && div({
          style: { color: colors.danger(), fontWeight: 'bold', fontSize: 12, marginTop: '0.5rem' }
        }, ['Invalid format: Data does not start with entity or membership definition.'])
      ]),
      uploading && spinnerOverlay
    ])])
  }
}
