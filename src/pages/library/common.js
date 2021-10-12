import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { Clickable, IdContainer, Link, Select } from 'src/components/common'
import { DelayedSearchInput } from 'src/components/input'
import colors from 'src/libs/colors'


export const commonStyles = {
  access: {
    open: colors.success(1.5),
    controlled: colors.accent(),
    pending: '#F7981C'
  }
}

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
      const { keepCollapsed, name, labels, labelDisplays } = section

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
            div({ style: { flex: 1 } }, [...(labelDisplays && labelDisplays[label] ? labelDisplays[label] : label)]),
            div({ style: styles.pill(_.includes(tag, selectedTags)) }, [_.size(listDataByTag[tag])])
          ])
        }, labels)])
    }, sections)
  ])
}

export const SearchAndFilterComponent = ({ fullList, sidebarSections, customSort, searchType, children }) => {
  const [selectedSections, setSelectedSections] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })

  const listDataByTag = _.omitBy(_.isEmpty, groupByFeaturedTags(fullList, sidebarSections))

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

  const filteredList = _.flow(
    filterBySections,
    filterByTags,
    filterByText,
    customSort ? _.orderBy([customSort.field], [customSort.direction]) : _.orderBy([sort.field], [sort.direction])
  )(fullList)

  return h(Fragment, [
    div({ style: { display: 'flex', margin: '1rem 1rem 0', alignItems: 'baseline' } }, [
      div({ style: { width: '19rem', flex: 'none' } }, [
        div({ style: styles.sidebarRow }, [
          div({ style: styles.header }, [`${searchType}`]),
          div({ style: styles.pill(_.isEmpty(selectedSections) && _.isEmpty(selectedTags)) }, [_.size(filteredList)])
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
        'aria-label': `Search ${searchType}`,
        placeholder: 'Search Name or Description',
        value: searchFilter,
        onChange: setSearchFilter
      }),
      !customSort && h(IdContainer, [
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
          listDataByTag: groupByFeaturedTags(filteredList, sidebarSections)
        })
      ]),
      div({ style: { marginLeft: '1rem', minWidth: 0, width: '100%', height: '100%' } }, [
        _.isEmpty(filteredList) ? div({ style: { margin: 'auto', textAlign: 'center' } }, ['No Results Found']) :
          children({ filteredList, sections, selectedTags, setSelectedTags })
      ])
    ])
  ])
}
