import filesize from 'filesize'
import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
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
    header: {
      color: colors.accent(),
      height: 16,
      textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem'
    },
    row: {
      backgroundColor: '#ffffff',
      borderRadius: 5, border: '1px solid rgba(0,0,0,.15)',
      margin: '0 -15px 15px', padding: 15
    }
  }
}

const getRawList = () => new Promise(resolve => setTimeout(() => {
  resolve(tempData.default.data)
}, 1000))

const Browser = () => {
  const stateHistory = StateHistory.get()
  const [catalogSnapshots, setCatalogSnapshots] = useState(stateHistory.catalogSnapshots)
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  const [selectedData, setSelectedData] = useState([])
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
    [sort.field === 'most recent', () => _.orderBy(['created'], ['desc'])],
    [sort.field === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w['dct:title'])), ['asc'])],
    [sort.field === 'Dataset Name', () => _.orderBy(w => _.toLower(_.trim(w['dct:title'])), [sort.direction])],
    [sort.field === 'Project', () => _.orderBy(w => _.toLower(_.trim(w.project)), [sort.direction])],
    [sort.field === 'No. of Subjects', () => _.orderBy(['counts.donors', 'lowerName'], [sort.direction])],
    [sort.field === 'Data Type', () => _.orderBy(['dataType', 'lowerName'], [sort.direction])],
    [sort.field === 'Last Updated', () => _.orderBy(['lastUpdated', 'lowerName'], [sort.direction])],
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
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'Dataset Name', onSort: setSort }, ['Dataset Name'])]),
          size: { grow: 2.2 }, key: 'name'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'Project', onSort: setSort }, ['Project'])]),
          size: { grow: 1 }, key: 'project'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'No. of Subjects', onSort: setSort }, ['No. of Subjects'])]),
          size: { grow: 1 }, key: 'subjects'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'Data Type', onSort: setSort }, ['Data Type'])]),
          size: { grow: 1 }, key: 'dataType'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'Last Updated', onSort: setSort }, ['Last Updated'])]),
          size: { grow: 1 }, key: 'lastUpdated'
        }
      ],
      rowStyle: styles.table.row,
      cellStyle: { border: 'none', paddingRight: 15 },
      useHover: false,
      underRowKey: 'underRow',
      rows: _.map(datum => {
        const { project, dataType, locked } = datum
        return {
          checkbox: h(Checkbox, {
            'aria-label': datum['dct:title'],
            checked: _.includes(datum, selectedData),
            onChange: () => toggleSelectedData(datum)
          }),
          name: h(Link,
            { onClick: () => Nav.goToPath('library-details', { id: datum['dct:identifier'] }) },
            [datum['dct:title']]
          ),
          project,
          subjects: datum?.counts?.donors,
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
              h(Collapse, { titleFirst: true, title: 'See More', buttonStyle: { flex: 'none', marginBottom: 0, marginTop: 3 } }, [datum['dct:description']])
            ])
          ])
        }
      }, sortData(listData))
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
