import clipboard from 'clipboard-polyfill'
import FileSaver from 'file-saver'
import filesize from 'filesize'
import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { div, form, h, input } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, Checkbox, Clickable, linkButton, MenuButton, Select, spinnerOverlay } from 'src/components/common'
import FloatingActionButton from 'src/components/FloatingActionButton'
import { icon, spinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { ColumnSelector, FlexTable, GridTable, HeaderCell, paginator, Resizable, SimpleTable, Sortable, TextCell } from 'src/components/table'
import UriViewer from 'src/components/UriViewer'
import { ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withConfig } from 'src/libs/config'
import { EntityDeleter, EntityUploader, ReferenceDataDeleter, ReferenceDataImporter, renderDataCell } from 'src/libs/data-utils'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import ExportDataModal from 'src/components/ExportDataModal'


const filterState = (props, state) => ({ ..._.pick(['pageNumber', 'itemsPerPage', 'sort'], state), ..._.pick(['refreshKey'], props) })

const localVariables = 'localVariables'
const bucketObjects = '__bucket_objects__'

const initialSort = { field: 'name', direction: 'asc' }

const styles = {
  tableContainer: {
    display: 'flex', flex: 1
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 200, backgroundColor: 'white', padding: '1rem'
  },
  tableViewPanel: {
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem', width: '100%',
    flex: 1, display: 'flex', flexDirection: 'column'
  },
  dataTypeHeading: {
    fontWeight: 500, color: colors.darkBlue[0]
  }
}

const DataTypeButton = ({ selected, children, iconName = 'listAlt', iconSize = 14, ...props }) => {
  return linkButton({
    style: { display: 'flex', alignItems: 'center', fontWeight: selected ? 500 : undefined, padding: '0.5rem 0' },
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

const applyColumnSettings = (columnSettings, columns) => {
  const lookup = _.flow(
    Utils.toIndexPairs,
    _.map(([i, v]) => ({ ...v, index: i })),
    _.keyBy('name')
  )(columnSettings)
  return _.flow(
    _.map(name => lookup[name] || { name, visible: true, index: -1 }),
    _.sortBy('index'),
    _.map(_.omit('index'))
  )(columns)
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

const entityMap = entities => {
  return _.fromPairs(_.map(e => [e.name, e], entities))
}

const LocalVariablesContent = ajaxCaller(class LocalVariablesContent extends Component {
  render() {
    const { workspace: { accessLevel, workspace: { namespace, name, attributes } }, ajax: { Workspaces }, refreshWorkspace, loadingWorkspace, firstRender } = this.props
    const { editIndex, deleteIndex, editKey, editValue, editType } = this.state
    const canEdit = Utils.canWrite(accessLevel)
    const stopEditing = () => this.setState({ editIndex: undefined, editKey: undefined, editValue: undefined, editType: undefined })
    const filteredAttributes = _.flow(
      _.toPairs,
      _.remove(([key]) => key === 'description' || key.includes(':') || key.startsWith('referenceData-')),
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

    const saveAttribute = async originalKey => {
      try {
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
      } catch (e) {
        reportError('Error saving change to workspace variables', e)
      }
    }

    const { initialY } = firstRender ? StateHistory.get() : {}
    return h(Fragment, [
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
                    textInput({
                      autoFocus: true,
                      value: editKey,
                      onChange: e => this.setState({ editKey: e.target.value })
                    }) :
                    renderDataCell(amendedAttributes[rowIndex][0], namespace)
                },
                {
                  size: { grow: 1 },
                  headerRenderer: () => h(HeaderCell, ['Value']),
                  cellRenderer: ({ rowIndex }) => {
                    const originalKey = amendedAttributes[rowIndex][0]
                    const originalValue = amendedAttributes[rowIndex][1]

                    return h(Fragment, [
                      div({ style: { flex: 1, minWidth: 0, display: 'flex' } }, [
                        editIndex === rowIndex ?
                          textInput({
                            value: editValue,
                            onChange: e => this.setState({ editValue: e.target.value })
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
                            disabled: !canEdit,
                            tooltip: canEdit ? 'Edit variable' : 'You do not have access to modify data in this workspace.',
                            style: { marginLeft: '1rem' },
                            onClick: () => this.setState({
                              editIndex: rowIndex,
                              editValue: typeof originalValue === 'object' ? originalValue.items.join(', ') : originalValue,
                              editKey: originalKey,
                              editType: typeof originalValue === 'object' ? `${typeof originalValue.items[0]} list` : typeof originalValue
                            })
                          }, [icon('pencil', { size: 19 })]),
                          linkButton({
                            disabled: !canEdit,
                            tooltip: canEdit ? 'Delete variable' : 'You do not have access to modify data in this workspace.',
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
      !creatingNewVariable && canEdit && h(FloatingActionButton, {
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
          onClick: async () => {
            try {
              this.setState({ deleteIndex: undefined, saving: true })
              await Workspaces.workspace(namespace, name).deleteAttributes([amendedAttributes[deleteIndex][0]])
              refreshWorkspace()
            } catch (e) {
              reportError('Error deleting workspace variable', e)
            } finally {
              this.setState({ saving: false })
            }
          }
        },
        'Delete Variable')
      }, ['This will permanently delete the data from Workspace Data.']),
      loadingWorkspace && spinnerOverlay
    ])
  }
})

const ReferenceDataContent = ({ workspace: { workspace: { namespace, attributes } }, referenceKey, loadingWorkspace, firstRender }) => {
  const selectedData = _.sortBy('key', getReferenceData(attributes)[referenceKey])
  const { initialY } = firstRender ? StateHistory.get() : {}
  return h(Fragment, [
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

const EntitiesContent = _.flow(
  ajaxCaller,
  withConfig()
)(class EntitiesContent extends Component {
  constructor(props) {
    super(props)
    const { entities, totalRowCount = 0, itemsPerPage = 25, pageNumber = 1, sort = initialSort, columnWidths = {}, columnState = {} } = props.firstRender ? StateHistory.get() : {}
    this.state = {
      entities,
      itemsPerPage,
      pageNumber,
      sort,
      loading: false,
      columnWidths,
      columnState,
      selectedEntities: {},
      deletingEntities: false,
      totalRowCount
    }
    this.table = createRef()
    this.downloadForm = createRef()
  }

  async componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(filterState(prevProps, prevState), filterState(this.props, this.state))) {
      this.loadData()
    }
    StateHistory.update(_.pick(['entities', 'totalRowCount', 'itemsPerPage', 'pageNumber', 'sort', 'columnWidths', 'columnState'], this.state))
  }

  async loadData() {
    const { entityKey, workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    const { pageNumber, itemsPerPage, sort } = this.state
    try {
      this.setState({ loading: true })
      const { results, resultMetadata: { unfilteredCount } } = await Workspaces.workspace(namespace, name)
        .paginatedEntitiesOfType(entityKey, {
          page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction
        })
      this.setState({ entities: results, totalRowCount: unfilteredCount })
    } catch (error) {
      reportError('Error loading entities', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  async selectAll() {
    const { entityKey, workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    try {
      this.setState({ loading: true })
      const results = await Workspaces.workspace(namespace, name).entitiesOfType(entityKey)
      this.setState({ selectedEntities: entityMap(results) })
    } catch (error) {
      reportError('Error loading entities', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  selectPage() {
    const { entities, selectedEntities } = this.state
    this.setState({ selectedEntities: _.assign(selectedEntities, entityMap(entities)) })
  }

  deselectPage() {
    const { entities, selectedEntities } = this.state
    this.setState({ selectedEntities: _.omit(_.map(a => [a], _.keys(entities)), selectedEntities) })
  }

  selectNone() {
    this.setState({ selectedEntities: {} })
  }

  renderDownloadButton(columnSettings) {
    const { workspace: { workspace: { namespace, name } }, entityKey, config: { orchestrationUrlRoot } } = this.props
    const { selectedEntities } = this.state
    return h(Fragment, [
      form({
        ref: this.downloadForm,
        action: `${orchestrationUrlRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${entityKey}/tsv`,
        method: 'POST'
      }, [
        input({ type: 'hidden', name: 'FCtoken', value: getUser().token }),
        input({ type: 'hidden', name: 'attributeNames', value: _.map('name', _.filter('visible', columnSettings)).join(',') }),
        input({ type: 'hidden', name: 'model', value: 'flexible' })
      ]),
      _.isEmpty(selectedEntities) ? buttonPrimary({
        disabled: !orchestrationUrlRoot,
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

  renderCopyButton(columnSettings) {
    const { entities, copying, copied } = this.state

    return h(Fragment, [
      buttonPrimary({
        style: { margin: '0 1rem' },
        tooltip: 'Copy only the current page to the clipboard',
        onClick: async () => {
          const str = this.buildTSV(columnSettings, entities)
          try {
            this.setState({ copying: true })
            await clipboard.writeText(str)
            this.setState({ copying: false, copied: true })
          } catch (error) {
            reportError('Error copying to clipboard', error)
          }
        }
      }, [
        icon('copy-to-clipboard', { style: { marginRight: '0.5rem' } }),
        'Copy to Clipboard'
      ]),
      copying && spinner(),
      copied && 'Done!'
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

  pageSelected() {
    const { entities, selectedEntities } = this.state
    const entityKeys = _.map('name', entities)
    const selectedKeys = _.keys(selectedEntities)
    return _.every(k => _.includes(k, selectedKeys), entityKeys)
  }

  render() {
    const { workspace, workspace: { accessLevel, workspace: { namespace, name }, workspaceSubmissionStats: { runningSubmissionsCount } }, entityKey, entityMetadata, loadMetadata, firstRender } = this.props
    const { entities, totalRowCount, pageNumber, itemsPerPage, sort, columnWidths, columnState, selectedEntities, deletingEntities, loading, copyingEntities } = this.state
    const theseColumnWidths = columnWidths[entityKey] || {}
    const columnSettings = applyColumnSettings(columnState[entityKey] || [], entityMetadata[entityKey].attributeNames)
    const resetScroll = () => this.table.current.scrollToTop()
    const nameWidth = theseColumnWidths['name'] || 150
    const { initialX, initialY } = firstRender ? StateHistory.get() : {}
    return h(Fragment, [
      !!entities && h(Fragment, [
        div({ style: { flex: 'none', marginBottom: '1rem' } }, [
          this.renderDownloadButton(columnSettings),
          this.renderCopyButton(columnSettings)
        ]),
        div({ style: { flex: 1 } }, [
          h(AutoSizer, [
            ({ width, height }) => {
              return h(GridTable, {
                ref: this.table,
                width, height,
                rowCount: entities.length,
                onScroll: saveScroll,
                initialX,
                initialY,
                columns: [
                  ...(Utils.canWrite(accessLevel) ? [{
                    width: 70,
                    headerRenderer: () => {
                      return h(Fragment, [
                        h(Checkbox, {
                          checked: this.pageSelected(),
                          onChange: () => this.pageSelected() ? this.deselectPage() : this.selectPage()
                        }),
                        h(PopupTrigger, {
                          closeOnClick: true,
                          content: h(Fragment, [
                            h(MenuButton, { onClick: () => this.selectPage() }, ['Page']),
                            h(MenuButton, { onClick: () => this.selectAll() }, [`All (${totalRowCount})`]),
                            h(MenuButton, { onClick: () => this.selectNone() }, ['None'])
                          ]),
                          position: 'bottom'
                        }, [
                          h(Clickable, [icon('caretDown')])
                        ])
                      ])
                    },
                    cellRenderer: ({ rowIndex }) => {
                      const { name } = entities[rowIndex]
                      const checked = _.has([name], selectedEntities)
                      return h(Checkbox, {
                        checked,
                        onChange: () => this.setState({ selectedEntities: (checked ? _.unset([name]) : _.set([name], entities[rowIndex]))(selectedEntities) })
                      })
                    }
                  }] : []),
                  {
                    width: nameWidth,
                    headerRenderer: () => h(Resizable, {
                      width: nameWidth, onWidthChange: delta => {
                        this.setState({ columnWidths: _.set(`${entityKey}.name`, nameWidth + delta, columnWidths) },
                          () => this.table.current.recomputeColumnSizes())
                      }
                    }, [
                      h(Sortable, { sort, field: 'name', onSort: v => this.setState({ sort: v }) }, [
                        h(HeaderCell, [`${entityKey}_id`])
                      ])
                    ]),
                    cellRenderer: ({ rowIndex }) => renderDataCell(entities[rowIndex].name, namespace)
                  },
                  ..._.map(({ name }) => {
                    const thisWidth = theseColumnWidths[name] || 300
                    return {
                      width: thisWidth,
                      headerRenderer: () => h(Resizable, {
                        width: thisWidth, onWidthChange: delta => {
                          this.setState({ columnWidths: _.set(`${entityKey}.${name}`, thisWidth + delta, columnWidths) },
                            () => this.table.current.recomputeColumnSizes())
                        }
                      }, [
                        h(Sortable, { sort, field: name, onSort: v => this.setState({ sort: v }) }, [
                          h(HeaderCell, [name])
                        ])
                      ]),
                      cellRenderer: ({ rowIndex }) => {
                        return renderDataCell(
                          Utils.entityAttributeText(entities[rowIndex].attributes[name]), namespace
                        )
                      }
                    }
                  }, _.filter('visible', columnSettings))
                ]
              })
            }
          ]),
          h(ColumnSelector, {
            columnSettings,
            onSave: v => this.setState(_.set(['columnState', entityKey], v), () => {
              this.table.current.recomputeColumnSizes()
            })
          })
        ]),
        div({ style: { flex: 'none', marginTop: '1rem' } }, [
          paginator({
            filteredDataLength: totalRowCount,
            pageNumber,
            setPageNumber: v => this.setState({ pageNumber: v }, resetScroll),
            itemsPerPage,
            setItemsPerPage: v => this.setState({ itemsPerPage: v, pageNumber: 1 }, resetScroll)
          })
        ])
      ]),
      !_.isEmpty(selectedEntities) && h(FloatingActionButton, {
        label: 'COPY DATA',
        iconShape: 'copy',
        bottom: 100,
        right: 50,
        onClick: () => this.setState({ copyingEntities: true })
      }),
      !_.isEmpty(selectedEntities) && h(FloatingActionButton, {
        label: 'DELETE DATA',
        iconShape: 'trash',
        bottom: 50,
        right: 50,
        onClick: () => this.setState({ deletingEntities: true })
      }),
      deletingEntities && h(EntityDeleter, {
        onDismiss: () => this.setState({ deletingEntities: false }),
        onSuccess: () => {
          this.setState({ deletingEntities: false, selectedEntities: {} })
          this.loadData()
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
      loading && spinnerOverlay
    ])
  }
})

const DeleteObjectModal = ajaxCaller(class DeleteObjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = { deleting: false }
  }

  async delete() {
    const { name, workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets }, onSuccess } = this.props
    try {
      this.setState({ deleting: true })
      await Buckets.delete(namespace, bucketName, name)
      onSuccess()
    } catch (error) {
      reportError('Error deleting object', error)
    } finally {
      this.setState({ deleting: false })
    }
  }

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

  async load(prefix = this.state.prefix) {
    const { workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets } } = this.props
    try {
      this.setState({ loading: true })
      const { items, prefixes } = await Buckets.list(namespace, bucketName, prefix)
      this.setState({ objects: items, prefixes, prefix })
    } catch (error) {
      reportError('Error loading bucket data', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  async uploadFiles(files) {
    const { workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets } } = this.props
    const { prefix } = this.state
    try {
      this.setState({ uploading: true })
      await Buckets.upload(namespace, bucketName, prefix, files[0])
      this.load()
    } catch (error) {
      reportError('Error uploading file', error)
    } finally {
      this.setState({ uploading: false })
    }
  }

  render() {
    const { workspace, workspace: { accessLevel, workspace: { namespace, bucketName } } } = this.props
    const { prefix, prefixes, objects, loading, uploading, deletingName, viewingName } = this.state
    const prefixParts = _.dropRight(1, prefix.split('/'))
    const canEdit = Utils.canWrite(accessLevel)
    return h(Fragment, [
      h(Dropzone, {
        disabled: !canEdit,
        disableClick: true,
        style: { flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.gray[3]}`, padding: '1rem' },
        activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' },
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
        div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.gray[5]}` } }),
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
        canEdit && h(FloatingActionButton, {
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

  async loadMetadata() {
    const { namespace, name, ajax: { Workspaces } } = this.props
    const { selectedDataType } = this.state

    try {
      const entityMetadata = await Workspaces.workspace(namespace, name).entityMetadata()
      this.setState({
        selectedDataType: this.selectionType() === 'entities' && !entityMetadata[selectedDataType] ? undefined : selectedDataType,
        entityMetadata
      })
    } catch (error) {
      reportError('Error loading workspace entity data', error)
    }
  }

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
    const { namespace, name, workspace, workspace: { accessLevel, workspace: { attributes } }, loadingWorkspace, refreshWorkspace } = this.props
    const { selectedDataType, entityMetadata, importingReference, deletingReference, firstRender, refreshKey, uploadingFile } = this.state
    const referenceData = getReferenceData(attributes)
    const canEdit = Utils.canWrite(accessLevel)

    return div({ style: styles.tableContainer }, [
      !entityMetadata ? spinnerOverlay : h(Fragment, [
        div({ style: styles.dataTypeSelectionPanel }, [
          div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
            div({ style: styles.dataTypeHeading }, 'Tables'),
            linkButton({
              disabled: !canEdit,
              tooltip: canEdit ? 'Upload .tsv' : 'You do not have access add data to this workspace.',
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
              disabled: !canEdit,
              tooltip: canEdit ? 'Add reference data' : 'You do not have access add data to this workspace.',
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
                h(Clickable, {
                  tooltip: `Delete ${type}`,
                  onClick: e => {
                    e.stopPropagation()
                    this.setState({ deletingReference: type })
                  }
                }, [icon('minus-circle', { size: 16 })])
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

export const addNavPaths = () => {
  Nav.defPath('workspace-data', {
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData,
    title: ({ name }) => `${name} - Data`
  })
}
