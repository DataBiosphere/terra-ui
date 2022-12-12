import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonOutline, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ColumnSelector, MiniSortable, SimpleTable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { commonStyles, SearchAndFilterComponent } from 'src/pages/library/common'
import {
  datasetAccessTypes, DatasetReleasePolicyDisplayInformation, getConsortiumsFromDataset,
  getDatasetReleasePoliciesDisplayInformation,
  useDataCatalog
} from 'src/pages/library/dataBrowser-utils'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const styles = {
  ...commonStyles,
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

const getUnique = (mapper, data) => _.flow(
  _.flatMap(mapper),
  _.compact,
  _.uniq,
  _.sortBy(_.toLower)
)(data)

// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const extractCatalogFilters = dataCatalog => {
  return [{
    name: 'Access type',
    labels: _.values(datasetAccessTypes),
    labelRenderer: accessValue => {
      const lowerKey = _.toLower(accessValue)
      const iconKey = accessValue === datasetAccessTypes.GRANTED ? 'unlock' : 'lock'
      return [div({ key: `access-filter-${lowerKey}`, style: { display: 'flex' } }, [
        icon(iconKey, { style: { color: styles.access[lowerKey], marginRight: 5 } }),
        div([accessValue])
      ])]
    }
  }, {
    name: 'Consortium',
    labels: getUnique(dataset => getConsortiumsFromDataset(dataset), dataCatalog)
  }, {
    name: 'Data use policy',
    labels: getUnique(dataset => getDatasetReleasePoliciesDisplayInformation(dataset['TerraDCAT_ap:hasDataUsePermission']).label, dataCatalog),
    labelRenderer: rawPolicy => {
      return [div({ key: rawPolicy, style: { display: 'flex', flexDirection: 'column' } }, [
        h(DatasetReleasePolicyDisplayInformation, { dataUsePermission: rawPolicy })
      ])]
    }
  }, {
    name: 'Data modality',
    labels: getUnique('dataModality', dataCatalog)
  }, {
    name: 'Data type',
    labels: getUnique('dataType', dataCatalog)
  }, {
    name: 'File type',
    labels: getUnique('dcat:mediaType', _.flatMap('files', dataCatalog))
  }, {
    name: 'Disease',
    labels: getUnique('samples.disease', dataCatalog)
  }, {
    name: 'Species',
    labels: getUnique('samples.genus', dataCatalog)
  }]
}

// All possible columns for the catalog's table view. The default columns shown are declared below in `Browser`.
const allColumns = {
  // A column is a key, title and a function that produces the table contents for that column, given a row.
  consortiums: { title: 'Consortiums', contents: row => _.join(', ', getConsortiumsFromDataset(row)) },
  subjects: { title: 'No. of Subjects', contents: row => row?.counts?.donors },
  dataModality: { title: 'Data Modality', contents: row => _.join(', ', row.dataModality) },
  lastUpdated: { title: 'Last Updated', contents: row => row.lastUpdated ? Utils.makeStandardDate(row.lastUpdated) : null },
  dataType: { title: 'Data type', contents: row => _.join(', ', getUnique('dataType', { row })) },
  fileType: { title: 'File type', contents: row => _.join(', ', getUnique('dcat:mediaType', row['files'])) },
  species: { title: 'Species', contents: row => _.join(', ', getUnique('samples.genus', { row })) }
}

// Columns are stored as a list of column key names in `cols` below. The column settings that the ColumnSelector dialog uses contains
// the column title, key and a visible flag.
//
// These functions convert between the two formats.

export const convertSettingsToCols = _.flow(
  _.filter(columnSetting => columnSetting.visible),
  _.map(columnSetting => columnSetting.key)
)

export const convertColsToSettings = cols => _.flow(
  _.toPairs,
  _.map(([k, v]) => {
    return { name: v.title, key: k, visible: _.includes(k, cols) }
  })
)(allColumns)

