import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers/lib/index'
import { ButtonPrimary, Clickable, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
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
  border: `1px solid ${colors.warning(0.85)}`,
  backgroundColor: colors.warning(0.4),
  padding: '1rem 1.25rem',
  color: colors.warning(), fontWeight: 'bold', fontSize: 12
}

export const renderDataCell = (data, namespace) => {
  const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum)

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

    this.state = { newEntityType: '', useFireCloudDataModel: false }
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
    const { uploading, file, newEntityType, isInvalid, useFireCloudDataModel } = this.state

    const inputLabel = text => div({ style: { fontSize: 16, marginBottom: '0.3rem' } }, [text])

    return h(Dropzone, {
      multiple: false,
      style: { flexGrow: 1 },
      activeStyle: { cursor: 'copy' },
      onDropAccepted: async ([file]) => {
        const firstBytes = await Utils.readFileAsText(file.slice(0, 1000))
        const definedTypeMatch = /(?:membership|entity):([^\s]+)_id/.exec(firstBytes)

        if (definedTypeMatch) {
          const parsedEntityType = definedTypeMatch[1]
          this.setState({ file, isInvalid: undefined, newEntityType: parsedEntityType, useFireCloudDataModel: false })
        } else {
          this.setState({ file: undefined, isInvalid: true })
        }
      }
    }, [({ dragging, openUploader }) => h(Fragment, [
      h(Modal, {
        onDismiss,
        title: 'Upload Table From .tsv File',
        width: '35rem',
        okButton: h(ButtonPrimary, {
          disabled: !file || uploading,
          onClick: () => this.doUpload()
        }, ['Upload'])
      }, [
        div({ style: { borderBottom: Style.standardLine, marginBottom: '1rem', paddingBottom: '1rem' } }, [
          'Select the ',
          h(TooltipTrigger, { content: 'Tab Separated Values', side: 'bottom' }, [span({ style: { textDecoration: 'underline dashed' } }, 'TSV')]),
          ' file containing your data. The first column header must be:',
          div({ style: { fontFamily: 'monospace', margin: '0.5rem' } }, ['entity:[type]_id']),
          'where ',
          span({ style: { fontFamily: 'monospace' } }, ['[type]']),
          ` is the desired name of the data table in ${getAppName()}.`,
          ' For example, use ',
          span({ style: { fontFamily: 'monospace' } }, ['entity:participant_id']),
          ' to create or update a ',
          span({ style: { fontFamily: 'monospace' } }, ['participant']),
          ' table.',
          div({ style: { marginTop: '0.5rem' } }, ['All of the values in the ID column must be unique.'])
        ]),
        file && _.includes(_.toLower(newEntityType), entityTypes) && div({
          style: { ...warningBoxStyle, marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }
        }, [
          icon('warning-standard', { size: 24, style: { flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' } }),
          div([`Data with the type '${newEntityType}' already exists in this workspace. `,
            'Uploading another load file for the same type may overwrite some entries.'])
        ]),
        isInvalid && div({
          style: { color: colors.warning(), fontWeight: 'bold', fontSize: 12, marginBottom: '0.5rem' }
        }, ['File does not start with entity or membership definition.']),
        inputLabel('Selected File'),
        div({ style: { marginLeft: '0.5rem' } }, [
          (file && file.name) || div({ style: { color: colors.dark(0.7) } }, 'None')
        ]),
        file && supportsFireCloudDataModel(newEntityType) && div([
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
        h(Clickable, {
          style: {
            ...Style.elements.card.container, flex: 1,
            margin: '0.5rem 0',
            backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1),
            border: `1px dashed ${colors.dark(0.7)}`, boxShadow: 'none'
          },
          onClick: openUploader
        }, [
          div(['Drag or ', h(Link, ['Click']), ' to select a .tsv file'])
        ])
      ]),
      uploading && spinnerOverlay
    ])])
  }
}
