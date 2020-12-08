import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { Checkbox, Clickable, Link, MenuButton, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ConfirmedSearchInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { ColumnSelector, GridTable, HeaderCell, paginator, Resizable, Sortable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { EditDataLink, EntityEditor, EntityRenamer, renderDataCell } from 'src/libs/data-utils'
import { withErrorReporting } from 'src/libs/error'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


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

const displayData = ({ itemsType, items }) => {
  return !!items.length ?
    h(Fragment,
      _.map(([i, entity]) => div({
        style: { borderBottom: (i !== items.length - 1) ? `1px solid ${colors.dark(0.7)}` : undefined, padding: '0.5rem' }
      }, [
        itemsType === 'EntityReference' ? `${entity.entityName} (${entity.entityType})` : JSON.stringify(entity)
      ]), Utils.toIndexPairs(items))) :
    div({ style: { padding: '0.5rem', fontStyle: 'italic' } }, ['No items'])
}

const DataTable = props => {
  const {
    entityType, entityMetadata, workspaceId, workspaceId: { namespace, name },
    onScroll, initialX, initialY,
    selectionModel: { selected, setSelected },
    childrenBefore,
    editable,
    persist, refreshKey, firstRender
  } = props

  const persistenceId = `${namespace}/${name}/${entityType}`

  // State
  const [loading, setLoading] = useState(false)

  const [viewData, setViewData] = useState()
  const [entities, setEntities] = useState()
  const [filteredCount, setFilteredCount] = useState(0)
  const [totalRowCount, setTotalRowCount] = useState(0)

  const stateHistory = firstRender ? StateHistory.get() : {}
  const [itemsPerPage, setItemsPerPage] = useState(stateHistory.itemsPerPage || 25)
  const [pageNumber, setPageNumber] = useState(stateHistory.pageNumber || 1)
  const [sort, setSort] = useState(stateHistory.sort || { field: 'name', direction: 'asc' })
  const [activeTextFilter, setActiveTextFilter] = useState(stateHistory.activeTextFilter || '')

  const [columnWidths, setColumnWidths] = useState(() => getLocalPref(persistenceId)?.columnWidths || {})
  const [columnState, setColumnState] = useState(() => {
    const localColumnPref = getLocalPref(persistenceId)?.columnState

    if (!!localColumnPref) {
      return localColumnPref
    }

    const { columnDefaults: columnDefaultsString, entityType, entityMetadata } = props

    const columnDefaults = Utils.maybeParseJSON(columnDefaultsString)

    const convertColumnDefaults = ({ shown = [], hidden = [] }) => [
      ..._.map(name => ({ name, visible: true }), shown),
      ..._.map(name => ({ name, visible: false }), hidden),
      ..._.map(name => ({ name, visible: true }), _.without([...shown, ...hidden], entityMetadata[entityType].attributeNames))
    ]
    return columnDefaults?.[entityType] ? convertColumnDefaults(columnDefaults[entityType]) : []
  })

  const [renamingEntity, setRenamingEntity] = useState()
  const [updatingEntity, setUpdatingEntity] = useState()

  const table = useRef()
  const signal = Utils.useCancellation()

  // Helpers
  const loadData = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const { results, resultMetadata: { filteredCount, unfilteredCount } } = await Ajax(signal).Workspaces.workspace(namespace, name)
      .paginatedEntitiesOfType(entityType, {
        page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction, filterTerms: activeTextFilter
      })
    setEntities(results)
    setFilteredCount(filteredCount)
    setTotalRowCount(unfilteredCount)
  })

  const selectAll = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const results = await Ajax(signal).Workspaces.workspace(namespace, name).entitiesOfType(entityType)
    setSelected(entityMap(results))
  })

  const selectPage = () => {
    setSelected(_.assign(selected, entityMap(entities)))
  }

  const deselectPage = () => {
    setSelected(_.omit(_.map(({ name }) => [name], entities), selected))
  }

  const selectNone = () => {
    setSelected({})
  }

  const pageSelected = () => {
    const entityKeys = _.map('name', entities)
    const selectedKeys = _.keys(selected)
    return entities.length && _.every(k => _.includes(k, selectedKeys), entityKeys)
  }

  // Lifecycle
  useEffect(() => {
    loadData()
    if (persist) {
      StateHistory.update({ itemsPerPage, pageNumber, sort, activeTextFilter })
    }
  }, [itemsPerPage, pageNumber, sort, activeTextFilter, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (persist) {
      setLocalPref(persistenceId, { columnWidths, columnState })
    }
  }, [columnWidths, columnState]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    table.current?.recomputeColumnSizes() // eslint-disable-line no-unused-expressions
  }, [columnWidths, columnState])
  useEffect(() => {
    table.current?.scrollToTop() // eslint-disable-line no-unused-expressions
  }, [pageNumber, itemsPerPage])


  // Memoized components

  const checkboxCellRenderer = _.memoize((entityName, entity) => {
    const checked = _.has([entityName], selected)
    return h(Checkbox, {
      'aria-label': entityName,
      checked,
      onChange: () => setSelected((checked ? _.unset([entity]) : _.set([entityName], entity))(selected))
    })
  })

  const nameCellRenderer = _.memoize((memoKey, entityName) => {
    return h(Fragment, [
      renderDataCell(entityName, namespace),
      div({ style: { flexGrow: 1 } }),
      editable && h(EditDataLink, {
        'aria-label': 'Rename entity',
        onClick: () => setRenamingEntity(entityName)
      })
    ])
  })

  const columnHeaderRenderer = _.memoize((memoKey, thisWidth, name) => {
    const [, columnNamespace, columnName] = /(.+:)?(.+)/.exec(name)
    return h(Resizable, {
      width: thisWidth, onWidthChange: delta => setColumnWidths(_.set(name, thisWidth + delta))
    }, [
      h(Sortable, { sort, field: name, onSort: setSort }, [
        h(HeaderCell, [
          !!columnNamespace && span({ style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } },
            columnNamespace)
        ]),
        [columnName]
      ])
    ])
  })

  const dataCellRenderer = _.memoize((memoKey, dataInfo, entityName) => {
    const dataCell = renderDataCell(Utils.entityAttributeText(dataInfo), namespace)
    return h(Fragment, [
      (!!dataInfo && _.isArray(dataInfo.items)) ?
        h(Link, {
          style: Style.noWrapEllipsis,
          onClick: () => setViewData(dataInfo)
        }, [dataCell]) : dataCell,
      div({ style: { flexGrow: 1 } }),
      editable && h(EditDataLink, {
        'aria-label': `Edit attribute ${name} of ${entityType} ${entityName}`,
        onClick: () => setUpdatingEntity({ entityName, attributeName: name, attributeValue: dataInfo })
      })
    ])
  })


  // Render
  const columnSettings = applyColumnSettings(columnState || [], entityMetadata[entityType].attributeNames)
  const nameWidth = columnWidths['name'] || 150

  return h(Fragment, [
    !!entities && h(Fragment, [
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        childrenBefore && childrenBefore({ entities, columnSettings }),
        div({ style: { flexGrow: 1 } }),
        div({ style: { width: 300 } }, [
          h(ConfirmedSearchInput, {
            'aria-label': 'Search',
            placeholder: 'Search',
            onChange: v => {
              setActiveTextFilter(v)
              setPageNumber(1)
            },
            defaultValue: activeTextFilter
          })
        ])
      ]),
      div({
        style: { flex: 1 }
      }, [
        h(AutoSizer, [
          ({ width, height }) => {
            return h(GridTable, {
              ref: table,
              width, height,
              rowCount: entities.length,
              onScroll,
              initialX,
              initialY,
              columns: [
                {
                  width: 70,
                  headerRenderer: () => {
                    return h(Fragment, [
                      h(Checkbox, {
                        checked: pageSelected(),
                        disabled: !entities.length,
                        onChange: () => pageSelected() ? deselectPage() : selectPage()
                      }),
                      h(PopupTrigger, {
                        closeOnClick: true,
                        content: h(Fragment, [
                          h(MenuButton, { onClick: () => selectPage() }, ['Page']),
                          h(MenuButton, { onClick: () => selectAll() }, [`All (${totalRowCount})`]),
                          h(MenuButton, { onClick: () => selectNone() }, ['None'])
                        ]),
                        side: 'bottom'
                      }, [
                        h(Clickable, { 'aria-label': '"Select All" options' }, [icon('caretDown')])
                      ])
                    ])
                  },
                  cellRenderer: ({ rowIndex }) => {
                    const entity = entities[rowIndex]
                    return checkboxCellRenderer(entity.name, entity)
                  }
                },
                {
                  width: nameWidth,
                  headerRenderer: () => h(Resizable, {
                    width: nameWidth, onWidthChange: delta => {
                      setColumnWidths(_.set('name', nameWidth + delta))
                    }
                  }, [
                    h(Sortable, { sort, field: 'name', onSort: setSort }, [
                      h(HeaderCell, [`${entityType}_id`])
                    ])
                  ]),
                  cellRenderer: ({ rowIndex }) => {
                    const { name: entityName } = entities[rowIndex]
                    return nameCellRenderer(`${nameWidth}-${entityName}`, entityName)
                  }
                },
                ..._.map(({ name }) => {
                  const thisWidth = columnWidths[name] || 300
                  return {
                    width: thisWidth,
                    headerRenderer: () => {
                      return columnHeaderRenderer(`${thisWidth}-${name}`, thisWidth, name)
                    },
                    cellRenderer: ({ rowIndex }) => {
                      const { attributes: { [name]: dataInfo }, name: entityName } = entities[rowIndex]

                      return dataCellRenderer(`${dataInfo}-${entityName}`, dataInfo, entityName)
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
          onSave: setColumnState
        })
      ]),
      div({ style: { flex: 'none', marginTop: '1rem' } }, [
        paginator({
          filteredDataLength: filteredCount,
          unfilteredDataLength: totalRowCount,
          pageNumber,
          setPageNumber,
          itemsPerPage,
          setItemsPerPage: v => {
            setPageNumber(1)
            setItemsPerPage(v)
          }
        })
      ])
    ]),
    !!viewData && h(Modal, {
      title: 'Contents',
      showButtons: false,
      showX: true,
      onDismiss: () => setViewData(undefined)
    }, [div({ style: { maxHeight: '80vh', overflowY: 'auto' } }, [displayData(viewData)])]),
    renamingEntity !== undefined && h(EntityRenamer, {
      entityType, entityName: renamingEntity,
      workspaceId,
      onSuccess: () => {
        setRenamingEntity(undefined)
        loadData()
      },
      onDismiss: () => setRenamingEntity(undefined)
    }),
    !!updatingEntity && h(EntityEditor, {
      entityType, ...updatingEntity,
      entityTypes: _.keys(entityMetadata),
      workspaceId,
      onSuccess: () => {
        setUpdatingEntity(undefined)
        loadData()
      },
      onDismiss: () => setUpdatingEntity(undefined)
    }),
    loading && spinnerOverlay
  ])
}

export default DataTable
