import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, em, h, label, span, strong } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { Clickable, IdContainer, Link, Select } from 'src/components/common'
import { DelayedAutoCompleteInput } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'


export const commonStyles = {
  access: {
    granted: colors.success(1.5),
    controlled: colors.accent(),
    pending: '#F7981C'
  }
}

const styles = {
  header: {
    fontSize: '1.5rem', color: colors.dark(), fontWeight: 700
  },
  sidebarRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
  },
  nav: {
    navSection: {
      alignItems: 'center', flex: 'none', padding: '0.5rem 0'
    },
    title: { color: colors.dark(), fontWeight: 700, borderBottom: `1px solid ${colors.dark(0.3)}`, paddingBottom: '0.75rem' }
  },
  pill: highlight => ({
    width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
    border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
    backgroundColor: 'white',
    ...(highlight ? { color: 'white', backgroundColor: colors.primary(), borderColor: colors.primary() } : {})
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
      const { keepCollapsed, name, labels, labelRenderer } = section

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
          title: h(Fragment, [name, span({ style: { marginLeft: '0.5rem', fontWeight: 400 } }, [`(${_.size(labels)})`])])
        }, [_.map(label => {
          const tag = _.toLower(label)
          const size = _.size(listDataByTag[tag])
          return (size > 0) &&
            h(Clickable, {
              key: label,
              style: {
                display: 'flex', alignItems: 'baseline', margin: '0.5rem 0',
                paddingBottom: '0.5rem', borderBottom: `1px solid ${colors.dark(0.1)}`
              },
              onClick: () => onTagFilter(tag)
            }, [
              div({ style: { lineHeight: '1.375rem', flex: 1 } }, [...(labelRenderer ? labelRenderer(label) : label)]),
              div({ style: styles.pill(_.includes(tag, selectedTags)) }, [size])
            ])
        }, labels)])
    }, sections)
  ])
}

const reverseText = _.flow(_.reverse, _.join(''))

// truncateLeftWord
// This will behave like Lodash's _.truncate except it will truncate from the left side of the string.
// This function will also truncate at a word, so the beginning of the text is fully readable.
// Example: truncateLeftWord({length: 14}, 'this is my string') -> '...my string' - the ellipses are part of the string length
const truncateLeftWord = _.curry((options, text) => _.flow(
  reverseText, // reverses the text so we can perform a truncate
  _.truncate(options),
  reverseText, // puts the text back in its original order
  _.replace(/\.\.\.(\S+)/, '...') // Removes the first partial word
)(text))

const getContextualSuggestion = ([leftContext, match, rightContext]) => {
  return [
    strong([em(['Description: '])]),
    truncateLeftWord({ length: 40 }, leftContext),
    match,
    _.truncate({ length: 40 }, rightContext)
  ]
}

export const SearchAndFilterComponent = ({ fullList, sidebarSections, customSort, searchType, children }) => {
  const { query } = Nav.useRoute()
  const searchFilter = query.filter || ''
  const [selectedSections, setSelectedSections] = useState([])
  const [selectedTags, setSelectedTags] = useState(StateHistory.get().selectedTags || [])
  const [sort, setSort] = useState({ field: 'created', direction: 'desc' })
  const filterRegex = new RegExp(`(${searchFilter})`, 'i')

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

  const getContext = _.flow(
    _.split(filterRegex),
    getContextualSuggestion,
    _.map(item => _.toLower(item) === _.toLower(searchFilter) ? strong([item]) : item)
  )

  const filteredData = useMemo(() => {
    const filterByText = _.filter(({ lowerName, lowerDescription }) => _.includes(_.toLower(searchFilter), `${lowerName} ${lowerDescription}`))

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

    return _.flow(
      filterBySections,
      filterByTags,
      filterByText,
      customSort ? _.orderBy([customSort.field], [customSort.direction]) : _.orderBy([sort.field], [sort.direction])
    )(fullList)
  }, [fullList, searchFilter, customSort, sort, listDataByTag, selectedTags, selectedSections])


  const onSearchChange = filter => {
    const newSearch = qs.stringify({
      ...query,
      filter: filter || undefined
    }, { addQueryPrefix: true })

    if (filter) {
      Ajax().Metrics.captureEvent(`${Events.catalogFilter}:search`, { filter })
    }

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  }

  useEffect(() => {
    StateHistory.update({ selectedTags })
  }, [selectedTags])

  return h(Fragment, [
    div({
      style: {
        display: 'grid',
        gridTemplateColumns: '19rem 1fr',
        gridTemplateRows: 'auto 3rem',
        gap: '2rem 1rem',
        gridAutoFlow: 'column',
        margin: '1rem 1rem 0',
        alignItems: 'baseline'
      }
    }, [
      div({ style: styles.sidebarRow }, [
        div({ style: styles.header }, [searchType]),
        div({ style: styles.pill(_.isEmpty(selectedSections) && _.isEmpty(selectedTags)) }, [_.size(filteredData)])
      ]),
      div({ style: { ...styles.nav.title, display: 'flex', alignItems: 'baseline' } }, [
        div({ style: { flex: 1, fontSize: '1.125rem', fontWeight: 600 } }, ['Filters']),
        h(Link, {
          onClick: () => {
            setSelectedSections([])
            setSelectedTags([])
          }
        }, ['clear'])
      ]),
      h(DelayedAutoCompleteInput, {
        style: { borderRadius: 25, width: 800, flex: 1 },
        inputIcon: 'search',
        debounceMs: 25,
        openOnFocus: true,
        value: searchFilter,
        'aria-label': `Search ${searchType}`,
        placeholder: 'Search Name or Description',
        itemToString: v => v['dct:title'],
        onChange: onSearchChange,
        suggestionFilter: _.curry((needle, { lowerName, lowerDescription }) => _.includes(_.toLower(needle), `${lowerName} ${lowerDescription}`)),
        renderSuggestion: suggestion => {
          return div({ style: { lineHeight: '1.75rem', padding: '0.375rem 0', borderBottom: `1px dotted ${colors.dark(0.7)}` } },
            _.flow(
              _.split(filterRegex),
              _.map(item => _.toLower(item) === _.toLower(searchFilter) ? strong([item]) : item),
              maybeMatch => {
                return _.size(maybeMatch) < 2 ? [
                  _.truncate({ length: 90 }, _.head(maybeMatch)),
                  div({ style: { lineHeight: '1.5rem', marginLeft: '2rem' } }, [...getContext(suggestion['dct:description'])])
                ] : maybeMatch
              }
            )(suggestion['dct:title'])
          )
        },
        suggestions: filteredData
      }),
      div({ style: { fontSize: '1rem', fontWeight: 600 } }, [searchFilter ? `Results For "${searchFilter}"` : 'All datasets']),
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
          onTagFilter: tag => {
            Ajax().Metrics.captureEvent(`${Events.catalogFilter}:sidebar`, { tag })
            setSelectedTags(_.xor([tag]))
          },
          sections,
          selectedSections,
          selectedTags,
          listDataByTag: groupByFeaturedTags(filteredData, sidebarSections)
        })
      ]),
      div({ style: { marginLeft: '1rem', minWidth: 0, width: '100%', height: '100%' } }, [
        _.isEmpty(filteredData) ? div({ style: { margin: 'auto', textAlign: 'center' } }, ['No Results Found']) :
          children({ filteredList: filteredData, sections, selectedTags, setSelectedTags })
      ])
    ])
  ])
}
