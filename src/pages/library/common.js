import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { a, div, h, label } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, ButtonSecondary, Checkbox, Clickable, IdContainer, Link, Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { libraryTopMatter } from 'src/components/library-common'
import { MiniSortable, SimpleTable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import covidBg from 'src/images/library/showcase/covid-19.jpg'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const styles = {
  header: {
    fontSize: 19, color: colors.dark(), fontWeight: 'bold', marginBottom: '1rem'
  },
  sidebarRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
  },
  nav: {
    navSection: {
      alignItems: 'center', flex: 'none', padding: '1.2rem 0',
      borderTop: `1px solid ${colors.dark(0.35)}`
    },
    title: { fontWeight: 700 }
  },
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
  },
  pill: highlight => ({
    width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
    border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
    backgroundColor: 'white',
    ...(highlight ? { color: 'white', backgroundColor: colors.accent(), borderColor: colors.accent() } : {})
  })
}


const groupByFeaturedTags = (workspaces, sidebarSections) => _.flow(
  _.flatMap(s => _.map(_.toLower, s.labels)),
  _.uniq,
  _.map(tag => [tag, _.filter(w => _.includes(tag, w.tags?.items), workspaces)]),
  _.fromPairs
)(sidebarSections)

const Sidebar = ({ onSectionFilter, onTagFilter, sections, selectedSections, selectedTags, listDataByTag }) => {
  const unionSectionWorkspacesCount = ({ tags }) => _.flow(
    _.flatMap(tag => listDataByTag[tag]),
    _.uniq,
    _.size
  )(tags)

  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    _.map(section => {
      const { keepCollapsed, name, labels } = section

      return keepCollapsed ?
        h(Clickable, {
          key: name,
          onClick: () => onSectionFilter(section),
          style: { ...styles.sidebarRow, ...styles.nav.navSection, ...styles.nav.title }
        }, [
          div({ style: { flex: 1 } }, [name]),
          div({ style: styles.pill(_.includes(section, selectedSections)) }, [unionSectionWorkspacesCount(section)])
        ]) :
        h(Collapse, {
          key: name,
          style: styles.nav.navSection,
          buttonStyle: styles.nav.title,
          titleFirst: true, initialOpenState: true,
          title: name
        }, [_.map(label => {
          const tag = _.toLower(label)
          return h(Clickable, {
            key: label,
            style: { display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' },
            onClick: () => onTagFilter(tag)
          }, [
            div({ style: { flex: 1 } }, [label]),
            div({ style: styles.pill(_.includes(tag, selectedTags)) }, [_.size(listDataByTag[tag])])
          ])
        }, labels)])
    }, sections)
  ])
}

const DatasetTable = ({ listData, sort, setSort, selectedData, toggleSelectedData, setRequestDatasetAccessList }) => {
  return div({ style: { margin: '0 15px' } }, [h(SimpleTable, {
    'aria-label': 'dataset list',
    columns: [
      {
        header: div({ className: 'sr-only' }, ['Select dataset']),
        size: { basis: 37, grow: 0 }, key: 'checkbox'
      }, {
        header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'name', onSort: setSort }, ['Dataset Name'])]),
        size: { grow: 2.2 }, key: 'name'
      }, {
        header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'project.name', onSort: setSort }, ['Project'])]),
        size: { grow: 1 }, key: 'project'
      }, {
        header: div({ style: styles.table.header }, [h(MiniSortable, { sort, field: 'subjects', onSort: setSort }, ['No. of Subjects'])]),
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
      const { name, project: { name: projectName }, subjects, dataType, lastUpdated, locked, description } = datum

      return {
        checkbox: h(Checkbox, {
          'aria-label': name,
          checked: _.includes(datum, selectedData),
          onChange: () => toggleSelectedData(datum)
        }),
        name,
        project: projectName,
        subjects,
        dataType,
        lastUpdated: Utils.makeStandardDate(lastUpdated),
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
            h(Collapse, { titleFirst: true, title: 'See More', buttonStyle: { flex: 'none' } }, [description])
          ])
        ])
      }
    }, listData)
  })])
}

