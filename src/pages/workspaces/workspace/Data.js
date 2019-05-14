import clipboard from 'clipboard-polyfill'
import FileSaver from 'file-saver'
import filesize from 'filesize'
import _ from 'lodash/fp'
import { createRef, Fragment, useState } from 'react'
import Dropzone from 'react-dropzone'
import { div, form, h, input } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, linkButton, Select, spinnerOverlay } from 'src/components/common'
import DataTable from 'src/components/DataTable'
import ExportDataModal from 'src/components/ExportDataModal'
import FloatingActionButton from 'src/components/FloatingActionButton'
import { icon, spinner } from 'src/components/icons'
import { DelayedSearchInput, TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { FlexTable, HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import UriViewer from 'src/components/UriViewer'
import { ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { EntityDeleter, EntityUploader, ReferenceDataDeleter, ReferenceDataImporter, renderDataCell } from 'src/libs/data-utils'
import { withErrorReporting } from 'src/libs/error'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import { IGVFileSelector } from 'src/components/IGVFileSelector'
import { IGVBrowser } from 'src/components/IGVBrowser'
const localVariables = 'localVariables'
const bucketObjects = '__bucket_objects__'

const styles = {
  tableContainer: {
    display: 'flex', flex: 1
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 280, backgroundColor: 'white', padding: '1rem',
    boxShadow: '0 2px 10px 0 rgba(0,0,0,0.5)'
  },
  tableViewPanel: {
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem', width: '100%',
    flex: 1, display: 'flex', flexDirection: 'column'
  },
  dataTypeHeading: {
    fontWeight: 500, color: colors.dark()
  }
}

const DataTypeButton = ({ selected, children, iconName = 'listAlt', iconSize = 14, ...props }) => {
  return linkButton({
    as: 'span',
    style: { display: 'flex', alignItems: 'center', color: 'black', fontWeight: selected ? 500 : undefined, padding: '0.5rem 0' },
    ...props
  }, [
    div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [
      selected && icon('circle', { size: 14, className: 'is-solid' })
    ]),
    div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [
      icon(iconName, { size: iconSize })
    ]),
    div({ style: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, [
      children
    ])
  ])
}

const saveScroll = _.throttle(100, (initialX, initialY) => {
  StateHistory.update({ initialX, initialY })
})

const getReferenceData = _.flow(
  _.toPairs,
  _.filter(([key]) => key.startsWith('referenceData-')),
  _.map(([k, value]) => {
    const [, datum, key] = /referenceData-([^-]+)-(.+)/.exec(k)
    return { datum, key, value }
  }),
  _.groupBy('datum')
)

const LocalVariablesContent = ajaxCaller(class LocalVariablesContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      editIndex: undefined,
      deleteIndex: undefined,
      editKey: undefined,
      editValue: undefined,
      editType: undefined,
      textFilter: ''
    }
    this.uploader = createRef()
  }

  render() {
    const { workspace, workspace: { workspace: { namespace, name, attributes } }, ajax: { Workspaces }, refreshWorkspace, loadingWorkspace, firstRender } = this.props
    const { editIndex, deleteIndex, editKey, editValue, editType, textFilter } = this.state
    const stopEditing = () => this.setState({ editIndex: undefined, editKey: undefined, editValue: undefined, editType: undefined })
    const filteredAttributes = _.flow(
      _.toPairs,
      _.remove(([key]) => key === 'description' || key.includes(':') || key.startsWith('referenceData-')),
      _.filter(data => Utils.textMatch(textFilter, _.join(' ', data))),
      _.sortBy(_.first)
    )(attributes)

    const creatingNewVariable = editIndex === filteredAttributes.length
    const amendedAttributes = [
      ...filteredAttributes, ...(creatingNewVariable ? [['', '']] : [])
    ]

    const inputErrors = editIndex && [
      ...(_.keys(_.unset(amendedAttributes[editIndex][0], attributes)).includes(editKey) ? ['Key must be unique'] : []),
      ...(!editKey ? ['Key is required'] : []),
      ...(!editValue ? ['Value is required'] : []),
      ...(editValue && editType === 'number' && Utils.cantBeNumber(editValue) ? ['Value is not a number'] : []),
      ...(editValue && editType === 'number list' && _.some(Utils.cantBeNumber, editValue.split(',')) ?
        ['Value is not a comma-separated list of numbers'] : [])
    ]

    const saveAttribute = withErrorReporting('Error saving change to workspace variables', async originalKey => {
      const isList = editType.includes('list')
      const newBaseType = isList ? editType.slice(0, -5) : editType

      const parsedValue = isList ? _.map(Utils.convertValue(newBaseType), editValue.split(/,s*/)) :
        Utils.convertValue(newBaseType, editValue)

      this.setState({ saving: true })

      await Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ [editKey]: parsedValue })

      if (editKey !== originalKey) {
        await Workspaces.workspace(namespace, name).deleteAttributes([originalKey])
      }

      await refreshWorkspace()
      stopEditing()
      this.setState({ textFilter: '' })
    })

    const upload = withErrorReporting('Error uploading file', async ([file]) => {
      await Workspaces.workspace(namespace, name).importAttributes(file)
      await refreshWorkspace()
    })

    const download = withErrorReporting('Error downloading attributes', async () => {
      const blob = await Workspaces.workspace(namespace, name).exportAttributes()
      FileSaver.saveAs(blob, `${name}-workspace-attributes.tsv`)
    })

    const { initialY } = firstRender ? StateHistory.get() : {}
    return h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace),
      disableClick: true,
      style: { flex: 1, display: 'flex', flexDirection: 'column' },
      activeStyle: { backgroundColor: colors.primary(0.2), cursor: 'copy' },
      ref: this.uploader,
      onDropAccepted: upload
    }, [
      div({ style: { flex: 'none', display: 'flex', alignItems: 'center', marginBottom: '1rem', justifyContent: 'flex-end' } }, [
        linkButton({ onClick: download }, ['Download TSV']),
        !Utils.editWorkspaceError(workspace) && h(Fragment, [
          div({ style: { whiteSpace: 'pre' } }, ['  |  Drag or click to ']),
          linkButton({ onClick: () => this.uploader.current.open() }, ['upload TSV'])
        ]),
        h(DelayedSearchInput, {
          style: { width: 300, marginLeft: '1rem' },
          placeholder: 'Search',
          onChange: v => this.setState({ textFilter: v }),
          defaultValue: textFilter
        })
      ]),
      Utils.cond(
        [_.isEmpty(amendedAttributes), () => 'No Workspace Data defined'],
        () => div({ style: { flex: 1 } }, [
          h(AutoSizer, [
            ({ width, height }) => h(FlexTable, {
              width, height, rowCount: amendedAttributes.length,
              onScroll: y => saveScroll(0, y),
              initialY,
              hoverHighlight: true,
              columns: [
                {
                  size: { basis: 400, grow: 0 },
                  headerRenderer: () => h(HeaderCell, ['Key']),
                  cellRenderer: ({ rowIndex }) => editIndex === rowIndex ?
                    h(TextInput, {
                      autoFocus: true,
                      value: editKey,
                      onChange: v => this.setState({ editKey: v })
                    }) :
                    renderDataCell(amendedAttributes[rowIndex][0], namespace)
                },
                {
                  size: { grow: 1 },
                  headerRenderer: () => h(HeaderCell, ['Value']),
                  cellRenderer: ({ rowIndex }) => {
                    const [originalKey, originalValue] = amendedAttributes[rowIndex]

                    return h(Fragment, [
                      div({ style: { flex: 1, minWidth: 0, display: 'flex' } }, [
                        editIndex === rowIndex ?
                          h(TextInput, {
                            value: editValue,
                            onChange: v => this.setState({ editValue: v })
                          }) :
                          renderDataCell(originalValue, namespace)
                      ]),
                      editIndex === rowIndex ?
                        h(Fragment, [
                          h(Select, {
                            styles: { container: base => ({ ...base, marginLeft: '1rem', width: 150 }) },
                            isSearchable: false,
                            isClearable: false,
                            menuPortalTarget: document.getElementById('root'),
                            getOptionLabel: ({ value }) => _.startCase(value),
                            value: editType,
                            onChange: ({ value }) => this.setState({ editType: value }),
                            options: ['string', 'number', 'boolean', 'string list', 'number list', 'boolean list']
                          }),
                          linkButton({
                            tooltip: Utils.summarizeErrors(inputErrors) || 'Save changes',
                            disabled: !!inputErrors.length,
                            style: { marginLeft: '1rem' },
                            onClick: () => saveAttribute(originalKey)
                          }, [icon('success-standard', { size: 23 })]),
                          linkButton({
                            tooltip: 'Cancel editing',
                            style: { marginLeft: '1rem' },
                            onClick: () => stopEditing()
                          }, [icon('times-circle', { size: 23 })])
                        ]) :
                        div({ className: 'hover-only' }, [
                          linkButton({
                            disabled: !!Utils.editWorkspaceError(workspace),
                            tooltip: Utils.editWorkspaceError(workspace) || 'Edit variable',
                            style: { marginLeft: '1rem' },
                            onClick: () => this.setState({
                              editIndex: rowIndex,
                              editValue: typeof originalValue === 'object' ? originalValue.items.join(', ') : originalValue,
                              editKey: originalKey,
                              editType: typeof originalValue === 'object' ? `${typeof originalValue.items[0]} list` : typeof originalValue
                            })
                          }, [icon('pencil', { size: 19 })]),
                          linkButton({
                            disabled: !!Utils.editWorkspaceError(workspace),
                            tooltip: Utils.editWorkspaceError(workspace) || 'Delete variable',
                            style: { marginLeft: '1rem' },
                            onClick: () => this.setState({ deleteIndex: rowIndex })
                          }, [icon('trash', { size: 19 })])
                        ])
                    ])
                  }
                }
              ]
            })
          ])
        ])
      ),
      !creatingNewVariable && !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
        label: 'ADD VARIABLE',
        iconShape: 'plus',
        bottom: 50,
        right: 50,
        onClick: () => this.setState({
          editIndex: filteredAttributes.length,
          editValue: '',
          editKey: '',
          editType: 'string'
        })
      }),
      !_.isUndefined(deleteIndex) && h(Modal, {
        onDismiss: () => this.setState({ deleteIndex: undefined }),
        title: 'Are you sure you wish to delete this variable?',
        okButton: buttonPrimary({
          onClick: _.flow(
            withErrorReporting('Error deleting workspace variable'),
            Utils.withBusyState(v => this.setState({ saving: v }))
          )(async () => {
            this.setState({ deleteIndex: undefined })
            await Workspaces.workspace(namespace, name).deleteAttributes([amendedAttributes[deleteIndex][0]])
            refreshWorkspace()
          })
        },
        'Delete Variable')
      }, ['This will permanently delete the data from Workspace Data.']),
      loadingWorkspace && spinnerOverlay
    ])
  }
})

