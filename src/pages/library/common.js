import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { UnmountClosed as RCollapse } from 'react-collapse'
import { a, div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Checkbox, Clickable, IdContainer, Link, Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { libraryTopMatter } from 'src/components/library-common'
import covidBg from 'src/images/library/showcase/covid-19.jpg'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export const styles = {
  column: { marginRight: '1.5rem', flex: '1 1 0px', maxWidth: 415 },
  header: {
    fontSize: 19, color: colors.dark(), fontWeight: 'bold', textTransform: 'capitalize',
    marginBottom: '1rem'
  },
  sidebarRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer'
    },
    container: state => ({
      ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(-2rem)' }),
      transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      display: 'flex', flexDirection: 'column'
    }),
    navSection: {
      alignItems: 'center', flex: 'none', padding: '1.2rem 0', fontWeight: 700,
      borderTop: `1px solid ${colors.dark(0.35)}`
    }
  },
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
  },
  pill: {
    width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
    border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
    backgroundColor: 'white'
  },
  pillHighlight: {
    color: 'white', backgroundColor: colors.primary(1), borderColor: colors.primary(1)
  }
}

// collapsible section for sidebar categories
const SidebarCollapser = ({ title, isOpened, onClick, children }) => {
  return div({
    role: 'group'
  }, [
    h(NavItem, {
      onClick,
      style: { ...styles.sidebarRow, ...styles.nav.navSection }
    }, [
      title,
      div({ style: { flexGrow: 1 } }),
      icon(isOpened ? 'angle-up' : 'angle-down', { size: 18, style: { flex: 'none' } })
    ]),
    div({
      style: { flex: 'none' }
    }, [h(RCollapse, { isOpened }, [children])])
  ])
}

const NavItem = ({ children, ...props }) => {
  return h(Clickable, _.merge({
    style: { display: 'flex', alignItems: 'center', outlineOffset: -4 }
  }, props), [children])
}

export const Pill = ({ count, highlight }) => {
  return div({
    style: _.merge(styles.pill, highlight ? styles.pillHighlight : {})
  }, [count])
}

const uniqueSidebarTags = sidebarSections => {
  return _.flow(
    _.flatMap(s => _.map(_.toLower, s.labels)),
    _.uniq
  )(sidebarSections)
}

export const groupByFeaturedTags = (workspaces, sidebarSections) => {
  return _.flow([
    _.map(tag => [tag, _.filter(w => _.includes(tag, w.tags?.items), workspaces)]),
    _.fromPairs
  ])(uniqueSidebarTags(sidebarSections))
}

export const Sidebar = ({ onSectionFilter, onTagFilter, sections, selectedSections, selectedTags, listdataByTag }) => {
  const [collapsedSections, setCollapsedSections] = useState([])

  const unionSectionWorkspaces = section => {
    return _.uniq(_.flatMap(tag => listdataByTag[tag], section.tags))
  }

  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    _.map(section => {
      return section.keepCollapsed ?
        h(Clickable, {
          key: section.name,
          onClick: () => onSectionFilter(section),
          style: { ...styles.sidebarRow, ...styles.nav.navSection }
        }, [
          div({ style: { flex: 1 } }, [section.name]),
          h(Pill, {
            count: _.size(unionSectionWorkspaces(section)),
            highlight: _.includes(section, selectedSections)
          })
        ]) :
        h(SidebarCollapser, {
          key: section.name,
          title: section.name,
          onClick: () => setCollapsedSections(_.xor([section], collapsedSections)),
          isOpened: !_.includes(section, collapsedSections)
        }, [_.map(label => {
          const tag = _.toLower(label)
          return h(Clickable, {
            key: label,
            style: { display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' },
            onClick: () => onTagFilter(tag)
          }, [
            div({ style: { flex: 1 } }, [label]),
            h(Pill, {
              count: _.size(listdataByTag[tag]),
              highlight: _.includes(tag, selectedTags)
            })
          ])
        }, section.labels)])
    }, sections)
  ])
}

