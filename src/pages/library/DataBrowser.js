import filesize from 'filesize'
import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, ButtonSecondary, Checkbox, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { MiniSortable, SimpleTable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { SearchAndFilterComponent } from 'src/pages/library/common'
import * as tempData from 'src/pages/library/hca-sample.json'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'

// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Access Type',
  labels: ['Controlled Access', 'Open Access']
}, {
  name: 'Consortium',
  labels: [
    '1000 Genomes',
    'CCDG',
    'CMG',
    'Convergent Neuro',
    'GTEx (v8)',
    'HPRC',
    'PAGE',
    'WGSPD1'
  ]
}, {
  name: 'Disease',
  labels: [
    'Alzheimer\'s disease',
    'asthma',
    'autism spectrum disorder'
  ]
},
{
  name: 'Data Type',
  labels: [
    'Exome',
    'Whole Genome'
  ]
}]

const styles = {
  table: {
    table: { width: '100%' },
    header: {
      color: colors.accent(),
      textTransform: 'uppercase', textAlign: 'left',
      fontWeight: '600', fontSize: '.75rem',
      padding: '5px 15px', width: '100%',
      flex: 1
    },
    row: {
      backgroundColor: '#ffffff',
      borderRadius: '5px', border: '1px solid rgba(0,0,0,.15)',
      margin: '15px 0'
    },
    col: {
      padding: '15px', flex: 1
    },
    firstElem: {
      minWidth: '37px', flex: 'unset',
      padding: '15px 0px 15px 15px', textAlign: 'center'
    },
    lastElem: {
      width: 'fit-content', flex: '1'
    },
    flexTableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
  }
}

const getRawList = () => new Promise(resolve => setTimeout(() => {
  resolve(tempData.default.data)
}, 1000))

const Browser = () => {
  const stateHistory = StateHistory.get()
  const [catalogSnapshots, setCatalogSnapshots] = useState(stateHistory.catalogSnapshots)
  const [sort, setSort] = useState('most recent')
  const [sortDir, setSortDir] = useState()
  const [selectedData, setSelectedData] = useState([])
  const [openedData, setOpenedData] = useState([])
  const [requestDatasetAccessList, setRequestDatasetAccessList] = useState()

  Utils.useOnMount(() => {
    const loadData = async () => {
      const rawList = await getRawList()
      const normList = _.map(snapshot => ({
        ...snapshot,
        tags: _.update(['items'], _.map(_.toLower), snapshot.tags),
        project: _.get('0.dct:title', snapshot['TerraDCAT_ap:hasDataCollection']),
        lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
        locked: true
      }), rawList)

      setCatalogSnapshots(normList)
      StateHistory.update({ catalogSnapshots })
    }
    loadData()
  })

  const sortData = Utils.cond(
    [sort === 'most recent', () => _.orderBy(['created'], ['desc'])],
    [sort === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w['dct:title'])), ['asc'])],
    [sort === 'Dataset Name', () => _.orderBy(w => _.toLower(_.trim(w['dct:title'])), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Project', () => _.orderBy(w => _.toLower(_.trim(w.project)), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'No. of Subjects', () => _.orderBy(['counts.donors', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Data Type', () => _.orderBy(['dataType', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Last Updated', () => _.orderBy(['lastUpdated', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    () => _.identity
  )

  const toggleSelectedData = data => setSelectedData(_.xor([data]))

  const SelectedItemsDisplay = () => {
    const length = selectedData.length
    const files = _.sumBy(data => _.sumBy('count', data.files), selectedData)
    const totalBytes = _.sumBy(data => _.sumBy('dcat:byteSize', data.files), selectedData)
    const fileSizeFormatted = filesize(totalBytes)

    return div(
      {
        style: {
          display: selectedData.length > 0 ? 'block' : 'none',
          position: 'sticky', bottom: 0, marginTop: '20px',
          width: '100%', padding: '34px 60px',
          backgroundColor: 'white', boxShadow: 'rgb(0 0 0 / 30%) 0px 0px 8px 3px',
          fontSize: 17
        }
      },
      [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
          `${length} dataset${length > 1 ? 's' : ''} (${fileSizeFormatted} - ${files} bam files) selected to be saved to a Terra Workspace`,
          div([
            h(ButtonSecondary, {
              style: { fontSize: 16, marginRight: 40, textTransform: 'none' },
              onClick: () => setSelectedData([])
            }, 'Cancel'),
            h(ButtonPrimary, {
              style: { textTransform: 'none', fontSize: 14 },
              onClick: () => {}
            }, ['Save to a workspace'])
          ])
        ])
      ]
    )
  }

  const DataTable = listData => {
    return div({ style: { margin: '0 15px' } }, [h(SimpleTable, {
      'aria-label': 'dataset list',
      columns: [
        {
          header: div({ className: 'sr-only' }, ['Select dataset']),
          size: { basis: 37, grow: 0 }, key: 'checkbox'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'dct:title', onSort: setSort }, ['Dataset Name'])]),
          size: { grow: 2.2 }, key: 'name'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'project.name', onSort: setSort }, ['Project'])]),
          size: { grow: 1 }, key: 'project'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'counts.donors', onSort: setSort }, ['No. of Subjects'])]),
          size: { grow: 1 }, key: 'subjects'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'dataType', onSort: setSort }, ['Data Type'])]),
          size: { grow: 1 }, key: 'dataType'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'dct:modified', onSort: setSort }, ['Last Updated'])]),
          size: { grow: 1 }, key: 'lastUpdated'
        }
      ],
      rowStyle: styles.table.row,
      cellStyle: { border: 'none', paddingRight: 15 },
      useHover: false,
      underRowKey: 'underRow',
      rows: _.map(datum => {
        const { project: { name: projectName }, dataType, locked } = datum

        return {
          checkbox: h(Checkbox, {
            'aria-label': datum['dct:title'],
            checked: _.includes(datum, selectedData),
            onChange: () => toggleSelectedData(datum)
          }),
          name: datum['dct:title'],
          project: projectName,
          subjects: datum.counts.donors,
          dataType,
          lastUpdated: Utils.makeStandardDate(datum['dct:modified']),
          underRow: div({ style: { display: 'flex', alignItems: 'flex-start', paddingTop: '1rem' } }, [
            div({ style: { flex: '0 1 37px' } }, [
              locked ?
                h(ButtonSecondary, {
                  tooltip: 'Request Dataset Access', useTooltipAsLabel: true,
                  style: { height: 'unset' },
                  onClick: () => setRequestDatasetAccessList([datum])
                }, [icon('lock')]) :
                h(TooltipTrigger, { content: 'Open Access' }, [icon('unlock', { style: { color: colors.success() } })])
            ]),
            div({ style: { flex: 1, fontSize: 12 } }, [
              h(Collapse, { titleFirst: true, title: 'See More', buttonStyle: { flex: 'none' } }, [datum['dct:description']])
            ])
          ])
        }
      }, listData)
    })])
  }

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('browse & explore'),
    SearchAndFilterComponent({
      featuredList: catalogSnapshots, sidebarSections,
      searchType: 'Datasets',
      children: DataTable
    }),
    SelectedItemsDisplay(),
    !!requestDatasetAccessList && h(RequestDatasetAccessModal, {
      datasets: requestDatasetAccessList,
      onDismiss: () => setRequestDatasetAccessList()
    })
  ])
}

export const navPaths = [
  {
    name: 'library-browser',
    path: '/library/browser',
    component: Browser,
    title: 'Datasets',
    public: true
  }
]
