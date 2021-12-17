import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, h1, h2 } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import { ButtonPrimary, Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, spinner } from 'src/components/icons'
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
  const [loading, setLoading] = useState()
  const { dataCatalog } = useDataCatalog()
  const dataMap = _.keyBy('dct:identifier', dataCatalog)
  const snapshot = dataMap[id]
  const [tables, setTables] = useState()
  const [selectedTable, setSelectedTable] = useState('')
  const [previewData, setPreviewData] = useState()
  const [columnSettings, setColumnSettings] = useState([])
  const [viewJSON, setViewJSON] = useState()

  const tableMap = _.keyBy('name', tables)
  const tableNames = _.map('name', tables)

  const selectTable = ({ value }) => {
    const loadTable = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReporting('Error loading table')
    )(async () => {
      setSelectedTable(value)
      const previewTableData = await Ajax(signal).DataRepo.getPreviewTable({
        id, limit: 50, offset: 0,
        table: value
      })

      const columnNames = _.map('name', tableMap[selectedTable]?.columns)

      setPreviewData(_.flow([
        _.getOr([], 'result'),
        _.toPairs,
        _.map(([rowIndex, row]) => {
          return _.reduce((obj, param) => {
            obj[param] = formatTableCell({ cellKey: param, cellContent: row[param], rowIndex, table: value })
            return obj
          }, {}, columnNames)
        })
      ])(previewTableData))

      setColumnSettings(
        _.flow([
          _.toPairs,
          _.map(([index, col]) => {
            return {
              // name field is used in the column selector
              // key field is used in the Simple Table
              name: col.name, key: col.name,
              visible: index < 6,
              header: div({ style: styles.table.header }, [col.name])
            }
          })
        ])(tableMap[selectedTable]?.columns)
      )
    })
    loadTable()
  }

  const formatTableCell = ({ cellKey, cellContent, rowIndex, table }) => {
    const maybeJSON = Utils.maybeParseJSON(cellContent)
    return Utils.cond(
      [!Utils.cantBeNumber(cellContent), () => cellContent],
      [maybeJSON, () => {
        const contentAsJSON = {
          title: `${table}, Row ${rowIndex} - ${cellKey}`,
          cellData: maybeJSON
        }

        return h(ButtonPrimary, {
          style: { fontSize: 16, textTransform: 'none', height: 'unset' },
          onClick: () => { setViewJSON(contentAsJSON) }
        }, ['View JSON'])
      }],
      [Utils.DEFAULT, () => cellContent]
    )
  }

  Utils.useOnMount(() => {
    const loadData = async () => {
      const metadata = await Ajax(signal).DataRepo.getPreviewMetadata(id)
      setTables(metadata.tables)
      selectTable({ value: metadata.tables[0].name })
    }
    loadData()
  })

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
      centeredSpinner() :
      div({ style: { padding: 20 } }, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%', lineHeight: '26px' } }, [
          h1([snapshot['dct:title']])
        ]),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 } }, [
          h(Select, {
            'aria-label': 'data type',
            styles: { container: base => ({ ...base, marginLeft: '1rem', width: 350 }) },
            isSearchable: true,
            isClearable: false,
            value: selectedTable,
            getOptionLabel: ({ value }) => `${_.startCase(value)}${tableMap[value].rowCount === 0 ? ' (0 Rows)' : ''}`,
            onChange: ({ value }) => selectTable({ value }),
            options: tableNames
          }),
          loading && spinner({ style: { marginLeft: '1rem' } })
        ]),
        tableMap && tableMap[selectedTable] && div({ style: { position: 'relative', padding: '0 15px' } }, [
          h(SimpleTable, {
            'aria-label': `${_.startCase(selectedTable)} Preview Data`,
            columns: _.filter('visible', columnSettings),
            cellStyle: { border: 'none', paddingRight: 15, wordBreak: 'break-all', display: 'flex', alignItems: 'center' },
            ...styles.table,
            useHover: false,
            rows: previewData
          }),
          columnSettings.length > 0 && h(ColumnSelector, { onSave: setColumnSettings, columnSettings, style: { backgroundColor: 'transparent', height: '2.5rem', width: '2.5rem', border: 0, right: 15 } })
        ]),
        previewData?.length === 0 && div({ style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ['(No Data)'])
      ]),
    viewJSON && h(ModalDrawer, {
      'aria-label': 'View Json', isOpen: true, width: 675,
      onDismiss: () => { setViewJSON() },
      children: div({ style: { padding: '0 25px 25px' } }, [
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
    })
  ])
}

export const navPaths = [{
  name: 'library-catalog-preview',
  path: '/library/browser/:id/preview',
  component: DataBrowserPreview,
  title: ({ id }) => `Catalog - Dataset Preview`
}]
