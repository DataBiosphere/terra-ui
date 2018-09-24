import clipboard from 'clipboard-polyfill'
import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import { div, form, h, input } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, Clickable, linkButton, Select, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { ColumnSelector, FlexTable, GridTable, HeaderCell, paginator, Resizable, Sortable } from 'src/components/table'
import { ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Config from 'src/libs/config'
import { ReferenceDataDeleter, ReferenceDataImporter, renderDataCell } from 'src/libs/data-utils'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const filterState = _.pick(['pageNumber', 'itemsPerPage', 'selectedDataType', 'sort'])

const localVariables = 'localVariables'

const initialSort = { field: 'name', direction: 'asc' }

const styles = {
  tableContainer: {
    display: 'flex', flex: 1, marginBottom: '-2rem'
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 200, backgroundColor: 'white', padding: '1rem'
  },
  tableViewPanel: hasSelection => ({
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem', width: '100%',
    textAlign: hasSelection ? undefined : 'center',
    flex: 1, display: 'flex', flexDirection: 'column'
  }),
  dataTypeHeading: {
    fontWeight: 500, color: colors.darkBlue[0]
  }
}

const DataTypeButton = ({ selected, children, ...props }) => {
  return linkButton({
    style: { display: 'flex', alignItems: 'center', fontWeight: selected ? 500 : undefined, padding: '0.5rem 0' },
    ...props
  }, [
    div({ style: { flex: 'none', width: '1.5rem' } }, [
      selected && icon('circle', { size: 14, className: 'is-solid' })
    ]),
    div({ style: { flex: 'none', width: '1.5rem' } }, [
      icon('listAlt', { size: 14 })
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

const WorkspaceData = ajaxCaller(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Data', activeTab: 'data'
},
class WorkspaceDataContent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      itemsPerPage: 25,
      pageNumber: 1,
      sort: initialSort,
      loading: false,
      workspaceAttributes: props.workspace.workspace.attributes,
      columnWidths: {},
      columnState: {},
      ...StateHistory.get()
    }
    this.downloadForm = createRef()
    this.table = createRef()
  }

  async loadMetadata() {
    const { namespace, name, ajax: { Workspaces } } = this.props
    try {
      const entityMetadata = await Workspaces.workspace(namespace, name).entityMetadata()
      this.setState({ entityMetadata })
    } catch (error) {
      reportError('Error loading workspace entity data', error)
    }
  }

  async loadData() {
    const { namespace, name, ajax: { Workspaces } } = this.props
    const { itemsPerPage, pageNumber, sort, selectedDataType, isDataModel } = this.state

    const getWorkspaceAttributes = async () => (await Workspaces.workspace(namespace, name).details()).workspace.attributes

    if (!selectedDataType) {
      this.setState({ workspaceAttributes: await getWorkspaceAttributes() })
    } else {
      try {
        this.setState({ loading: true })

        const [workspaceAttributes, entities] = await Promise.all([
          getWorkspaceAttributes(),
          isDataModel ?
            Workspaces.workspace(namespace, name)
              .paginatedEntitiesOfType(selectedDataType, {
                page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction
              }) :
            undefined
        ])

        this.setState(_.merge(
          isDataModel && { entities: entities.results, totalRowCount: entities.resultMetadata.unfilteredCount },
          { workspaceAttributes }
        ))
      } catch (error) {
        reportError('Error loading workspace data', error)
      } finally {
        this.setState({ loading: false })
      }
    }
  }

  getReferenceData() {
    const { workspaceAttributes } = this.state

    return _.flow(
      _.toPairs,
      _.filter(([key]) => key.startsWith('referenceData-')),
      _.map(([k, value]) => {
        const [, datum, key] = /referenceData-([^-]+)-(.+)/.exec(k)
        return { datum, key, value }
      }),
      _.groupBy('datum')
    )(workspaceAttributes)
  }

  async componentDidMount() {
    this.loadMetadata()
    this.loadData()

    this.setState({ orchestrationRoot: await Config.getOrchestrationUrlRoot() })
  }

  refresh() {
    this.loadMetadata()
    this.loadData()
  }

  render() {
    const { namespace, name, workspace: { accessLevel } } = this.props
    const { selectedDataType, entityMetadata, loading, importingReference, deletingReference } = this.state
    const referenceData = this.getReferenceData()
    const canEdit = Utils.canWrite(accessLevel)

    return div({ style: styles.tableContainer }, [
      !entityMetadata ? spinnerOverlay : h(Fragment, [
        div({ style: styles.dataTypeSelectionPanel }, [
          div({ style: styles.dataTypeHeading }, 'Data Model'),
          _.map(([type, typeDetails]) => {
            return h(DataTypeButton, {
              key: type,
              selected: selectedDataType === type,
              onClick: () => {
                saveScroll(0, 0)
                selectedDataType === type ? this.loadData() :
                  this.setState({ selectedDataType: type, pageNumber: 1, sort: initialSort, entities: undefined, isDataModel: true })
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
          importingReference &&
            h(ReferenceDataImporter, {
              onDismiss: () => this.setState({ importingReference: false }),
              onSuccess: () => this.setState({ importingReference: false }, () => this.loadData()),
              namespace, name
            }),
          deletingReference &&
            h(ReferenceDataDeleter, {
              onDismiss: () => this.setState({ deletingReference: false }),
              onSuccess: () => this.setState({
                deletingReference: false,
                selectedDataType: selectedDataType === deletingReference ? undefined : selectedDataType
              }, () => this.loadData()),
              namespace, name, referenceDataType: deletingReference
            }),
          _.map(type => {
            return h(DataTypeButton, {
              key: type,
              selected: selectedDataType === type,
              onClick: () => {
                saveScroll(0, 0)
                this.setState({ selectedDataType: type, isDataModel: false })
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
              saveScroll(0, 0)
              selectedDataType === localVariables ? this.loadData() :
                this.setState({ selectedDataType: localVariables, isDataModel: false })
            }
          }, ['Local Variables'])
        ]),
        div({ style: styles.tableViewPanel(selectedDataType) }, [
          selectedDataType ? this.renderData() : 'Select a data type.',
          loading && spinnerOverlay
        ])
      ])
    ])
  }

  renderData() {
    const { selectedDataType } = this.state
    const referenceData = this.getReferenceData()

    if (selectedDataType === localVariables) {
      return this.renderLocalVariables()
    } else if (_.keys(referenceData).includes(selectedDataType)) {
      return this.renderReferenceData()
    } else {
      return this.renderEntityTable()
    }
  }

  renderEntityTable() {
    const { namespace } = this.props
    const { entities, selectedDataType, entityMetadata, totalRowCount, pageNumber, itemsPerPage, sort, columnWidths, columnState } = this.state
    const theseColumnWidths = columnWidths[selectedDataType] || {}
    const columnSettings = applyColumnSettings(columnState[selectedDataType] || [], entityMetadata[selectedDataType].attributeNames)
    const resetScroll = () => this.table.current.scrollToTop()
    return entities && h(Fragment, [
      div({ style: { flex: 'none', marginBottom: '1rem' } }, [
        this.renderDownloadButton(),
        this.renderCopyButton()
      ]),
      div({ style: { flex: 1 } }, [
        h(AutoSizer, [
          ({ width, height }) => {
            return h(GridTable, {
              ref: this.table,
              width, height,
              rowCount: entities.length,
              onScroll: saveScroll,
              initialX: StateHistory.get().initialX,
              initialY: StateHistory.get().initialY,
              columns: [
                (() => {
                  const thisWidth = theseColumnWidths['name'] || 150
                  return {
                    width: thisWidth,
                    headerRenderer: () => h(Resizable, {
                      width: thisWidth, onWidthChange: delta => {
                        this.setState({ columnWidths: _.set(`${selectedDataType}.name`, thisWidth + delta, columnWidths) },
                          () => this.table.current.recomputeColumnSizes())
                      }
                    }, [
                      h(Sortable, { sort, field: 'name', onSort: v => this.setState({ sort: v }) }, [
                        h(HeaderCell, [`${selectedDataType}_id`])
                      ])
                    ]),
                    cellRenderer: ({ rowIndex }) => renderDataCell(entities[rowIndex].name, namespace)
                  }
                })(),
                ..._.map(({ name }) => {
                  const thisWidth = theseColumnWidths[name] || 300
                  return {
                    width: thisWidth,
                    headerRenderer: () =>
                      h(Resizable, {
                        width: thisWidth, onWidthChange: delta => {
                          this.setState({ columnWidths: _.set(`${selectedDataType}.${name}`, thisWidth + delta, columnWidths) },
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
          onSave: v => this.setState(_.set(['columnState', selectedDataType], v), () => {
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
    ])
  }

  renderDownloadButton() {
    const { namespace, name } = this.props
    const { selectedDataType, orchestrationRoot } = this.state
    return h(Fragment, [
      form({
        ref: this.downloadForm,
        action: `${orchestrationRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${selectedDataType}/tsv`,
        method: 'POST'
      }, [
        input({ type: 'hidden', name: 'FCtoken', value: getUser().token })
        /*
         * TODO: once column selection is implemented, add another hidden input with name: 'attributeNames' and
         * value: comma-separated list of attribute names to support downloading only the selected columns
         */
      ]),
      buttonPrimary({
        disabled: !orchestrationRoot,
        tooltip: 'Download all data as a file',
        onClick: () => this.downloadForm.current.submit()
      }, [
        icon('download', { style: { marginRight: '0.5rem' } }),
        'Download'
      ])
    ])
  }

  renderCopyButton() {
    const { entities, selectedDataType, entityMetadata, copying, copied } = this.state

    return h(Fragment, [
      buttonPrimary({
        style: { margin: '0 1rem' },
        tooltip: 'Copy only the current page to the clipboard',
        onClick: async () => {
          const attributeNames = entityMetadata[selectedDataType].attributeNames

          const entityToRow = entity =>
            _.join('\t', [
              entity.name, ..._.map(
                attribute => Utils.entityAttributeText(entity.attributes[attribute]),
                attributeNames)
            ])

          const header = _.join('\t', [`${selectedDataType}_id`, ...attributeNames])

          const str = _.join('\n', [header, ..._.map(entityToRow, entities)]) + '\n'

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

  renderLocalVariables() {
    const { namespace, name, workspace: { accessLevel }, ajax: { Workspaces } } = this.props
    const { workspaceAttributes, editIndex, deleteIndex, editKey, editValue, editType, addVariableHover } = this.state
    const canEdit = Utils.canWrite(accessLevel)
    const stopEditing = () => this.setState({ editIndex: undefined, editKey: undefined, editValue: undefined, editType: undefined })
    const filteredAttributes = _.flow(
      _.toPairs,
      _.remove(([key]) => key === 'description' || key.includes(':') || key.startsWith('referenceData-')),
      _.sortBy(_.first)
    )(workspaceAttributes)

    const creatingNewVariable = editIndex === filteredAttributes.length
    const amendedAttributes = [
      ...filteredAttributes, ...(creatingNewVariable ? [['', '']] : [])
    ]

    const inputErrors = editIndex && [
      ...(_.keys(_.unset(amendedAttributes[editIndex][0], workspaceAttributes)).includes(editKey) ? ['Key must be unique'] : []),
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

        this.setState({ loading: true })

        await Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ [editKey]: parsedValue })

        if (editKey !== originalKey) {
          await Workspaces.workspace(namespace, name).deleteAttributes([originalKey])
        }

        await this.loadData()
        stopEditing()
      } catch (e) {
        reportError('Error saving change to workspace variables', e)
      }
    }

    return Utils.cond(
      [!amendedAttributes, () => undefined],
      [_.isEmpty(amendedAttributes), () => 'No Local Variables defined'],
      () => div({ style: { flex: 1 } }, [
        h(AutoSizer, [
          ({ width, height }) => h(FlexTable, {
            width, height, rowCount: amendedAttributes.length,
            onScroll: y => saveScroll(0, y),
            initialY: StateHistory.get().initialY,
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
        ]),
        !creatingNewVariable && canEdit && h(Clickable,
          {
            style: {
              position: 'absolute', bottom: 25, right: 25,
              backgroundColor: colors.blue[0], color: 'white',
              padding: '0.5rem', borderRadius: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: Style.standardShadow
            },
            onMouseEnter: () => this.setState({ addVariableHover: true }),
            onMouseLeave: () => this.setState({ addVariableHover: false }),
            onClick: () => this.setState({
              addVariableHover: false,
              editIndex: filteredAttributes.length,
              editValue: '',
              editKey: '',
              editType: 'string'
            })
          },
          [
            div({
              style: {
                padding: `0 ${addVariableHover ? '0.5rem' : '0'}`, fontWeight: 500,
                maxWidth: addVariableHover ? 200 : 0,
                overflow: 'hidden', whiteSpace: 'pre',
                transition: 'max-width 0.5s ease-out, padding 0.1s linear 0.2s'
              }
            }, ['ADD VARIABLE']),
            icon('plus', { size: 25, style: { stroke: 'white', strokeWidth: 2 } })
          ]),
        deleteIndex && h(Modal, {
          onDismiss: () => this.setState({ deleteIndex: undefined }),
          title: 'Are you sure you wish to delete this variable?',
          okButton: buttonPrimary({
            onClick: async () => {
              try {
                this.setState({ deleteIndex: undefined, loading: true })
                await Workspaces.workspace(namespace, name).deleteAttributes([amendedAttributes[deleteIndex][0]])
              } catch (e) {
                reportError('Error deleting workspace variable', e)
              } finally {
                this.loadData()
              }
            }
          },
          'Delete Variable')
        }, ['This will permanently delete the data from Local Variables.'])
      ])
    )
  }

  renderReferenceData() {
    const { namespace } = this.props
    const { selectedDataType } = this.state
    const selectedData = _.sortBy('key', this.getReferenceData()[selectedDataType])

    return div({ style: { flex: 1 } }, [
      h(AutoSizer, { key: selectedDataType }, [
        ({ width, height }) => h(FlexTable, {
          width, height, rowCount: selectedData.length,
          onScroll: y => saveScroll(0, y),
          initialY: StateHistory.get().initialY,
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
    ])
  }

  componentDidUpdate(prevProps, prevState) {
    StateHistory.update(_.pick(
      [
        'entityMetadata', 'selectedDataType', 'entities', 'workspaceAttributes', 'totalRowCount',
        'itemsPerPage', 'pageNumber', 'sort', 'columnWidths', 'columnState'
      ],
      this.state)
    )

    if (this.state.selectedDataType !== prevState.selectedDataType) {
      this.setState({ copying: false, copied: false })
    }

    if (!_.isEqual(filterState(prevState), filterState(this.state))) {
      this.loadData()
    }
  }
}))

export const addNavPaths = () => {
  Nav.defPath('workspace-data', {
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData,
    title: ({ name }) => `${name} - Data`
  })
}