const ReferenceDataContent = ({ workspace: { workspace: { namespace, attributes } }, referenceKey, loadingWorkspace, firstRender }) => {
  const [textFilter, setTextFilter] = useState('')

  const selectedData = _.flow(
    _.filter(({ key, value }) => Utils.textMatch(textFilter, `${key} ${value}`)),
    _.sortBy('key')
  )(getReferenceData(attributes)[referenceKey])
  const { initialY } = firstRender ? StateHistory.get() : {}

  return h(Fragment, [
    h(DelayedSearchInput, {
      style: { width: 300, marginBottom: '1rem', alignSelf: 'flex-end' },
      placeholder: 'Search',
      onChange: setTextFilter,
      defaultValue: textFilter
    }),
    div({ style: { flex: 1 } }, [
      h(AutoSizer, [
        ({ width, height }) => h(FlexTable, {
          width, height, rowCount: selectedData.length,
          onScroll: y => saveScroll(0, y),
          initialY,
          columns: [
            {
              size: { basis: 400, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Key']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].key, namespace)
            },
            {
              size: { grow: 1 },
              headerRenderer: () => h(HeaderCell, ['Value']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].value, namespace)
            }
          ]
        })
      ])
    ]),
    loadingWorkspace && spinnerOverlay
  ])
}

class EntitiesContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedEntities: {},
      deletingEntities: false,
      refreshKey: 0,
      igvFiles: undefined,
      showIgvSelector: false
    }
    this.downloadForm = createRef()
  }

  renderDownloadButton(columnSettings) {
    const { workspace: { workspace: { namespace, name } }, entityKey } = this.props
    const { selectedEntities } = this.state
    return h(Fragment, [
      form({
        ref: this.downloadForm,
        action: `${getConfig().orchestrationUrlRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${entityKey}/tsv`,
        method: 'POST'
      }, [
        input({ type: 'hidden', name: 'FCtoken', value: getUser().token }),
        input({ type: 'hidden', name: 'attributeNames', value: _.map('name', _.filter('visible', columnSettings)).join(',') }),
        input({ type: 'hidden', name: 'model', value: 'flexible' })
      ]),
      _.isEmpty(selectedEntities) ? buttonPrimary({
        tooltip: 'Download all data as a file',
        onClick: () => this.downloadForm.current.submit()
      }, [
        icon('download', { style: { marginRight: '0.5rem' } }),
        'Download Table TSV'
      ]) : buttonPrimary({
        disabled: _.isEmpty(selectedEntities),
        tooltip: 'Download selected data as a file',
        onClick: async () => {
          const str = this.buildTSV(columnSettings, selectedEntities)
          FileSaver.saveAs(new Blob([str], { type: 'text/tab-separated-values' }), `${entityKey}.tsv`)
        }
      }, [
        icon('download', { style: { marginRight: '0.5rem' } }),
        `Download Selected TSV (${_.size(selectedEntities)})`
      ])
    ])
  }

  renderCopyButton(entities, columnSettings) {
    const { copying, copied } = this.state

    return h(Fragment, [
      buttonPrimary({
        style: { margin: '0 1rem' },
        tooltip: 'Copy only the current page to the clipboard',
        onClick: _.flow(
          withErrorReporting('Error copying to clipboard'),
          Utils.withBusyState(v => this.setState({ copying: v }))
        )(async () => {
          const str = this.buildTSV(columnSettings, entities)
          await clipboard.writeText(str)
          this.setState({ copied: true })
        })
      }, [
        icon('copy-to-clipboard', { style: { marginRight: '0.5rem' } }),
        'Copy to Clipboard'
      ]),
      copying && spinner(),
      copied && 'Done!'
    ])
  }

  renderIgvButton() {
    const { selectedEntities } = this.state

    return h(Fragment, [
      buttonPrimary({
        style: { marginRight: '1rem' },
        disabled: _.isEmpty(selectedEntities),
        tooltip: 'Opens files of the selected data with IGV',
        onClick: () => this.setState({ showIgvSelector: true })
      }, [
        'Open with IGV'
      ])
    ])
  }

  renderOpenInDataExplorerButton() {
    const { workspace: { workspace: { workspaceId } } } = this.props
    const { selectedEntities } = this.state

    return h(Fragment, [
      buttonPrimary({
        disabled: _.size(selectedEntities) !== 1,
        tooltip: _.size(selectedEntities) === 0 ? 'Select a cohort to open in Data Explorer' :
          _.size(selectedEntities) > 1 ? 'Select exactly one cohort to open in Data Explorer' :
            '',
        onClick: () => window.open(_.values(selectedEntities)[0].attributes.data_explorer_url + '&wid=' + workspaceId)
      }, [
        icon('search', { style: { marginRight: '0.5rem' } }),
        'Open in Data Explorer'
      ])
    ])
  }

  buildTSV(columnSettings, entities) {
    const { entityKey } = this.props
    const attributeNames = _.map('name', _.filter('visible', columnSettings))

    const entityToRow = entity => _.join('\t', [
      entity.name, ..._.map(
        attribute => Utils.entityAttributeText(entity.attributes[attribute]),
        attributeNames)
    ])

    const header = _.join('\t', [`${entityKey}_id`, ...attributeNames])

    return _.join('\n', [header, ..._.map(entityToRow, entities)]) + '\n'
  }

  render() {
    const {
      workspace, workspace: { workspace: { namespace, name }, workspaceSubmissionStats: { runningSubmissionsCount } },
      entityKey, entityMetadata, loadMetadata, firstRender
    } = this.props
    const { selectedEntities, deletingEntities, copyingEntities, refreshKey, igvFiles, showIgvSelector } = this.state

    const { initialX, initialY } = firstRender ? StateHistory.get() : {}
    return igvFiles ? h(IGVBrowser, { selectedFiles: igvFiles, refGenome: 'hg19', namespace }) : h(Fragment, [
      h(DataTable, {
        persist: true, firstRender, refreshKey,
        entityType: entityKey, entityMetadata, workspaceId: { namespace, name },
        onScroll: saveScroll, initialX, initialY,
        selectionModel: {
          type: 'multiple',
          selected: selectedEntities,
          setSelected: e => this.setState({ selectedEntities: e })
        },
        childrenBefore: ({ entities, columnSettings }) => div({
          style: { display: 'flex', alignItems: 'center', flex: 'none' }
        }, entityKey === 'cohort' && entityMetadata.cohort.attributeNames.includes('data_explorer_url') ? [
          this.renderOpenInDataExplorerButton()
        ] : [
          this.renderDownloadButton(columnSettings),
          this.renderCopyButton(entities, columnSettings),
          this.renderIgvButton()
        ])
      }),
      !_.isEmpty(selectedEntities) && h(FloatingActionButton, {
        label: 'COPY DATA',
        iconShape: 'copy',
        bottom: 100,
        right: 50,
        onClick: () => this.setState({ copyingEntities: true })
      }),
      !_.isEmpty(selectedEntities) && !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
        label: 'DELETE DATA',
        iconShape: 'trash',
        bottom: 50,
        right: 50,
        onClick: () => this.setState({ deletingEntities: true })
      }),
      deletingEntities && h(EntityDeleter, {
        onDismiss: () => this.setState({ deletingEntities: false }),
        onSuccess: () => {
          this.setState({ deletingEntities: false, selectedEntities: {}, refreshKey: refreshKey + 1 })
          loadMetadata()
        },
        namespace, name,
        selectedEntities: _.keys(selectedEntities), selectedDataType: entityKey, runningSubmissionsCount
      }),
      copyingEntities && h(ExportDataModal, {
        onDismiss: () => this.setState({ copyingEntities: false }),
        workspace,
        selectedEntities: _.keys(selectedEntities), selectedDataType: entityKey, runningSubmissionsCount
      }),
      showIgvSelector && h(IGVFileSelector, {
        onDismiss: () => this.setState({ showIgvSelector: false }),
        onSuccess: selectedFiles => this.setState({ showIgvSelector: false, igvFiles: selectedFiles }),
        selectedEntities
      })
    ])
  }
}

