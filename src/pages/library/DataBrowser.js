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
import { datasetAccessTypes, datasetReleasePolicies, useDataCatalog } from 'src/pages/library/dataBrowser-utils'
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

const getUnique = (prop, data) => _.flow(
  _.flatMap(prop),
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
    labels: getUnique('project', dataCatalog)
  }, {
    name: 'Data use policy',
    labels: getUnique('dataReleasePolicy.policy', dataCatalog),
    labelRenderer: rawPolicy => {
      const { label, desc } = datasetReleasePolicies[rawPolicy] || datasetReleasePolicies.releasepolicy_other
      return [div({ key: rawPolicy, style: { display: 'flex', flexDirection: 'column' } }, [
        label ? label : rawPolicy,
        desc && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [desc])
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

const allColumns = {
  project: { title: 'Consortium', contents: datum => datum.project },
  subjects: { title: 'No. of Subjects', contents: datum => datum?.counts?.donors },
  dataModality: { title: 'Data Modality', contents: datum => _.join(', ', datum.dataModality) },
  lastUpdated: { title: 'Last Updated', contents: datum => datum.lastUpdated ? Utils.makeStandardDate(datum.lastUpdated) : null },
}

const DataBrowserTableComponent = ({ sort, setSort, setRequestDatasetAccessList }) => {
  const [cols, setCols] = useState(['project', 'subjects', 'dataModality', 'lastUpdated'])
  return ({ filteredList }) => {
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
      onSave: setCols, columnSettings: cols,
      style: { backgroundColor: 'unset', height: '2.5rem', width: '2.5rem', border: 0, right: 15 }
    })])
  }
}

export const Browser = () => {
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  const [requestDatasetAccessList, setRequestDatasetAccessList] = useState()
  const { dataCatalog, loading } = useDataCatalog()

  return h(Fragment, [
    h(SearchAndFilterComponent, {
      fullList: dataCatalog, sidebarSections: extractCatalogFilters(dataCatalog),
      customSort: sort,
      searchType: 'Datasets',
      titleField: 'dct:title',
      descField: 'dct:description',
      idField: 'id'
    }, [DataBrowserTableComponent({ sort, setSort, setRequestDatasetAccessList })]),
    !!requestDatasetAccessList && h(RequestDatasetAccessModal, {
      datasets: requestDatasetAccessList,
      onDismiss: () => setRequestDatasetAccessList()
    }),
    loading && spinnerOverlay
  ])
}
