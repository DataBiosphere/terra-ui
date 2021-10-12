import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { Checkbox, Clickable, fixedSpinnerOverlay, Link } from 'src/components/common'
import { DeleteEntityColumnModal, EditDataLink, EntityEditor, EntityRenamer, HeaderOptions, renderDataCell } from 'src/components/data/data-utils'
import { icon } from 'src/components/icons'
import { ConfirmedSearchInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { ColumnSelector, GridTable, HeaderCell, paginator, Resizable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
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
    entityType, entityMetadata, workspaceId, googleProject, workspaceId: { namespace, name },
    onScroll, initialX, initialY,
    selectionModel: { selected, setSelected },
    childrenBefore,
    editable,
    persist, refreshKey, firstRender,
    snapshotName,
    loadMetadata
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
  const [deletingColumn, setDeletingColumn] = useState()

  const table = useRef()
  const signal = Utils.useCancellation()

  // Helpers
  const loadData = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const { results, resultMetadata: { filteredCount, unfilteredCount } } = await Ajax(signal).Workspaces.workspace(namespace, name)
      .paginatedEntitiesOfType(entityType, _.pickBy(_.trim, {
        page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction,
        ...(!!snapshotName ?
          { billingProject: googleProject, dataReference: snapshotName } :
          { filterTerms: activeTextFilter })
      }))
    setEntities(results)
    setFilteredCount(filteredCount)
    setTotalRowCount(unfilteredCount)
  })

  const selectAll = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const params = _.pickBy(_.trim, { pageSize: filteredCount, filterTerms: activeTextFilter })
    const queryResults = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(entityType, params)
    setSelected(entityMap(queryResults.results))
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
    table.current?.recomputeColumnSizes()
  }, [columnWidths, columnState])
  useEffect(() => {
    table.current?.scrollToTop()
  }, [pageNumber, itemsPerPage])


  // Render
  const columnSettings = applyColumnSettings(columnState || [], entityMetadata[entityType].attributeNames)
  const nameWidth = columnWidths['name'] || 150

  return h(Fragment, [
    !!entities && h(Fragment, [
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        childrenBefore && childrenBefore({ entities, columnSettings }),
        div({ style: { flexGrow: 1 } }),
        !snapshotName && div({ style: { width: 300 } }, [
          h(ConfirmedSearchInput, {
            'aria-label': 'Search',
            placeholder: 'Search',
            onChange: v => {
              setActiveTextFilter(v.toString().trim())
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
              'aria-label': `${entityType} data table, page ${pageNumber} of ${Math.ceil(totalRowCount / itemsPerPage)}`,
              width, height,
              rowCount: entities.length,
              noContentMessage: `No ${entityType}s to display.`,
              onScroll,
              initialX,
              initialY,
              sort,
              columns: [
                {
                  width: 70,
                  headerRenderer: () => {
                    return h(Fragment, [
                      h(Checkbox, {
                        checked: pageSelected(),
                        disabled: !entities.length,
                        onChange: pageSelected() ? deselectPage : selectPage,
                        'aria-label': 'Select all'
                      }),
                      h(MenuTrigger, {
                        closeOnClick: true,
                        content: h(Fragment, [
                          h(MenuButton, { onClick: selectPage }, ['Page']),
                          !!filteredCount && (h(MenuButton, { onClick: selectAll },
                            ((totalRowCount === filteredCount) ? [`All (${filteredCount})`] : [`Filtered (${filteredCount})`]))),
                          h(MenuButton, { onClick: selectNone }, ['None'])
                        ]),
                        side: 'bottom'
                      }, [
                        h(Clickable, { 'aria-label': '"Select All" options' }, [icon('caretDown')])
                      ])
                    ])
                  },
                  cellRenderer: ({ rowIndex }) => {
                    const thisEntity = entities[rowIndex]
                    const { name } = thisEntity
                    const checked = _.has([name], selected)
                    return h(Checkbox, {
                      'aria-label': name,
                      checked,
                      onChange: () => setSelected((checked ? _.unset([name]) : _.set([name], thisEntity))(selected))
                    })
                  }
                },
                {
                  field: 'name',
                  width: nameWidth,
                  headerRenderer: () => h(Resizable, {
                    width: nameWidth, onWidthChange: delta => {
                      setColumnWidths(_.set('name', nameWidth + delta))
                    }
                  }, [
                    h(HeaderOptions, { field: 'name', onSort: setSort, isEntityName: true },
                      [h(HeaderCell, [entityMetadata[entityType].idName])])
                  ]),
                  cellRenderer: ({ rowIndex }) => {
                    const { name: entityName } = entities[rowIndex]
                    return h(Fragment, [
                      renderDataCell(entityName, googleProject),
                      div({ style: { flexGrow: 1 } }),
                      editable && h(EditDataLink, {
                        'aria-label': 'Rename entity',
                        onClick: () => setRenamingEntity(entityName)
                      })
                    ])
                  }
                },
                ..._.map(({ name: attributeName }) => {
                  const thisWidth = columnWidths[attributeName] || 300
                  const [, columnNamespace, columnName] = /(.+:)?(.+)/.exec(attributeName)
                  return {
                    field: attributeName,
                    width: thisWidth,
                    headerRenderer: () => h(Resizable, {
                      width: thisWidth, onWidthChange: delta => setColumnWidths(_.set(attributeName, thisWidth + delta))
                    }, [
                      h(HeaderOptions, {
                        field: attributeName, onSort: setSort, isEntityName: false,
                        beginDelete: () => setDeletingColumn({ entityType, attributeName })
                      }, [
                        h(HeaderCell, [
                          !!columnNamespace && span({ style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } },
                            columnNamespace)
                        ]),
                        [columnName]
                      ])
                    ]),
                    cellRenderer: ({ rowIndex }) => {
                      const { attributes: { [attributeName]: dataInfo }, name: entityName } = entities[rowIndex]
                      const dataCell = renderDataCell(Utils.entityAttributeText(dataInfo), googleProject)
                      return h(Fragment, [
                        (!!dataInfo && _.isArray(dataInfo.items)) ?
                          h(Link, {
                            style: Style.noWrapEllipsis,
                            onClick: () => setViewData(dataInfo)
                          }, [dataCell]) : dataCell,
                        div({ style: { flexGrow: 1 } }),
                        editable && h(EditDataLink, {
                          'aria-label': `Edit attribute ${attributeName} of ${entityType} ${entityName}`,
                          'aria-haspopup': 'dialog',
                          'aria-expanded': !!updatingEntity,
                          onClick: () => setUpdatingEntity({ entityName, attributeName, attributeValue: dataInfo })
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
          onSave: setColumnState
        })
      ]),
      !_.isEmpty(entities) && div({ style: { flex: 'none', marginTop: '1rem' } }, [
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
      entityType: _.find(entity => entity.name === renamingEntity, entities).entityType,
      entityName: renamingEntity,
      workspaceId,
      onSuccess: () => {
        setRenamingEntity(undefined)
        loadData()
      },
      onDismiss: () => setRenamingEntity(undefined)
    }),
    !!updatingEntity && h(EntityEditor, {
      entityType: _.find(entity => entity.name === updatingEntity.entityName, entities).entityType,
      ...updatingEntity,
      entityTypes: _.keys(entityMetadata),
      workspaceId,
      onSuccess: () => {
        setUpdatingEntity(undefined)
        loadData()
      },
      onDismiss: () => setUpdatingEntity(undefined)
    }),
    !!deletingColumn && h(DeleteEntityColumnModal, {
      workspaceId: { namespace, name },
      column: deletingColumn,
      onSuccess: () => {
        setDeletingColumn(undefined)
        loadMetadata()
      },
      onDismiss: () => setDeletingColumn(undefined)
    }),
    loading && fixedSpinnerOverlay
  ])
}

export default DataTable
