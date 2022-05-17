import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { b, div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { ButtonPrimary, Checkbox, Clickable, DeleteConfirmationModal, fixedSpinnerOverlay, Link } from 'src/components/common'
import { concatenateAttributeNames, EditDataLink, EntityRenamer, HeaderOptions, renderDataCell, SingleEntityEditor } from 'src/components/data/data-utils'
import { ColumnSettingsWithSavedColumnSettings } from 'src/components/data/SavedColumnSettings'
import { icon } from 'src/components/icons'
import { ConfirmedSearchInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { GridTable, HeaderCell, paginator, Resizable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { isDataTabRedesignEnabled } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { useCancellation } from 'src/libs/react-utils'
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
    entityType, entityMetadata, setEntityMetadata, workspaceId, workspace, googleProject, workspaceId: { namespace, name },
    onScroll, initialX, initialY,
    selectionModel: { selected, setSelected },
    childrenBefore,
    editable,
    activeCrossTableTextFilter,
    persist, refreshKey, firstRender,
    snapshotName,
    deleteColumnUpdateMetadata
  } = props

  const persistenceId = `${namespace}/${name}/${entityType}`

  // State
  const [loading, setLoading] = useState(false)

  const [viewData, setViewData] = useState()
  const [entities, setEntities] = useState()
  const [filteredCount, setFilteredCount] = useState(0)
  const [totalRowCount, setTotalRowCount] = useState(0)

  const stateHistory = firstRender ? StateHistory.get() : {}
  const [itemsPerPage, setItemsPerPage] = useState(stateHistory.itemsPerPage || 100)
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

  const [updatingColumnSettings, setUpdatingColumnSettings] = useState()
  const [renamingEntity, setRenamingEntity] = useState()
  const [updatingEntity, setUpdatingEntity] = useState()
  const [deletingColumn, setDeletingColumn] = useState()
  const [clearingColumn, setClearingColumn] = useState()

  const noEdit = Utils.editWorkspaceError(workspace)

  const table = useRef()
  const signal = useCancellation()

  // Helpers
  const loadData = !!entityMetadata && _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const { results, resultMetadata: { filteredCount, unfilteredCount } } = await Ajax(signal).Workspaces.workspace(namespace, name)
      .paginatedEntitiesOfType(entityType, _.pickBy(_.trim, {
        page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction,
        ...(!!snapshotName ?
          { billingProject: googleProject, dataReference: snapshotName } :
          { filterTerms: activeCrossTableTextFilter || activeTextFilter })
      }))
    // Find all the unique attribute names contained in the current page of results.
    const attrNamesFromResults = _.uniq(_.flatMap(_.keys, _.map('attributes', results)))
    // Add any attribute names from the current page of results to those found in metadata.
    // This allows for stale metadata (e.g. the metadata cache is out of date).
    // For the time being, the uniqueness check MUST be case-insensitive (e.g. { sensitivity: 'accent' })
    // in order to prevent case-divergent columns from being displayed, as that would expose some other bugs.
    const attrNamesFromMetadata = entityMetadata[entityType]?.attributeNames
    const newAttrsForThisType = concatenateAttributeNames(attrNamesFromMetadata, attrNamesFromResults)
    if (!_.isEqual(newAttrsForThisType, attrNamesFromMetadata)) {
      setEntityMetadata(_.set([entityType, 'attributeNames'], newAttrsForThisType))
    }
    setEntities(results)
    setFilteredCount(filteredCount)
    setTotalRowCount(unfilteredCount)
  })

  const getAllEntities = async () => {
    const params = _.pickBy(_.trim, { pageSize: filteredCount, filterTerms: activeTextFilter })
    const queryResults = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(entityType, params)
    return queryResults.results
  }

  const deleteColumn = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Unable to delete column')
  )(async attributeName => {
    await Ajax(signal).Workspaces.workspace(namespace, name).deleteEntityColumn(entityType, attributeName)
    deleteColumnUpdateMetadata({ entityType, attributeName })

    const updatedEntities = _.map(entity => {
      return { ...entity, attributes: _.omit([attributeName], entity.attributes) }
    }, entities)
    setEntities(updatedEntities)
  })

  const clearColumn = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Unable to clear column.')
  )(async attributeName => {
    const allEntities = await getAllEntities()
    const entityUpdates = _.map(entity => ({
      name: entity.name,
      entityType: entity.entityType,
      operations: [{ op: 'AddUpdateAttribute', attributeName, addUpdateAttribute: '' }]
    }), allEntities)
    await Ajax(signal).Workspaces.workspace(namespace, name).upsertEntities(entityUpdates)

    const updatedEntities = _.map(_.update('attributes', _.set(attributeName, '')), entities)
    setEntities(updatedEntities)
  })

  const selectAll = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const allEntities = await getAllEntities()
    setSelected(entityMap(allEntities))
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
  }, [itemsPerPage, pageNumber, sort, activeTextFilter, activeCrossTableTextFilter, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
  // If there is an active cross table search, temporarily reset the column settings to show all columns
  const columnSettings = activeCrossTableTextFilter ? applyColumnSettings([], entityMetadata[entityType].attributeNames) : applyColumnSettings(columnState || [], entityMetadata[entityType].attributeNames)
  const nameWidth = columnWidths['name'] || 150

  const showColumnSettingsModal = () => setUpdatingColumnSettings(columnSettings)

  return h(Fragment, [
    !!entities && h(Fragment, [
      div({
        style: {
          display: 'flex',
          padding: '1rem',
          background: isDataTabRedesignEnabled() ? colors.light() : undefined,
          borderBottom: isDataTabRedesignEnabled() ? `1px solid ${colors.grey(0.4)}` : undefined
        }
      }, [
        childrenBefore && childrenBefore({ entities, columnSettings, showColumnSettingsModal }),
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
        style: { flex: 1, margin: isDataTabRedesignEnabled() ? 0 : '0 1rem' }
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
                    h(HeaderOptions, { sort, field: 'name', onSort: setSort },
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
                        sort, field: attributeName, onSort: setSort,
                        extraActions: [
                          // settimeout 0 is needed to delay opening the modaals until after the popup menu closes.
                          // Without this, autofocus doesn't work in the modals.
                          { label: 'Delete Column', disabled: !!noEdit, tooltip: noEdit || '', onClick: () => setTimeout(() => setDeletingColumn(attributeName), 0) },
                          { label: 'Clear Column', disabled: !!noEdit, tooltip: noEdit || '', onClick: () => setTimeout(() => setClearingColumn(attributeName), 0) }
                        ]
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
              },
              border: !isDataTabRedesignEnabled()
            })
          }
        ])
      ]),
      !_.isEmpty(entities) && div({ style: { flex: 'none', margin: '1rem' } }, [
        paginator({
          filteredDataLength: filteredCount,
          unfilteredDataLength: totalRowCount,
          pageNumber,
          setPageNumber,
          itemsPerPage,
          setItemsPerPage: v => {
            setPageNumber(1)
            setItemsPerPage(v)
          },
          itemsPerPageOptions: [10, 25, 50, 100, 250, 500, 1000]
        })
      ])
    ]),
    !!viewData && h(Modal, {
      title: 'Contents',
      showButtons: false,
      showX: true,
      onDismiss: () => setViewData(undefined)
    }, [div({ style: { maxHeight: '80vh', overflowY: 'auto' } }, [displayData(viewData)])]),
    updatingColumnSettings && h(Modal, {
      title: 'Select columns',
      width: 800,
      onDismiss: () => setUpdatingColumnSettings(undefined),
      okButton: h(ButtonPrimary, {
        onClick: () => {
          setColumnState(updatingColumnSettings)
          setUpdatingColumnSettings(undefined)
        }
      }, ['Done'])
    }, [
      h(ColumnSettingsWithSavedColumnSettings, {
        entityMetadata,
        entityType,
        snapshotName,
        workspace,
        columnSettings: updatingColumnSettings,
        onChange: setUpdatingColumnSettings
      })
    ]),
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
    !!updatingEntity && h(SingleEntityEditor, {
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
    !!deletingColumn && h(DeleteConfirmationModal, {
      objectType: 'column',
      objectName: deletingColumn,
      onConfirm: () => {
        setDeletingColumn(undefined)
        deleteColumn(deletingColumn)
      },
      onDismiss: () => setDeletingColumn(undefined)
    }),
    !!clearingColumn && h(DeleteConfirmationModal, {
      title: 'Clear Column',
      buttonText: 'Clear column',
      onConfirm: () => {
        setClearingColumn(undefined)
        clearColumn(clearingColumn)
      },
      onDismiss: () => setClearingColumn(undefined)
    }, [
      div(['Are you sure you want to permanently delete all data in the column ',
        b({ style: { wordBreak: 'break-word' } }, clearingColumn), '?']),
      b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.')
    ]),
    loading && fixedSpinnerOverlay
  ])
}

export default DataTable
