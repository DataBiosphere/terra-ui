import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState, useMemo } from 'react'
import { dd, div, dl, dt, h, h2, p, span, strong } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { ButtonPrimary, ButtonSecondary, Checkbox, Clickable, fixedSpinnerOverlay, Link, MenuButton } from 'src/components/common'
import { EditDataLink, EntityEditor, EntityRenamer, renderDataCell, saveScroll } from 'src/components/data/data-utils'
import { icon } from 'src/components/icons'
import { ConfirmedSearchInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { ColumnSelector, GridTable, HeaderCell, paginator, Resizable, Sortable } from 'src/components/table'
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

const UploadDataTable = props => {
  const { workspace, workspace: { workspace: { namespace, name } },
    metadataTable, metadataTable: { entityClass, entityType, rows, columns, idName, idColumn },
    onConfirm, onCancel, refreshKey, children
  } = props

  const persistenceId = `${namespace}/${name}/${entityType}`
  const nonIdColumns = _.drop(1, columns)

  // State
  const [viewData, setViewData] = useState()
  const [renamingEntity, setRenamingEntity] = useState()

  const [entityMetadata, setEntityMetadata] = useState(null)
  const [activeMetadata, setActiveMetadata] = useState(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  const [sort, setSort] = useState(StateHistory.get().sort || { field: 'name', direction: 'asc' })

  const [columnWidths, setColumnWidths] = useState(() => getLocalPref(persistenceId)?.columnWidths || {})
  const { initialX, initialY } = StateHistory.get() || {}

  const table = useRef()
  const signal = Utils.useCancellation()

  useEffect(() => {
    _.flow(
      withErrorReporting('Error loading entity data'),
      Utils.withBusyState(setMetadataLoading)
    )(async () => {
      setEntityMetadata(await Ajax(signal).Workspaces.workspace(namespace, name).entityMetadata())
    })()
  }, [refreshKey])

  // Convert from a metadata table to an entity
  useEffect(() => {
    if (entityMetadata && metadataTable?.rows?.length > 0) {
      let metadata = null
      let isUpdate = false
      let columnsAdded = []
      let columnsUpdated = []

      if (!(entityType in entityMetadata)) {
        metadata = entityMetadata[entityType] = {
          attributeNames: nonIdColumns,
          idName: idName,
          count: rows.length
        }
      }
      else {
        metadata = entityMetadata[entityType]
        columnsAdded = _.difference(nonIdColumns, metadata.attributeNames)
        columnsUpdated = _.intersection(metadata.attributeNames, nonIdColumns)
        metadata.attributeNames = _.concat(metadata.attributeNames, columnsAdded)
        isUpdate = true
      }
      setActiveMetadata({
        ... metadata,
        entityType,
        table: metadataTable,
        isUpdate,
        columnsAdded,
        columnsUpdated
      })
    }
    else {
      setActiveMetadata(null)
    }
  }, [metadataTable, entityMetadata])

  useEffect(() => {
    table.current?.recomputeColumnSizes() // eslint-disable-line no-unused-expressions
  }, [columnWidths])

  useEffect(() => {
    StateHistory.update( { sort } )
  }, [sort])

  const sortedRows = useMemo(() => {
    const i = _.findIndex(columns, sort.field)
    return i > -1 ? _.orderBy(row => row[i], sort.direction, rows) : rows
  }, [sort, rows, columns])

  return div({
    style: { position: 'relative' },
  }, [
    h2('Preview your data table'),
    div({
      style: { position: 'absolute', top: 0, right: 0, marginTop: '1em' },
    }, [
      h(ButtonSecondary, {
        style: { marginRight: '2em' },
        onClick: () => {
          onCancel && onCancel()
        }
      }, ['Cancel']),
      h(ButtonPrimary, {
        onClick: () => {
          onConfirm && onConfirm({ activeMetadata })
        }
      }, [
        activeMetadata?.isUpdate ? 'Update Table' : 'Create Table'
      ]),
    ]),
    div({
      style: { flex: 1 }
    }, [
      p('If this table looks right to you, click the button on the right to create the table in your workspace.'),
    ]),
    activeMetadata && h(Fragment, [
      div({
        style: { flex: 1 }
      }, [
        dl([
          dt('Table name'),
          dd([strong(activeMetadata.entityType)])
        ]),
        h(AutoSizer, [
          ({ width, height }) => {
            return h(GridTable, {
              ref: table,
              width, height,
              rowCount: sortedRows.length,
              noContentMessage: `No ${entityType}s to display.`,
              onScroll: saveScroll, initialX, initialY,
              columns: [
                ..._.map((name) => {
                  const thisWidth = columnWidths[name] || 300
                  const [, columnNamespace, columnName] = /(.+:)?(.+)/.exec(name)
                  return {
                    width: thisWidth,
                    headerRenderer: () => h(Resizable, {
                      width: thisWidth, onWidthChange: delta => setColumnWidths(_.set(name, thisWidth + delta))
                    }, [
                      h(Sortable, { sort, field: name, onSort: setSort }, [
                        h(HeaderCell, [
                          !!columnNamespace && span({ style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } },
                            columnNamespace)
                        ]),
                        [columnName]
                      ])
                    ]),
                    cellRenderer: ({ rowIndex, columnIndex }) => {
                      const value = sortedRows[rowIndex][columnIndex]
                      return renderDataCell(value, namespace)
                    }
                  }
                }, columns)
              ],
              styleCell: ({ rowIndex }) => {
                return rowIndex % 2 && { backgroundColor: colors.light(0.2) }
              }
            })
          }
        ]),
      ]),
    ]),
    metadataLoading && fixedSpinnerOverlay
  ])
}

export default UploadDataTable