const DataBrowserTableComponent = ({ sort, setSort, setRequestDatasetAccessList, cols, setCols, filteredList }) => {
  return div({ style: { position: 'relative', margin: '0 15px' } }, [h(SimpleTable, {
    'aria-label': 'dataset list',
    columns: [
      {
        header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'dct:title', onSort: setSort }, ['Dataset Name'])]),
        size: { grow: 2.2 }, key: 'name'
      },
      ..._.map(columnKey => {
        return {
          header: div({ style: styles.table.header },
            [h(MiniSortable, { sort, field: columnKey, onSort: setSort }, [allColumns[columnKey].title])]),
          size: { grow: 1 }, key: columnKey
        }
      }, cols)
    ],
    rowStyle: styles.table.row,
    cellStyle: { border: 'none', paddingRight: 15 },
    useHover: false,
    underRowKey: 'underRow',
    rows: _.map(datum => {
      const { requestAccessURL, access } = datum
      return {
        name: h(Link,
          {
            onClick: () => {
              Ajax().Metrics.captureEvent(`${Events.catalogView}:details`, {
                id: datum.id,
                title: datum['dct:title']
              })
              Nav.goToPath('library-details', { id: datum.id })
            }
          },
          [datum['dct:title']]
        ),
        ..._.reduce((reduced, columnKey) => { return { ...reduced, [columnKey]: allColumns[columnKey].contents(datum) } }, {}, cols),
        underRow: div({ style: { display: 'flex', alignItems: 'flex-start', paddingTop: '1rem' } }, [
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            Utils.cond(
              [!!requestAccessURL && access === datasetAccessTypes.CONTROLLED, () => h(ButtonOutline, {
                style: { height: 'unset', textTransform: 'none', padding: '.5rem' },
                href: requestAccessURL, target: '_blank'
              }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])],
              [access === datasetAccessTypes.CONTROLLED, () => h(ButtonOutline, {
                style: { height: 'unset', textTransform: 'none', padding: '.5rem' },
                onClick: () => {
                  setRequestDatasetAccessList([datum])
                  Ajax().Metrics.captureEvent(`${Events.catalogRequestAccess}:popUp`, {
                    id: datum.id,
                    title: datum['dct:title']
                  })
                }
              }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])],
              [access === datasetAccessTypes.PENDING, () => div({ style: { color: styles.access.pending, display: 'flex' } }, [
                icon('lock'),
                div({ style: { paddingLeft: 10, paddingTop: 4, fontSize: 12 } }, ['Pending Access'])
              ])],
              [access === datasetAccessTypes.EXTERNAL, () => h(ButtonOutline, {
                style: { height: 'unset', textTransform: 'none', padding: '.5rem' },
                href: datum['dcat:accessURL'], target: '_blank'
              }, [div({ style: { fontSize: 12 } }, ['Externally managed']), icon('pop-out', { style: { marginLeft: 10 }, size: 16 })])],
              [Utils.DEFAULT, () => div({ style: { color: styles.access.granted, display: 'flex' } }, [
                icon('unlock'),
                div({ style: { paddingLeft: 10, paddingTop: 4, fontSize: 12 } }, ['Granted Access'])
              ])])
          ])
        ])
      }
    }, filteredList)
  }),
  h(ColumnSelector, {
    onSave: _.flow(convertSettingsToCols, setCols),
    columnSettings: convertColsToSettings(cols),
    style: { backgroundColor: 'unset', width: 'auto', height: 'auto', border: 0 }
  })])
}

export const Browser = () => {
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  // This state contains the current set of visible columns, in the order that they appear.
  // Note that the Dataset Name column isn't customizable and is always shown first.
  const [cols, setCols] = useState(['consortiums', 'subjects', 'dataModality', 'lastUpdated'])
  const [requestDatasetAccessList, setRequestDatasetAccessList] = useState()
  const { dataCatalog, loading } = useDataCatalog()

  return h(Fragment, [
    h(SearchAndFilterComponent, {
      fullList: dataCatalog, sidebarSections: extractCatalogFilters(dataCatalog),
      customSort: sort,
      searchType: 'Datasets',
      titleField: 'dct:title',
      descField: 'dct:description',
      idField: 'id',
      listView: filteredList => DataBrowserTableComponent({ sort, setSort, setRequestDatasetAccessList, cols, setCols, filteredList })
    }),
    !!requestDatasetAccessList && h(RequestDatasetAccessModal, {
      datasets: requestDatasetAccessList,
      onDismiss: () => setRequestDatasetAccessList()
    }),
    loading && spinnerOverlay
  ])
}
