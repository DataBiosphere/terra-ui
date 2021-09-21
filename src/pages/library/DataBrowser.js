import filesize from 'filesize'
import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Checkbox, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
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
        name: snapshot['dct:title'],
        description: snapshot['dct:description'],
        project: _.get('0.dct:title', snapshot['TerraDCAT_ap:hasDataCollection']),
        lastUpdated: snapshot['dct:modified'],
        lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description'])
      }), rawList)

      setCatalogSnapshots(normList)
      StateHistory.update({ catalogSnapshots })
    }
    loadData()
  })

  const sortData = Utils.cond(
    [sort === 'most recent', () => _.orderBy(['created'], ['desc'])],
    [sort === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w.name)), ['asc'])],
    [sort === 'Dataset Name', () => _.orderBy(w => _.toLower(_.trim(w.name)), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Project', () => _.orderBy(w => _.toLower(_.trim(w.project)), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'No. of Subjects', () => _.orderBy(['subjects', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Data Type', () => _.orderBy(['dataType', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Last Updated', () => _.orderBy(['lastUpdated', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    () => _.identity
  )

  const toggleSelectedData = data => {
    if (_.some(data, selectedData)) {
      setSelectedData(_.filter(d => !_.isEqual(d, data), selectedData))
    } else {
      setSelectedData([...selectedData, data])
    }
  }

  const toggleOpenedData = data => {
    if (_.some(data, openedData)) {
      setOpenedData(_.filter(d => !_.isEqual(d, data), openedData))
    } else {
      setOpenedData([...openedData, data])
    }
  }

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

  const DatasetTableHeader = (headerStyles, headerName, sortable = false) => {
    return div({ style: { ...styles.table.header, ...headerStyles } }, [
      sortable ?
        h(Link, {
          onClick: () => {
            if (sort === headerName) {
              setSortDir(sortDir * -1)
            } else {
              setSort(headerName)
              setSortDir(1)
            }
          },
          style: { fontWeight: 600 }
        }, [
          headerName,
          icon(
            sortDir === 1 ? 'long-arrow-alt-up' : 'long-arrow-alt-down',
            {
              size: 12,
              style: {
                visibility: `${sort === headerName ? 'visible' : 'hidden'}`,
                marginTop: '5'
              },
              'aria-label': `Sorted by ${sortDir === 1 ? 'ascending' : 'descending'}`
            }
          )
        ]) : div({ style: styles.table.header }, [headerName])
    ])
  }

  const DatasetTable = filteredList => {
    return div({ style: styles.table.table }, [
      div({ style: { ...styles.table.flexTableRow, marginBottom: -15 } }, [
        div({ style: { ...styles.table.col, ...styles.table.firstElem } }, ''),
        DatasetTableHeader({ flex: 2.2 }, 'Dataset Name', true),
        DatasetTableHeader({}, 'Project', true),
        DatasetTableHeader({}, 'No. of Subjects', true),
        DatasetTableHeader({}, 'Data Type', true),
        DatasetTableHeader(styles.table.lastElem, 'Last Updated', true)
      ]),

      div(sortData(filteredList).map(listdatum => {
        return div({ style: styles.table.row }, [
          div({ style: styles.table.flexTableRow, key: `${listdatum.namespace}:${listdatum.name}` },
            [
              div(
                { style: { ...styles.table.col, ...styles.table.firstElem, alignSelf: 'flex-start' } },
                [
                  label({
                    onClick: () => toggleSelectedData(listdatum),
                    htmlFor: `${listdatum.namespace}:${listdatum.name}-checkbox`
                  }, [
                    h(Checkbox, {
                      id: `${listdatum.namespace}:${listdatum.name}-checkbox`,
                      checked: _.some(listdatum, selectedData),
                      style: { marginRight: '0.2rem' }
                    })
                  ])
                ]
              ),
              div({ style: { ...styles.table.col, flex: 2.2 } }, [
                h(Link, {
                  href: Nav.getLink(`library-details`, { id: listdatum['dct:identifier'] })
                }, [listdatum.name])
              ]),
              div({ style: styles.table.col }, listdatum.project),
              div({ style: styles.table.col }, listdatum.subjects),
              div({ style: styles.table.col }, listdatum.dataType),
              div({ style: { ...styles.table.col, ...styles.table.lastElem } }, Utils.makeStandardDate(listdatum.lastUpdated))
            ]
          ),
          div({ style: { ...styles.table.flexTableRow, alignItems: 'flex-start' } }, [
            div({ style: { ...styles.table.col, ...styles.table.firstElem } }, [
              listdatum.locked ?
                h(ButtonSecondary, {
                  tooltip: 'Request Dataset Access', useTooltipAsLabel: true,
                  style: { margin: '-7px 0' },
                  onClick: () => setRequestDatasetAccessList([listdatum])
                }, [icon('lock', { size: 12 })]) :
                h(TooltipTrigger, { content: 'Open Access' }, [icon('lock-o', { size: 12, style: { marginTop: 5, color: colors.primary() } })])
            ]),
            div({ style: { ...styles.table.col, width: '100%', fontSize: 12 } }, [
              h(Link,
                { onClick: () => toggleOpenedData(listdatum) },
                [
                  `See ${_.some(listdatum, openedData) ? 'Less' : 'More'}`,
                  icon(_.some(listdatum, openedData) ? 'angle-up' : 'angle-down', { size: 12, style: { marginTop: 5 } })
                ]
              ),
              div({ style: { display: _.some(listdatum, openedData) ? 'block' : 'none', marginTop: 10 } }, listdatum.description)
            ])
          ])
        ])
      })),
      !_.isEmpty(requestDatasetAccessList) && h(RequestDatasetAccessModal, {
        datasets: requestDatasetAccessList,
        onDismiss: () => setRequestDatasetAccessList([])
      })
    ])
  }

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('browse & explore'),
    SearchAndFilterComponent({
      featuredList: catalogSnapshots, sidebarSections,
      searchType: 'featured workspaces',
      children: DatasetTable
    }),
    SelectedItemsDisplay()
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