const DeleteObjectModal = ajaxCaller(class DeleteObjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = { deleting: false }
  }

  delete = _.flow(
    withErrorReporting('Error deleting object'),
    Utils.withBusyState(v => this.setState({ deleting: v }))
  )(async () => {
    const { name, workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets }, onSuccess } = this.props
    await Buckets.delete(namespace, bucketName, name)
    onSuccess()
  })

  render() {
    const { onDismiss } = this.props
    const { deleting } = this.state
    return h(Modal, {
      onDismiss,
      okButton: () => this.delete(),
      title: 'Delete this file?'
    }, [
      'Are you sure you want to delete this file from the Google bucket?',
      deleting && spinnerOverlay
    ])
  }
})

const BucketContent = ajaxCaller(class BucketContent extends Component {
  constructor(props) {
    super(props)
    const { prefix = '', objects } = props.firstRender ? StateHistory.get() : {}
    this.state = {
      prefix,
      objects,
      deletingName: undefined,
      viewingName: undefined
    }
    this.uploader = createRef()
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.refreshKey !== this.props.refreshKey) {
      this.load('')
    }
    StateHistory.update(_.pick(['objects', 'prefix'], this.state))
  }

  load = _.flow(
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async (prefix = this.state.prefix) => {
    const { workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets } } = this.props
    const { items, prefixes } = await Buckets.list(namespace, bucketName, prefix)
    this.setState({ objects: items, prefixes, prefix })
  })

  uploadFiles = _.flow(
    withErrorReporting('Error uploading file'),
    Utils.withBusyState(v => this.setState({ uploading: v }))
  )(async files => {
    const { workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets } } = this.props
    const { prefix } = this.state
    await Buckets.upload(namespace, bucketName, prefix, files[0])
    this.load()
  })

  render() {
    const { workspace, workspace: { workspace: { namespace, bucketName } } } = this.props
    const { prefix, prefixes, objects, loading, uploading, deletingName, viewingName } = this.state
    const prefixParts = _.dropRight(1, prefix.split('/'))
    return h(Fragment, [
      h(Dropzone, {
        disabled: !!Utils.editWorkspaceError(workspace),
        disableClick: true,
        style: { flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.dark(0.55)}`, padding: '1rem' },
        activeStyle: { backgroundColor: colors.primary(0.2), cursor: 'copy' },
        ref: this.uploader,
        onDropAccepted: files => this.uploadFiles(files)
      }, [
        div([
          _.map(({ label, target }) => {
            return h(Fragment, { key: target }, [
              linkButton({ onClick: () => this.load(target) }, [label]),
              ' / '
            ])
          }, [
            { label: 'Files', target: '' },
            ..._.map(n => {
              return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
            }, _.range(0, prefixParts.length))
          ])
        ]),
        div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.dark(0.25)}` } }),
        h(SimpleTable, {
          columns: [
            { size: { basis: 24, grow: 0 }, key: 'button' },
            { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' },
            { header: h(HeaderCell, ['Size']), size: { basis: 200, grow: 0 }, key: 'size' },
            { header: h(HeaderCell, ['Last modified']), size: { basis: 200, grow: 0 }, key: 'updated' }
          ],
          rows: [
            ..._.map(p => {
              return {
                name: h(TextCell, [
                  linkButton({ onClick: () => this.load(p) }, [p.slice(prefix.length)])
                ])
              }
            }, prefixes),
            ..._.map(({ name, size, updated }) => {
              return {
                button: linkButton({
                  style: { display: 'flex' }, onClick: () => this.setState({ deletingName: name }),
                  tooltip: 'Delete file'
                }, [
                  icon('trash', { size: 16, className: 'hover-only' })
                ]),
                name: h(TextCell, [
                  linkButton({ onClick: () => this.setState({ viewingName: name }) }, [
                    name.slice(prefix.length)
                  ])
                ]),
                size: filesize(size, { round: 0 }),
                updated: Utils.makePrettyDate(updated)
              }
            }, objects)
          ]
        }),
        deletingName && h(DeleteObjectModal, {
          workspace, name: deletingName,
          onDismiss: () => this.setState({ deletingName: undefined }),
          onSuccess: () => {
            this.setState({ deletingName: undefined })
            this.load()
          }
        }),
        viewingName && h(UriViewer, {
          googleProject: namespace, uri: `gs://${bucketName}/${viewingName}`,
          onDismiss: () => this.setState({ viewingName: undefined })
        }),
        !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
          label: 'UPLOAD',
          iconShape: 'plus',
          bottom: 50,
          right: 50,
          onClick: () => this.uploader.current.open()
        })
      ]),
      (loading || uploading) && spinnerOverlay
    ])
  }
})

