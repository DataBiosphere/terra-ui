import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, h1, h2 } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import { ButtonPrimary, GroupedSelect } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import ModalDrawer from 'src/components/ModalDrawer'
import { ColumnSelector, SimpleTable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils'


const styles = {
  table: {
    header: {
      color: colors.accent(),
      height: '2rem', lineHeight: '2rem',
      textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem'
    },
    headerRowStyle: {
      borderTop: `1px solid ${colors.dark(0.35)}`, borderBottom: `1px solid ${colors.dark(0.35)}`
    },
    rowStyle: {
      borderBottom: `1px solid ${colors.dark(0.2)}`
    },
    evenRowStyle: {
      backgroundColor: 'white'
    },
    oddRowStyle: {
      backgroundColor: colors.light(0.5)
    }
  }
}

const activeTab = 'browse & explore'

const DataBrowserPreview = ({ id }) => {
  const signal = Utils.useCancellation()
  const [loading, setLoading] = useState(false)
  const { dataCatalog } = useDataCatalog()
  const [tables, setTables] = useState()
  const [selectOptions, setSelectOptions] = useState()
  const [selectedTable, setSelectedTable] = useState()
  const [previewRows, setPreviewRows] = useState()
  const [columns, setColumns] = useState()
  const [viewJSON, setViewJSON] = useState()

  Utils.useOnMount(() => {
    const loadData = async () => {
      const { tables: newTables } = await Ajax(signal).DataRepo.getPreviewMetadata(id)

      const [hasRows, noRows] = _.flow(
        _.sortBy('name'),
        _.map(({ name, rowCount }) => ({ value: name, rowCount })),
        _.partition(({ rowCount }) => rowCount > 0)
      )(newTables)

      const newSelectOptions = [{ label: '', options: hasRows }, { label: 'Tables without data', options: noRows }]

      setTables(newTables)
      setSelectOptions(newSelectOptions)
      setSelectedTable(hasRows[0]?.value || noRows[0]?.value)
    }

    loadData()
  })

  useEffect(() => {
    const formatTableCell = ({ cellKey, cellContent, rowIndex, table }) => {
      const maybeJSON = Utils.maybeParseJSON(cellContent)
      return Utils.cond(
        [!Utils.cantBeNumber(cellContent), () => cellContent],
        [!!maybeJSON, () => h(ButtonPrimary, {
          style: { fontSize: 16, textTransform: 'none' },
          onClick: () => setViewJSON({ title: `${table}, Row ${rowIndex} - ${cellKey}`, cellData: maybeJSON })
        }, ['View JSON'])],
        [Utils.DEFAULT, () => cellContent]
      )
    }

    const loadTable = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReporting('Error loading table')
    )(async () => {
      const { columns: newTableColumns } = _.find({ name: selectedTable }, tables) || {}

      const newDisplayColumns = _.flow(
        Utils.toIndexPairs,
        _.map(([index, { name }]) => ({
          // name field is used in the column selector
          // key field is used in the Simple Table
          name, key: name,
          visible: index < 6,
          header: div({ style: styles.table.header }, [name])
        }))
      )(newTableColumns)

      setColumns(newDisplayColumns)

      const previewTableData = await Ajax(signal).DataRepo.getPreviewTable({ id, limit: 50, offset: 0, table: selectedTable })

      const newPreviewRows = _.flow(
        _.getOr([], 'result'),
        Utils.toIndexPairs,
        _.map(([rowIndex, row]) => {
          return _.reduce((acc, { name }) => {
            const formattedCell = formatTableCell({ cellKey: name, cellContent: row[name], rowIndex, table: selectedTable })
            return _.set([name], formattedCell, acc)
          }, {}, newTableColumns)
        })
      )(previewTableData)

      setPreviewRows(newPreviewRows)
    })

    if (!_.isEmpty(tables) && !!selectedTable) {
      loadTable()
    }
  }, [selectedTable]) // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = _.find({ 'dct:identifier': id }, dataCatalog)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot || _.isEmpty(tables) ?
      centeredSpinner() :
      div({ style: { padding: 20 } }, [
        h1({ style: { lineHeight: '26px' } }, [snapshot['dct:title']]),
        h(GroupedSelect, {
          'aria-label': 'data type',
          styles: { container: base => ({ ...base, marginLeft: '1rem', width: 350, marginBottom: 30 }) },
          isSearchable: true,
          isClearable: false,
          value: selectedTable,
          getOptionLabel: ({ rowCount, value }) => div({ style: { color: colors.dark(!!rowCount ? 1 : 0.5) } }, [_.startCase(value)]),
          formatGroupLabel: ({ label }) => {
            return !!label && div({
              style: { marginTop: 5, paddingTop: 15, borderTop: `1px solid ${colors.dark(0.5)}`, color: colors.dark(0.8) }
            }, [label])
          },
          onChange: ({ value }) => setSelectedTable(value),
          options: selectOptions
        }),
        loading ?
          centeredSpinner() :
          div({ style: { position: 'relative', padding: '0 15px' } }, [
            h(SimpleTable, {
              'aria-label': `${_.startCase(selectedTable)} Preview Data`,
              columns: _.filter('visible', columns),
              cellStyle: { border: 'none', paddingRight: 15, wordBreak: 'break-all', display: 'flex', alignItems: 'center' },
              ...styles.table,
              useHover: false,
              rows: previewRows
            }),
            !_.isEmpty(columns) && h(ColumnSelector, {
              onSave: setColumns, columnSettings: columns,
              style: { backgroundColor: 'unset', height: '2.5rem', width: '2.5rem', border: 0, right: 15 }
            }),
            _.isEmpty(previewRows) && div({
              style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }, ['(No Data)'])
          ])
      ]),
    viewJSON && h(ModalDrawer, {
      'aria-label': 'View Json', isOpen: true, width: 675,
      onDismiss: () => { setViewJSON() }
    }, [
      div({ style: { padding: '0 25px 25px' } }, [
        h2([viewJSON.title]),
        h(ReactJson, {
          style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: 'white' },
          name: false,
          collapsed: 4,
          enableClipboard: true,
          displayDataTypes: false,
          displayObjectSize: false,
          src: viewJSON.cellData
        })
      ])
    ])
  ])
}

export const navPaths = [{
  name: 'library-catalog-preview',
  path: '/library/browser/:id/preview',
  component: DataBrowserPreview,
  title: 'Catalog - Dataset Preview'
}]
