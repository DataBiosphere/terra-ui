import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Checkbox, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { MiniSortable, SimpleTable } from 'src/components/table'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { commonStyles, SearchAndFilterComponent } from 'src/pages/library/common'
import { importDataToWorkspace, snapshotAccessTypes, snapshotReleasePolicies, useDataCatalog } from 'src/pages/library/dataBrowser-utils'
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
    labels: _.values(snapshotAccessTypes),
    labelRenderer: accessValue => {
      const lowerKey = _.toLower(accessValue)
      const iconKey = accessValue === snapshotAccessTypes.GRANTED ? 'unlock' : 'lock'
      return [div({ key: `access-filter-${lowerKey}`, style: { display: 'flex' } }, [
        icon(iconKey, { style: { color: styles.access[lowerKey], marginRight: 5 } }),
        div([accessValue])
      ])]
    }
  }, {
    name: 'Data use policy',
    labels: getUnique('dataReleasePolicy.policy', dataCatalog),
    labelRenderer: rawPolicy => {
      const { label, desc } = snapshotReleasePolicies[rawPolicy] || snapshotReleasePolicies.releasepolicy_other
      return [div({ key: rawPolicy, style: { display: 'flex', flexDirection: 'column' } }, [
        label ? label : rawPolicy,
        desc && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [desc])
      ])]
    }
  }, {
    name: 'Consortium',
    labels: getUnique('project', dataCatalog)
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

const SelectedItemsDisplay = ({ selectedData, setSelectedData }) => {
  const length = _.size(selectedData).toLocaleString()

  return !_.isEmpty(selectedData) && div({
    style: {
      display: selectedData.length > 0 ? 'block' : 'none',
      position: 'sticky', bottom: 0, marginTop: 20,
      width: '100%', padding: '34px 60px',
      backgroundColor: 'white', boxShadow: 'rgb(0 0 0 / 30%) 0 0 8px 3px',
      fontSize: 17
    }
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: { flexGrow: 1 } }, [
        `${length} dataset${length > 1 ? 's' : ''} selected to be linked to a Terra Workspace`
      ]),
      h(ButtonSecondary, {
        style: { fontSize: 16, marginRight: 40, textTransform: 'none' },
        onClick: () => setSelectedData([])
      }, 'Cancel'),
      h(ButtonPrimary, {
        style: { textTransform: 'none', fontSize: 14 },
        onClick: () => {
          Ajax().Metrics.captureEvent(`${Events.catalogWorkspaceLink}:tableView`, {
            snapshotIds: _.map('dct:identifier', selectedData),
            snapshotName: _.map('dct:title', selectedData)
          })
          importDataToWorkspace(selectedData)
        }
      }, ['Link to a workspace'])
    ])
  ])
}