const WorkspaceData = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Data', activeTab: 'data'
  }),
  ajaxCaller
)(class WorkspaceData extends Component {
  constructor(props) {
    super(props)
    const { selectedDataType, entityMetadata } = StateHistory.get()
    this.state = {
      firstRender: true,
      refreshKey: 0,
      selectedDataType,
      entityMetadata,
      importingReference: false,
      deletingReference: undefined
    }
  }

  loadMetadata = withErrorReporting('Error loading workspace entity data', async () => {
    const { namespace, name, ajax: { Workspaces } } = this.props
    const { selectedDataType } = this.state
    const entityMetadata = await Workspaces.workspace(namespace, name).entityMetadata()
    this.setState({
      selectedDataType: this.selectionType() === 'entities' && !entityMetadata[selectedDataType] ? undefined : selectedDataType,
      entityMetadata
    })
  })

  async componentDidMount() {
    this.loadMetadata()
    this.setState({ firstRender: false })
  }

  refresh() {
    this.setState(({ refreshKey }) => ({ refreshKey: refreshKey + 1 }))
  }

  selectionType() {
    const { workspace: { workspace: { attributes } } } = this.props
    const { selectedDataType } = this.state
    const referenceData = getReferenceData(attributes)
    return Utils.cond(
      [!selectedDataType, () => 'none'],
      [selectedDataType === localVariables, () => 'localVariables'],
      [selectedDataType === bucketObjects, () => 'bucketObjects'],
      [_.includes(selectedDataType, _.keys(referenceData)), () => 'referenceData'],
      () => 'entities'
    )
  }

  render() {
    const { namespace, name, workspace, workspace: { workspace: { attributes } }, loadingWorkspace, refreshWorkspace } = this.props
    const { selectedDataType, entityMetadata, importingReference, deletingReference, firstRender, refreshKey, uploadingFile } = this.state
    const referenceData = getReferenceData(attributes)

    return div({ style: styles.tableContainer }, [
      !entityMetadata ? spinnerOverlay : h(Fragment, [
        div({ style: styles.dataTypeSelectionPanel }, [
          div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
            div({ style: styles.dataTypeHeading }, 'Tables'),
            linkButton({
              disabled: !!Utils.editWorkspaceError(workspace),
              tooltip: Utils.editWorkspaceError(workspace) || 'Upload .tsv',
              onClick: () => this.setState({ uploadingFile: true })
            }, [icon('plus-circle')])
          ]),
          _.map(([type, typeDetails]) => {
            return h(DataTypeButton, {
              key: type,
              selected: selectedDataType === type,
              onClick: () => {
                this.setState({ selectedDataType: type, refreshKey: refreshKey + 1 })
              }
            }, [`${type} (${typeDetails.count})`])
          }, _.toPairs(entityMetadata)),
          div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' } }, [
            div({ style: styles.dataTypeHeading }, 'Reference Data'),
            linkButton({
              disabled: !!Utils.editWorkspaceError(workspace),
              tooltip: Utils.editWorkspaceError(workspace) || 'Add reference data',
              onClick: () => this.setState({ importingReference: true })
            }, [icon('plus-circle')])
          ]),
          importingReference && h(ReferenceDataImporter, {
            onDismiss: () => this.setState({ importingReference: false }),
            onSuccess: () => this.setState({ importingReference: false }, refreshWorkspace),
            namespace, name
          }),
          deletingReference && h(ReferenceDataDeleter, {
            onDismiss: () => this.setState({ deletingReference: false }),
            onSuccess: () => this.setState({
              deletingReference: false,
              selectedDataType: selectedDataType === deletingReference ? undefined : selectedDataType
            }, refreshWorkspace),
            namespace, name, referenceDataType: deletingReference
          }),
          uploadingFile && h(EntityUploader, {
            onDismiss: () => this.setState({ uploadingFile: false }),
            onSuccess: () => this.setState({ uploadingFile: false }, () => {
              this.loadMetadata()
              this.refresh()
            }),
            namespace, name,
            entityTypes: _.keys(entityMetadata)
          }),
          _.map(type => {
            return h(DataTypeButton, {
              key: type,
              selected: selectedDataType === type,
              onClick: () => {
                this.setState({ selectedDataType: type })
                refreshWorkspace()
              }
            }, [
              div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
                type,
                linkButton({
                  disabled: !!Utils.editWorkspaceError(workspace),
                  tooltip: Utils.editWorkspaceError(workspace) || `Delete ${type}`,
                  onClick: e => {
                    e.stopPropagation()
                    this.setState({ deletingReference: type })
                  }
                }, [
                  icon('minus-circle', {
                    size: 16,
                    style: { color: colors.primary() }
                  })
                ])
              ])
            ])
          }, _.keys(referenceData)),
          div({ style: { ...styles.dataTypeHeading, marginTop: '1rem' } }, 'Other Data'),
          h(DataTypeButton, {
            selected: selectedDataType === localVariables,
            onClick: () => {
              this.setState({ selectedDataType: localVariables })
              refreshWorkspace()
            }
          }, ['Workspace Data']),
          h(DataTypeButton, {
            iconName: 'folder', iconSize: 18,
            selected: selectedDataType === bucketObjects,
            onClick: () => {
              this.setState({ selectedDataType: bucketObjects, refreshKey: refreshKey + 1 })
            }
          }, ['Files'])
        ]),
        div({ style: styles.tableViewPanel }, [
          Utils.switchCase(this.selectionType(),
            ['none', () => div({ style: { textAlign: 'center' } }, ['Select a data type'])],
            ['localVariables', () => h(LocalVariablesContent, {
              workspace,
              refreshWorkspace,
              loadingWorkspace,
              firstRender
            })],
            ['referenceData', () => h(ReferenceDataContent, {
              key: selectedDataType,
              workspace,
              loadingWorkspace,
              referenceKey: selectedDataType,
              firstRender
            })],
            ['bucketObjects', () => h(BucketContent, {
              workspace,
              firstRender, refreshKey
            })],
            ['entities', () => h(EntitiesContent, {
              key: selectedDataType,
              workspace,
              entityMetadata,
              entityKey: selectedDataType,
              loadMetadata: () => this.loadMetadata(),
              firstRender, refreshKey
            })]
          )
        ])
      ])
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['entityMetadata', 'selectedDataType'], this.state))
  }
})

export const navPaths = [
  {
    name: 'workspace-data',
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData,
    title: ({ name }) => `${name} - Data`
  }
]