export const selectionActionComponent = (selectedData, setSelectedData) => {
  const length = selectedData.length
  const files = _.sumBy('files', selectedData)
  const totalBytes = _.sumBy('fileSize', selectedData)
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

export const SearchAndFilterComponent = (featuredList, sidebarSections, activeTab, listdataType = 'workspaces') => {
  const [selectedSections, setSelectedSections] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchFilter, setSearchFilter] = useState()
  const [sort, setSort] = useState('most recent')
  const [sortDir, setSortDir] = useState(1)

  const [selectedData, setSelectedData] = useState([])
  const [openedData, setOpenedData] = useState([])

  const listdataByTag = _.omitBy(_.isEmpty, groupByFeaturedTags(featuredList, sidebarSections))

  // Trim items from the sidebar facets for which there aren't any search results
  const activeTags = _.keys(listdataByTag)
  const sections = _.flow(
    _.map(section => {
      const activeLabels = _.intersectionBy(_.toLower, section.labels, activeTags)
      return {
        ...section,
        labels: activeLabels,
        tags: _.map(_.toLower, activeLabels)
      }
    }),
    _.remove(section => _.isEmpty(section.labels))
  )(sidebarSections)

  const sortData = Utils.cond(
    [sort === 'most recent', () => _.orderBy(['created'], ['desc'])],
    [sort === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w.name)), ['asc'])],
    [sort === 'Dataset Name', () => _.orderBy(w => _.toLower(_.trim(w.name)), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Project', () => _.orderBy(w => _.toLower(_.trim(w.project.name)), [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'No. of Subjects', () => _.orderBy(['subjects', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Data Type', () => _.orderBy(['dataType', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    [sort === 'Last Updated', () => _.orderBy(['lastUpdated', 'lowerName'], [sortDir === 1 ? 'asc' : 'desc'])],
    () => _.identity
  )

  const filterBySections = listdata => {
    if (_.isEmpty(selectedSections)) {
      return listdata
    } else {
      const tags = _.uniq(_.flatMap(section => section.tags, selectedSections))
      return _.uniq(_.flatMap(tag => listdataByTag[tag], tags))
    }
  }
  const filterByTags = listdata => {
    if (_.isEmpty(selectedTags)) {
      return listdata
    } else {
      let ret = listdata
      const datasets = _.map(tag => listdataByTag[tag], selectedTags)
      datasets.forEach(datasetsForTag => ret = _.intersection(datasetsForTag, ret))
      return ret
    }
  }
  const filterByText = listdata => {
    const lowerSearch = _.toLower(searchFilter)
    return _.isEmpty(lowerSearch) ?
      listdata :
      _.filter(listdatum => _.includes(lowerSearch, listdatum.lowerName) || _.includes(lowerSearch, listdatum.lowerDescription), listdata)
  }
  const filteredData = _.flow(
    filterBySections,
    filterByTags,
    filterByText
  )(featuredList)

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

  const makeListDisplay = (listdataType, listdata) => {
    switch (listdataType) {
      case 'datasets': return makeTable(listdata, sort, setSort, sortDir, setSortDir, selectedData, toggleSelectedData, openedData, toggleOpenedData)
      case 'workspaces': return _.map(makeCard(), listdata)
      default: return null
    }
  }

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !featuredList ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', margin: '1rem 1rem 0', alignItems: 'baseline' } }, [
          div({ style: { width: '19rem', flex: 'none' } }, [
            div({ style: styles.sidebarRow }, [
              div({ style: styles.header }, `Featured ${listdataType}`),
              h(Pill, {
                count: _.size(filteredData),
                highlight: _.isEmpty(selectedSections) && _.isEmpty(selectedTags)
              })
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
            'aria-label': `Search Featured ${listdataType}`,
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
                onChange: v => setSort(v.value),
                options: ['most recent', 'alphabetical']
              })
            ])
          ])
        ]),
        div({ style: { display: 'flex', margin: '0 1rem', height: '100%' } }, [
          div({ style: { width: '19rem', flex: 'none' } }, [
            h(Sidebar, {
              onSectionFilter: section => setSelectedSections(_.xor([section], selectedSections)),
              onTagFilter: tag => setSelectedTags(_.xor([tag], selectedTags)),
              sections,
              selectedSections,
              selectedTags,
              listdataByTag: groupByFeaturedTags(filteredData, sidebarSections)
            })
          ]),
          div({ style: { marginLeft: '1rem', minWidth: 0, width: '100%', height: '100%' } }, [
            makeListDisplay(listdataType, sortData(filteredData))
          ])
        ])
      ]),

    selectionActionComponent(selectedData, setSelectedData)
  ])
}

const makeTable = (listData, sort, setSort, sortDir, setSortDir, selectedData, toggleSelectedData, openedData, toggleOpenedData) => {
  const makeTableHeader = (headerStyles, headerName, sortable = false) => {
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

  return div({ style: styles.table.table }, [
    div({ style: { ...styles.table.flexTableRow, marginBottom: -15 } }, [
      div({ style: { ...styles.table.col, ...styles.table.firstElem } }, ''),
      makeTableHeader({ flex: 2.2 }, 'Dataset Name', true),
      makeTableHeader({}, 'Project', true),
      makeTableHeader({}, 'No. of Subjects', true),
      makeTableHeader({}, 'Data Type', true),
      makeTableHeader(styles.table.lastElem, 'Last Updated', true)
    ]),

    div(listData.map(listdatum => {
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
            div({ style: { ...styles.table.col, flex: 2.2 } }, listdatum.name),
            div({ style: styles.table.col }, listdatum.project.name),
            div({ style: styles.table.col }, listdatum.subjects),
            div({ style: styles.table.col }, listdatum.dataType),
            div({ style: { ...styles.table.col, ...styles.table.lastElem } }, Utils.makeStandardDate(listdatum.lastUpdated))
          ]
        ),
        div({ style: { ...styles.table.flexTableRow, alignItems: 'flex-start' } }, [
          div({ style: { ...styles.table.col, ...styles.table.firstElem } }, [
            icon(listdatum.locked ? 'lock' : 'lock-o', { size: 12, style: { flex: 'none', color: listdatum.locked ? colors.accent() : colors.primary() } })
          ]),
          div({ style: { ...styles.table.col, width: '100%', fontSize: 12 } }, [
            h(Link,
              { onClick: () => toggleOpenedData(listdatum) },
              [
                `See ${_.some(listdatum, openedData) ? 'Less' : 'More'}`,
                icon(_.some(listdatum, openedData) ? 'angle-up' : 'angle-down', { size: 12, style: { flex: 'none', marginTop: 5 } })
              ]
            ),
            div({ style: { display: _.some(listdatum, openedData) ? 'block' : 'none', marginTop: 10 } }, listdatum.description)
          ])
        ])
      ])
    }))
  ])
}

const makeCard = variant => workspace => {
  const { namespace, name, created, description } = workspace
  return a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    key: `${namespace}:${name}`,
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
          [variant === 'gatk', () => ({ backgroundColor: '#333', backgroundImage: `url(${gatkLogo})`, backgroundSize: undefined })],
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