const makeDataBrowserTableComponent = ({ sort, setSort, selectedData, toggleSelectedData, setRequestDatasetAccessList, showProjectFilters, setShowProjectFilters }) => {
  const DataBrowserTable = ({ filteredList, setSelectedTags, selectedTags, sections }) => {
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
          header: div({ style: styles.table.header }, [
            h(ButtonSecondary, {
              style: { height: '1rem', fontSize: '.75rem', fontWeight: 600, position: 'relative' },
              onClick: () => setShowProjectFilters(!showProjectFilters)
            }, ['Project', icon('caretDown')]),
            showProjectFilters && div({
              style: {
                backgroundColor: 'white', width: 380, height: 280, overflowY: 'auto',
                border: '1px solid', borderColor: colors.accent(), borderRadius: 3,
                position: 'absolute', padding: 15, marginTop: 4, boxShadow: 'rgb(0 0 0 / 5%) 0 0 8px 5px',
                textTransform: 'none', color: 'gray', fontSize: '.9rem', fontWeight: 400
              }
            }, _.map(tag => {
              return div({ key: `project-filter-dropdown_${tag}`, style: { height: '3rem' } }, [
                h(LabeledCheckbox, {
                  style: { marginRight: 10 },
                  'aria-label': tag,
                  checked: _.includes(tag.toLowerCase(), selectedTags),
                  onChange: () => {
                    Ajax().Metrics.captureEvent(`${Events.catalogFilter}:tableHeader`, { tag })
                    setSelectedTags(_.xor([tag.toLowerCase()]))
                  }
                }, [tag])
              ])
            }, sections[1].labels))
          ]),
          size: { grow: 1 }, key: 'project'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'counts.donors', onSort: setSort }, ['No. of Subjects'])]),
          size: { grow: 1 }, key: 'subjects'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'dataType', onSort: setSort }, ['Data Type'])]),
          size: { grow: 1 }, key: 'dataType'
        }, {
          header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'lastUpdated', onSort: setSort }, ['Last Updated'])]),
          size: { grow: 1 }, key: 'lastUpdated'
        }
      ],
      rowStyle: styles.table.row,
      cellStyle: { border: 'none', paddingRight: 15 },
      useHover: false,
      underRowKey: 'underRow',
      rows: _.map(datum => {
        const { project, dataType, access } = datum

        return {
          checkbox: h(Checkbox, {
            'aria-label': datum['dct:title'],
            checked: _.includes(datum, selectedData),
            onChange: () => toggleSelectedData(datum)
          }),
          name: h(Link,
            {
              onClick: () => {
                Ajax().Metrics.captureEvent(`${Events.catalogView}:details`, {
                  id: datum['dct:identifier'],
                  title: datum['dct:title']
                })
                Nav.goToPath('library-details', { id: datum['dct:identifier'] })
              }
            },
            [datum['dct:title']]
          ),
          project,
          subjects: datum?.counts?.donors,
          dataType: dataType.join(', '),
          lastUpdated: datum.lastUpdated ? Utils.makeStandardDate(datum.lastUpdated) : null,
          underRow: div({ style: { display: 'flex', alignItems: 'flex-start', paddingTop: '1rem' } }, [
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              Utils.switchCase(access,
                [snapshotAccessTypes.CONTROLLED, () => h(ButtonOutline, {
                  style: { height: 'unset', textTransform: 'none', padding: '.5rem' },
                  onClick: () => setRequestDatasetAccessList([datum])
                }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])],
                [snapshotAccessTypes.PENDING, () => div({ style: { color: styles.access.pending, display: 'flex' } }, [
                  icon('lock'),
                  div({ style: { paddingLeft: 10, paddingTop: 4, fontSize: 12 } }, ['Pending Access'])
                ])],
                [Utils.DEFAULT, () => div({ style: { color: styles.access.granted, display: 'flex' } }, [
                  icon('unlock'),
                  div({ style: { paddingLeft: 10, paddingTop: 4, fontSize: 12 } }, ['Granted Access'])
                ])])
            ])
          ])
        }
      }, filteredList)
    })])
  }

  return DataBrowserTable
}

const Browser = () => {
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  const [showProjectFilters, setShowProjectFilters] = useState(false)
  const [selectedData, setSelectedData] = useState([])
  const [requestDatasetAccessList, setRequestDatasetAccessList] = useState()
  const { dataCatalog, loading } = useDataCatalog()

  const toggleSelectedData = data => setSelectedData(_.xor([data]))

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('browse & explore'),
    h(SearchAndFilterComponent, {
      fullList: dataCatalog, sidebarSections: extractCatalogFilters(dataCatalog),
      customSort: sort,
      searchType: 'Datasets'
    }, [makeDataBrowserTableComponent({ sort, setSort, selectedData, toggleSelectedData, setRequestDatasetAccessList, showProjectFilters, setShowProjectFilters })]),
    h(SelectedItemsDisplay, { selectedData, setSelectedData }, []),
    !!requestDatasetAccessList && h(RequestDatasetAccessModal, {
      datasets: requestDatasetAccessList,
      onDismiss: () => setRequestDatasetAccessList()
    }),
    loading && spinnerOverlay
  ])
}

export const navPaths = [
  {
    name: 'library-browser',
    path: '/library/browser',
    component: Browser,
    title: 'Datasets',
    public: false
  }
]
