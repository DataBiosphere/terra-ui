import _ from 'lodash/fp'
import { Component, createRef, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { Checkbox, Clickable, Link, MenuButton, RadioButton, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ConfirmedSearchInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { ColumnSelector, GridTable, HeaderCell, paginator, Resizable, Sortable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { EditDataLink, EntityEditor, EntityRenamer, renderDataCell } from 'src/libs/data-utils'
import { reportError } from 'src/libs/error'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const filterState = state => _.pick(['pageNumber', 'itemsPerPage', 'sort', 'activeTextFilter'], state)

const entityMap = entities => {
  return _.fromPairs(_.map(e => [e.name, e], entities))
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

const makePersistenceId = ({ workspaceId: { namespace, name }, entityType }) => `${namespace}/${name}/${entityType}`

export default Utils.withCancellationSignal(class DataTable extends Component {
  constructor(props) {
    super(props)

    const { columnDefaults: columnDefaultsString, entityType, entityMetadata } = props

    const columnDefaults = Utils.maybeParseJSON(columnDefaultsString)

    const convertColumnDefaults = ({ shown = [], hidden = [] }) => [
      ..._.map(name => ({ name, visible: true }), shown),
      ..._.map(name => ({ name, visible: false }), hidden),
      ..._.map(name => ({ name, visible: true }), _.without([...shown, ...hidden], entityMetadata[entityType].attributeNames))
    ]

    const columnDefaultState = columnDefaults && columnDefaults[entityType] ? convertColumnDefaults(columnDefaults[entityType]) : []

    const {
      entities,
      filteredCount = 0, totalRowCount = 0, itemsPerPage = 25, pageNumber = 1,
      sort = { field: 'name', direction: 'asc' },
      activeTextFilter = '',
      columnWidths = {}, columnState = columnDefaultState
    } = { ...getLocalPref(makePersistenceId(props)), ...(props.firstRender ? StateHistory.get() : {}) }

    this.table = createRef()
    this.state = {
      loading: false,
      viewData: undefined,
      entities, filteredCount, totalRowCount, itemsPerPage, pageNumber, sort, activeTextFilter, columnWidths, columnState
    }
  }

  render() {
    const {
      entityType, entityMetadata, workspaceId, workspaceId: { namespace },
      onScroll, initialX, initialY,
      selectionModel,
      childrenBefore,
      editable
    } = this.props

    const {
      loading, entities, filteredCount, totalRowCount, itemsPerPage, pageNumber, sort, columnWidths, columnState,
      viewData, activeTextFilter, renamingEntity, updatingEntity
    } = this.state

    const theseColumnWidths = columnWidths || {}
    const columnSettings = applyColumnSettings(columnState || [], entityMetadata[entityType].attributeNames)
    const nameWidth = theseColumnWidths['name'] || 150

    const resetScroll = () => this.table.current.scrollToTop()

    return h(Fragment, [
      !!entities && h(Fragment, [
        div({ style: { display: 'flex', marginBottom: '1rem' } }, [
          childrenBefore && childrenBefore({ entities, columnSettings }),
          div({ style: { flexGrow: 1 } }),
          div({ style: { width: 300 } }, [
            h(ConfirmedSearchInput, {
              'aria-label': 'Search',
              placeholder: 'Search',
              onChange: v => this.setState({ activeTextFilter: v, pageNumber: 1 }),
              defaultValue: activeTextFilter
            })
          ])
        ]),
        div({
          style: { flex: 1 },
          ...(selectionModel && selectionModel.type === 'single' ? { role: 'radiogroup', 'aria-label': 'Select entities' } : {})
        }, [
          h(AutoSizer, [
            ({ width, height }) => {
              return h(GridTable, {
                ref: this.table,
                width, height,
                rowCount: entities.length,
                onScroll,
                initialX,
                initialY,
                columns: [
                  ...(selectionModel ? [{
                    width: 70,
                    headerRenderer: selectionModel.type === 'multiple' ? () => {
                      return h(Fragment, [
                        h(Checkbox, {
                          checked: this.pageSelected(),
                          disabled: !entities.length,
                          onChange: () => this.pageSelected() ? this.deselectPage() : this.selectPage()
                        }),
                        h(PopupTrigger, {
                          closeOnClick: true,
                          content: h(Fragment, [
                            h(MenuButton, { onClick: () => this.selectPage() }, ['Page']),
                            h(MenuButton, { onClick: () => this.selectAll() }, [`All (${totalRowCount})`]),
                            h(MenuButton, { onClick: () => this.selectNone() }, ['None'])
                          ]),
                          side: 'bottom'
                        }, [
                          h(Clickable, { 'aria-label': '"Select All" options' }, [icon('caretDown')])
                        ])
                      ])
                    } : () => div(),
                    cellRenderer: ({ rowIndex }) => {
                      const thisEntity = entities[rowIndex]
                      const { name } = thisEntity
                      const { type } = selectionModel

                      if (type === 'multiple') {
                        const { selected, setSelected } = selectionModel
                        const checked = _.has([name], selected)
                        return h(Checkbox, {
                          'aria-label': name,
                          checked,
                          onChange: () => setSelected((checked ? _.unset([name]) : _.set([name], thisEntity))(selected))
                        })
                      } else if (type === 'single') {
                        const { selected, setSelected } = selectionModel
                        return h(RadioButton, {
                          'aria-label': name,
                          name: 'entity-selection',
                          checked: _.isEqual(selected, thisEntity),
                          onChange: () => setSelected(thisEntity)
                        })
                      }
                    }
                  }] : []),
                  {
                    width: nameWidth,
                    headerRenderer: () => h(Resizable, {
                      width: nameWidth, onWidthChange: delta => {
                        this.setState({ columnWidths: _.set('name', nameWidth + delta, columnWidths) },
                          () => this.table.current.recomputeColumnSizes())
                      }
                    }, [
                      h(Sortable, { sort, field: 'name', onSort: v => this.setState({ sort: v }) }, [
                        h(HeaderCell, [`${entityType}_id`])
                      ])
                    ]),
                    cellRenderer: ({ rowIndex }) => {
                      const { name: entityName } = entities[rowIndex]
                      return h(Fragment, [
                        renderDataCell(entityName, namespace),
                        div({ style: { flexGrow: 1 } }),
                        editable && h(EditDataLink, {
                          'aria-label': 'Rename entity',
                          onClick: () => this.setState({ renamingEntity: entityName })
                        })
                      ])
                    }
                  },
                  ..._.map(({ name }) => {
                    const thisWidth = theseColumnWidths[name] || 300
                    return {
                      width: thisWidth,
                      headerRenderer: () => h(Resizable, {
                        width: thisWidth, onWidthChange: delta => {
                          this.setState({ columnWidths: _.set(name, thisWidth + delta, columnWidths) },
                            () => this.table.current.recomputeColumnSizes())
                        }
                      }, [
                        h(Sortable, { sort, field: name, onSort: v => this.setState({ sort: v }) }, [
                          h(HeaderCell, [name])
                        ])
                      ]),
                      cellRenderer: ({ rowIndex }) => {
                        const { attributes: { [name]: dataInfo }, name: entityName } = entities[rowIndex]
                        const dataCell = renderDataCell(Utils.entityAttributeText(dataInfo), namespace)
                        return h(Fragment, [
                          (!!dataInfo && _.isArray(dataInfo.items)) ?
                            h(Link, {
                              style: Style.noWrapEllipsis,
                              onClick: () => this.setState({ viewData: dataInfo })
                            }, [dataCell]) : dataCell,
                          div({ style: { flexGrow: 1 } }),
                          editable && h(EditDataLink, {
                            'aria-label': `Edit attribute ${name} of ${entityType} ${entityName}`,
                            onClick: () => this.setState({ updatingEntity: { entityName, attributeName: name, attributeValue: dataInfo } })
                          })
                        ])
                      }
                    }
                  }, _.filter('visible', columnSettings))
                ],
                styleCell: ({ rowIndex }) => {
                  return rowIndex % 2 && { backgroundColor: colors.light(0.2) }
                }
              })
            }
          ]),
          h(ColumnSelector, {
            columnSettings,
            onSave: v => this.setState(_.set(['columnState'], v), () => {
              this.table.current.recomputeColumnSizes()
            })
          })
        ]),
        div({ style: { flex: 'none', marginTop: '1rem' } }, [
          paginator({
            filteredDataLength: filteredCount,
            unfilteredDataLength: totalRowCount,
            pageNumber,
            setPageNumber: v => this.setState({ pageNumber: v }, resetScroll),
            itemsPerPage,
            setItemsPerPage: v => this.setState({ itemsPerPage: v, pageNumber: 1 }, resetScroll)
          })
        ])
      ]),
      !!viewData && h(Modal, {
        title: 'Contents',
        showButtons: false,
        showX: true,
        onDismiss: () => this.setState({ viewData: undefined })
      }, [div({ style: { maxHeight: '80vh', overflowY: 'auto' } }, [this.displayData(viewData)])]),
      renamingEntity !== undefined && h(EntityRenamer, {
        entityType, entityName: renamingEntity,
        workspaceId,
        onSuccess: () => {
          this.setState({ renamingEntity: undefined })
          this.loadData()
        },
        onDismiss: () => this.setState({ renamingEntity: undefined })
      }),
      !!updatingEntity && h(EntityEditor, {
        entityType, ...updatingEntity,
        entityTypes: _.keys(entityMetadata),
        workspaceId,
        onSuccess: () => {
          this.setState({ updatingEntity: undefined })
          this.loadData()
        },
        onDismiss: () => this.setState({ updatingEntity: undefined })
      }),
      loading && spinnerOverlay
    ])
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(filterState(prevState), filterState(this.state)) || this.props.refreshKey !== prevProps.refreshKey) {
      this.loadData()
    }
    if (this.props.persist) {
      StateHistory.update(_.pick(['itemsPerPage', 'pageNumber', 'sort', 'activeTextFilter'], this.state))
      setLocalPref(makePersistenceId(this.props), _.pick(['columnWidths', 'columnState'], this.state))
    }
  }

  async loadData() {
    const {
      entityType, workspaceId: { namespace, name },
      signal
    } = this.props

    const { pageNumber, itemsPerPage, sort, activeTextFilter } = this.state

    try {
      this.setState({ loading: true })
      const { results, resultMetadata: { filteredCount, unfilteredCount } } = await Ajax(signal).Workspaces.workspace(namespace, name)
        .paginatedEntitiesOfType(entityType, {
          page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction, filterTerms: activeTextFilter
        })
      this.setState({ entities: results, filteredCount, totalRowCount: unfilteredCount })
    } catch (error) {
      reportError('Error loading entities', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  async selectAll() {
    const { entityType, workspaceId: { namespace, name }, signal, selectionModel: { setSelected } } = this.props
    try {
      this.setState({ loading: true })
      const results = await Ajax(signal).Workspaces.workspace(namespace, name).entitiesOfType(entityType)
      setSelected(entityMap(results))
    } catch (error) {
      reportError('Error loading entities', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  selectPage() {
    const { selectionModel: { selected, setSelected } } = this.props
    const { entities } = this.state
    setSelected(_.assign(selected, entityMap(entities)))
  }

  deselectPage() {
    const { selectionModel: { selected, setSelected } } = this.props
    const { entities } = this.state
    setSelected(_.omit(_.map(({ name }) => [name], entities), selected))
  }

  selectNone() {
    const { selectionModel: { setSelected } } = this.props
    setSelected({})
  }

  pageSelected() {
    const { selectionModel: { selected } } = this.props
    const { entities } = this.state
    const entityKeys = _.map('name', entities)
    const selectedKeys = _.keys(selected)
    return entities.length && _.every(k => _.includes(k, selectedKeys), entityKeys)
  }

  displayData(selectedData) {
    const { itemsType, items } = selectedData
    return !!items.length ?
      h(Fragment,
        _.map(([i, entity]) => div({
          style: { borderBottom: (i !== items.length - 1) ? `1px solid ${colors.dark(0.7)}` : undefined, padding: '0.5rem' }
        }, [
          itemsType === 'EntityReference' ? `${entity.entityName} (${entity.entityType})` : JSON.stringify(entity)
        ]), Utils.toIndexPairs(items))) :
      div({ style: { padding: '0.5rem', fontStyle: 'italic' } }, ['No items'])
  }
})