const WorkspaceCard = ({ workspace }) => {
  const { namespace, name, created, description } = workspace
  return a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: {
      backgroundColor: 'white',
      height: 175,
      borderRadius: 5,
      display: 'flex',
      marginBottom: '1rem',
      boxShadow: Style.standardShadow
    }
  }, [
    div({
      style: {
        backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'auto 100%', borderRadius: '5px 0 0 5px',
        width: 87,
        ...Utils.cond(
          [name.toLowerCase().includes('covid'), () => ({ backgroundImage: `url(${covidBg})` })],
          [namespace === 'help-gatk', () => ({ backgroundColor: '#333', backgroundImage: `url(${gatkLogo})`, backgroundSize: undefined })],
          () => ({ backgroundImage: `url(${featuredBg})`, opacity: 0.75 })
        )
      }
    }),
    div({ style: { flex: 1, minWidth: 0, padding: '15px 20px', overflow: 'hidden' } }, [
      div({ style: { display: 'flex' } }, [
        div({ style: { flex: 1, color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
        created && div([Utils.makeStandardDate(created)])
      ]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
      // h(MarkdownViewer, [description]) // TODO: should we render this as markdown?
    ])
  ])
}

export const SearchAndFilterComponent = ({ featuredList, sidebarSections, activeTab, listDataType }) => {
  const [selectedSections, setSelectedSections] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  const [requestDatasetAccessList, setRequestDatasetAccessList] = useState()

  const [selectedData, setSelectedData] = useState([])

  const listDataByTag = _.omitBy(_.isEmpty, groupByFeaturedTags(featuredList, sidebarSections))

  // Trim items from the sidebar facets for which there aren't any search results
  const sections = _.flow(
    _.map(section => {
      const activeLabels = _.intersectionBy(_.toLower, section.labels, _.keys(listDataByTag))
      return {
        ...section,
        labels: activeLabels,
        tags: _.map(_.toLower, activeLabels)
      }
    }),
    _.remove(section => _.isEmpty(section.labels))
  )(sidebarSections)

  const filterBySections = listData => {
    if (_.isEmpty(selectedSections)) {
      return listData
    } else {
      const tags = _.uniqBy(_.flatMap('tags', selectedSections))
      return _.uniq(_.flatMap(tag => listDataByTag[tag], tags))
    }
  }
  const filterByTags = listData => {
    if (_.isEmpty(selectedTags)) {
      return listData
    } else {
      return _.reduce(
        (acc, tag) => _.intersection(listDataByTag[tag], acc),
        listDataByTag[_.head(selectedTags)],
        _.tail(selectedTags)
      )
    }
  }
  const filterByText = _.filter(({ lowerName, lowerDescription }) => _.includes(searchFilter, `${lowerName} ${lowerDescription}`))

  const filteredData = _.flow(
    filterBySections,
    filterByTags,
    filterByText,
    _.orderBy([sort.field], [sort.direction])
  )(featuredList)

  const toggleSelectedData = data => setSelectedData(_.xor([data]))

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !featuredList ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', margin: '1rem 1rem 0', alignItems: 'baseline' } }, [
          div({ style: { width: '19rem', flex: 'none' } }, [
            div({ style: styles.sidebarRow }, [
              div({ style: styles.header }, [`Featured ${listDataType}`]),
              div({ style: styles.pill(_.isEmpty(selectedSections) && _.isEmpty(selectedTags)) }, [_.size(filteredData)])
            ]),
            div({ style: { display: 'flex', alignItems: 'center', height: '2.5rem' } }, [
              div({ style: { flex: 1 } }),
              h(Link, {
                onClick: () => {
                  setSelectedSections([])
                  setSelectedTags([])
                }
              }, ['clear'])
            ])
          ]),
          h(DelayedSearchInput, {
            style: { flex: 1, marginLeft: '1rem' },
            'aria-label': `Search Featured ${listDataType}`,
            placeholder: 'Search Name or Description',
            value: searchFilter,
            onChange: setSearchFilter
          }),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: { margin: '0 0.5rem 0 1rem', whiteSpace: 'nowrap' } }, ['Sort by']),
              h(Select, {
                id,
                isClearable: false,
                isSearchable: false,
                styles: { container: old => ({ ...old, width: '10rem' }) },
                value: sort,
                onChange: ({ value }) => setSort(value),
                options: [
                  { value: { field: 'created', direction: 'desc' }, label: 'most recent' },
                  { value: { field: 'name', direction: 'asc' }, label: 'alphabetical' }
                ]
              })
            ])
          ])
        ]),
        div({ style: { display: 'flex', margin: '0 1rem', height: '100%' } }, [
          div({ style: { width: '19rem', flex: 'none' } }, [
            h(Sidebar, {
              onSectionFilter: section => setSelectedSections(_.xor([section])),
              onTagFilter: tag => setSelectedTags(_.xor([tag])),
              sections,
              selectedSections,
              selectedTags,
              listDataByTag: groupByFeaturedTags(filteredData, sidebarSections)
            })
          ]),
          div({ style: { marginLeft: '1rem', minWidth: 0, width: '100%', height: '100%' } }, [
            Utils.switchCase(listDataType,
              ['Datasets', () => {
                return h(DatasetTable, { listData: filteredData, sort, setSort, selectedData, toggleSelectedData, setRequestDatasetAccessList })
              }],
              ['Workspaces', () => _.map(workspace => {
                const { namespace, name } = workspace
                return h(WorkspaceCard, { key: `${namespace}:${name}`, workspace })
              }, filteredData)]
            )
          ])
        ])
      ]),
    !_.isEmpty(selectedData) && div({
      style: {
        position: 'sticky', bottom: 0, marginTop: 20,
        width: '100%', padding: '34px 60px',
        backgroundColor: 'white', boxShadow: 'rgb(0 0 0 / 30%) 0 0 8px 3px',
        fontSize: 17
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        div({ style: { flexGrow: 1 } }, [
          `${_.size(selectedData)} dataset${_.size(selectedData) !== 1 ? 's' : ''} `,
          `(${filesize(_.sumBy('files.size', selectedData))} - ${(_.sumBy('files.count', selectedData))} bam files) `,
          'selected to be saved to a Terra Workspace'
        ]),
        h(ButtonSecondary, {
          style: { fontSize: 16, marginRight: 40, textTransform: 'none' },
          onClick: () => setSelectedData([])
        }, 'Cancel'),
        h(ButtonPrimary, {
          style: { textTransform: 'none', fontSize: 14 },
          onClick: () => {}
        }, ['Save to a workspace'])
      ])
    ]),
    !!requestDatasetAccessList && h(RequestDatasetAccessModal, {
      datasets: requestDatasetAccessList,
      onDismiss: () => setRequestDatasetAccessList()
    })
  ])
}
