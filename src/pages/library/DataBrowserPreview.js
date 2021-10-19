import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { SimpleTable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils'


const styles = {
  table: {
    header: {
      color: colors.accent(),
      height: '1rem',
      textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem'
    },
    row: {
      backgroundColor: '#ffffff',
      borderRadius: 5, border: '1px solid rgba(0,0,0,.15)',
      margin: '0 -1rem 1rem', padding: '1rem'
    }
  }
}

const activeTab = 'browse & explore'
let metadata
let tableMap

const selectTable = async ({ value, signal, setSelectedTable, setPreviewData }) => {
  setSelectedTable(value)
  try {
    const test = await Ajax(signal).DataRepo.getPreviewTable({
      datasetProject: metadata.dataProject,
      datasetBqSnapshotName: metadata.name,
      tableName: value
    })

    console.log('test', test)
  } catch (err) {
    console.log('errored table data load')
  }
}

const DataBrowserPreview = ({ id }) => {
  const signal = Utils.useCancellation()
  const { dataCatalog } = useDataCatalog()
  const dataMap = _.keyBy('dct:identifier', dataCatalog)
  const snapshot = dataMap[id]
  const [tables, setTables] = useState()
  const [selectedTable, setSelectedTable] = useState('')
  const [previewData, setPreviewData] = useState()

  console.log('logging preview data so it doesnt have a warning', previewData)

  Utils.useOnMount(() => {
    const loadData = async () => {
      metadata = await Ajax(signal).DataRepo.getPreviewMetadata(id)
      tableMap = _.keyBy('name', metadata.tables)
      setTables(_.map('name', metadata.tables))
      selectTable({ value: metadata.tables[0].name, setSelectedTable, setPreviewData, signal })
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
        h(Select, {
          'aria-label': 'data type',
          styles: { container: base => ({ ...base, marginLeft: '1rem', width: 350, marginBottom: 30 }) },
          isSearchable: true,
          isClearable: false,
          value: selectedTable,
          getOptionLabel: ({ value }) => _.startCase(value),
          onChange: ({ value }) => selectTable({ value, setSelectedTable, setPreviewData, signal }),
          options: tables
        }),
        tableMap && tableMap[selectedTable] && h(SimpleTable, {
          'aria-label': `${_.startCase(selectedTable)} Preview Data`,
          columns: _.map(col => {
            return {
              header: div({ style: styles.table.header }, [col.name]),
              key: col.name
            }
          }, tableMap[selectedTable].columns),
          // columns: [
          //   { header: 'hello', key: 'hello' },
          //   { header: 'hello2', key: 'hello2' },
          //   { header: 'hello3', key: 'hello3' }
          // ],
          // columns: [
          //   {
          //     header: div({ className: 'sr-only' }, ['Select dataset']),
          //     key: 'checkbox'
          //   }
          // ],
          rowStyle: styles.table.row,
          cellStyle: { border: 'none', paddingRight: 15 },
          useHover: false,
          rows: []
        })
      ])
  ])
}

export const navPaths = [{
  name: 'library-catalog-preview',
  path: '/library/browser/:id/preview',
  component: DataBrowserPreview,
  title: ({ id }) => `Catalog - Dataset Preview`,
  public: false
}]
