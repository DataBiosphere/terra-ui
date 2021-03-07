import { icon } from '@fortawesome/fontawesome-svg-core'
import _ from 'lodash/fp'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { code, div, h, h2, h3, h4, li, p, span, strong, ul } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { ButtonPrimary, ButtonSecondary, fixedSpinnerOverlay } from 'src/components/common'
import { renderDataCell, saveScroll } from 'src/components/data/data-utils'
import { NameModal } from 'src/components/NameModal'
import { GridTable, HeaderCell, Resizable, Sortable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { getLocalPref } from 'src/libs/prefs'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'


const UploadDataTable = props => {
  const {
    workspace: { workspace: { namespace, name } },
    metadataTable, metadataTable: { entityType, rows, columns, idName },
    onConfirm, onCancel, onRename, refreshKey
  } = props

  const persistenceId = `${namespace}/${name}/${entityType}`
  const nonIdColumns = _.drop(1, columns)

  // State
  const [entityMetadata, setEntityMetadata] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  const [sort, setSort] = useState(StateHistory.get().sort || { field: 'name', direction: 'asc' })
  const [renamingTable, setRenamingTable] = useState(false)

  const [columnWidths, setColumnWidths] = useState(() => getLocalPref(persistenceId)?.columnWidths || {})
  const { initialX, initialY } = StateHistory.get() || {}

  const table = useRef()
  const signal = Utils.useCancellation()

  useEffect(() => {
    _.flow( // eslint-disable-line lodash-fp/no-unused-result
      withErrorReporting('Error loading entity data'),
      Utils.withBusyState(setMetadataLoading)
    )(async () => {
      setEntityMetadata(await Ajax(signal).Workspaces.workspace(namespace, name).entityMetadata())
    })()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Convert from a metadata table to an entity
  useEffect(() => {
    if (entityMetadata && metadataTable?.rows?.length > 0) {
      let metadata = null
      let isUpdate = false
      let columnsAdded = []
      let columnsUpdated = []

      if (!(entityType in entityMetadata)) {
        metadata = {
          attributeNames: nonIdColumns,
          idName,
          count: rows.length
        }
      } else {
        metadata = entityMetadata[entityType]
        columnsAdded = _.difference(nonIdColumns, metadata.attributeNames)
        columnsUpdated = _.intersection(metadata.attributeNames, nonIdColumns)
        metadata.attributeNames = _.concat(metadata.attributeNames, columnsAdded)
        isUpdate = true
      }
      setMetadata({
        ...metadata,
        entityType,
        table: metadataTable,
        isUpdate,
        columnsAdded,
        columnsUpdated
      })
    } else {
      setMetadata(null)
    }
  }, [metadataTable, entityMetadata]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    table.current?.recomputeColumnSizes() // eslint-disable-line no-unused-expressions
  }, [columnWidths])

  useEffect(() => {
    StateHistory.update({ sort })
  }, [sort])


  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  const sortedRows = useMemo(() => {
    const i = _.findIndex(columns, sort.field)
    return i > -1 ? _.orderBy(row => row[i], sort.direction, rows) : rows
  }, [sort, rows, columns])

  return div({
    style: { display: 'flex', flexDirection: 'column', height: '100%' }
  },
  [
    div({
      style: { position: 'relative', flex: '0 0 auto' }
    }, [
      h2([
        span({ ref: header, tabIndex: -1 }, ['Preview your data table'])
      ]),
      div({
        style: { position: 'absolute', top: 0, right: 0, marginTop: '1em' }
      }, [
        h(ButtonSecondary, {
          style: { marginRight: '2em' },
          onClick: () => {
            onCancel && onCancel()
          }
        }, ['Cancel']),
        h(ButtonPrimary, {
          onClick: () => {
            onConfirm && onConfirm({ metadata })
          }
        }, [
          metadata?.isUpdate ? 'Update Table' : 'Create Table'
        ])
      ]),
      metadata && div([
        metadata.isUpdate ? div([
          h3(['Updating Table: ', strong(metadata.entityType)]),
          p({
            style: { color: colors.danger() }
          }, [
            icon('exclamation-triangle'),
            'This workspace already includes a table with this name. If any new rows have the same ',
            code(metadata.idName),
            ' as an existing row, the data in that row will be updated with the new values.'
          ]),
          metadata.columnsUpdated?.length > 0 && div([
            h4('Columns whose values may be overwritten:'),
            ul([
              ..._.map(u => li([u]), metadata.columnsUpdated)
            ])
          ]),
          metadata.columnsAdded?.length > 0 && div([
            h4('New columns to be added:'),
            ul([
              ..._.map(u => li([u]), metadata.columnsAdded)
            ])
          ])
        ]) : div([
          h3(['Creating a new Table: ', strong(metadata.entityType)])
        ]),
        h(ButtonPrimary, {
          onClick: () => setRenamingTable(true)
        }, [
          'Rename table'
        ]),
        p(`If this table looks right to you, click the button on the right to ${metadata.isUpdate ?
          'update' :
          'create'} the table in your workspace.`)
      ])
    ]),
    metadata && h(Fragment, [
      div({
        style: { flex: '1 1 auto' }
      }, [
        h(AutoSizer, {}, [
          ({ width, height }) => {
            return h(GridTable, {
              ref: table,
              width, height,
              rowCount: sortedRows.length,
              noContentMessage: `No ${entityType}s to display.`,
              onScroll: saveScroll, initialX, initialY,
              columns: [
                ..._.map(name => {
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
        ])
      ])
    ]),
    renamingTable && h(NameModal, {
      thing: 'Entity Table',
      value: metadata.entityType,
      onDismiss: () => setRenamingTable(false),
      onSuccess: ({ name }) => {
        onRename({ name })
        setRenamingTable(false)
      }
    }),
    metadataLoading && fixedSpinnerOverlay
  ])
}

export default UploadDataTable
