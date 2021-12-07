import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, spinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { SimpleTable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils'


const styles = {
  table: {
    header: {
      color: colors.accent(),
      height: '1rem',
      textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem'
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
      setPreviewData(previewTableData?.result || [])
    })
    loadTable()
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
        tableMap && tableMap[selectedTable] && h(SimpleTable, {
          'aria-label': `${_.startCase(selectedTable)} Preview Data`,
          columns: _.map(col => {
            return {
              header: div({ style: styles.table.header }, [col.name]),
              key: col.name
            }
          }, tableMap[selectedTable].columns),
          cellStyle: { border: 'none', paddingRight: 15, wordBreak: 'break-all' },
          useHover: false,
          rows: previewData
        }),
        previewData?.length === 0 && div({ style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ['(No Data)'])
      ])
  ])
}

export const navPaths = [{
  name: 'library-catalog-preview',
  path: '/library/browser/:id/preview',
  component: DataBrowserPreview,
  title: ({ id }) => `Catalog - Dataset Preview`
}]
