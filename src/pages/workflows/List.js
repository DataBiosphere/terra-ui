import _ from 'lodash/fp'
import * as qs from 'qs'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { HeaderRenderer, Link, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { DelayedSearchInput } from 'src/components/input'
import { SimpleTabBar } from 'src/components/tabBars'
import { FlexTable, TextCell, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  cell: {
    ...Style.lightTable.cellContainer,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'start'
  }
}

// TODO: add error handling, consider wrapping query updates in useEffect
const WorkflowList = () => {
  const { query } = Nav.useRoute()
  const filter = query.filter || ''
  const [tab, setTab] = useState(query.tab || 'mine')
  const [loading, setLoading] = useState(false)

  const signal = Utils.useCancellation()

  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [workflows, setWorkflows] = useState()


  const getUpdatedQuery = ({ newTab = tab, newFilter = filter }) => {
    // Note: setting undefined so that falsy values don't show up at all
    return qs.stringify({ ...query, tab: newTab === 'mine' ? undefined : newTab, filter: newFilter || undefined }, { addQueryPrefix: true })
  }

  const updateQuery = newParams => {
    const newSearch = getUpdatedQuery(newParams)

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  }

  const loadWorkflows = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Unable to load workflows')
  )(async () => {
    const [allWorkflows, featuredList] = await Promise.all([
      Ajax(signal).Methods.definitions(),
      fetch(`${getConfig().firecloudBucketRoot}/featured-methods.json`, { signal }).then(res => res.json())
    ])

    const isMine = ({ public: isPublic, managers }) => !isPublic || _.includes(getUser().email, managers)
    setWorkflows({
      mine: _.filter(isMine, allWorkflows),
      featured: _.flow(
        _.map(featuredWf => _.find(featuredWf, allWorkflows)),
        _.compact
      )(featuredList),
      public: _.filter('public', allWorkflows)
    })
  })

  Utils.useOnMount(() => {
    loadWorkflows()
  })

  const sortedWorkflows = _.flow(
    _.filter(({ namespace, name }) => Utils.textMatch(filter, `${namespace}/${name}`)),
    _.orderBy([({ [sort.field]: field }) => _.lowerCase(field)], [sort.direction])
  )(workflows?.[tab])

  const tabs = [
    { key: 'mine', title: 'My Workflows' },
    { key: 'public', title: 'Public Workflows' },
    { key: 'featured', title: 'Featured Workflows' }
  ]

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workflows' }, [
      h(DelayedSearchInput, {
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH WORKFLOWS',
        'aria-label': 'Search workflows',
        onChange: val => updateQuery({ newFilter: val }),
        value: filter
      })
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workflows'])
      ]),
      h(SimpleTabBar, {
        'aria-label': 'workflows menu',
        value: tab,
        onChange: newTab => {
          if (newTab === tab) {
            loadWorkflows()
          } else {
            updateQuery({ newTab })
            setTab(newTab)
          }
        },
        tabs
      }, [
        div({ style: { flex: 1, backgroundColor: 'white', padding: '0 1rem' } }, [
          sortedWorkflows && h(AutoSizer, [
            ({ width, height }) => h(FlexTable, {
              'aria-label': _.find({ key: tab }, tabs).title,
              variant: 'light',
              width, height, sort,
              rowCount: sortedWorkflows.length,
              columns: [
                {
                  field: 'name',
                  headerRenderer: () => h(HeaderRenderer, {
                    name: 'Workflow Name', sortName: 'name',
                    sort, onSort: setSort
                  }),
                  cellRenderer: ({ rowIndex }) => {
                    const { namespace, name } = sortedWorkflows[rowIndex]

                    return h(TextCell, { style: styles.cell }, [
                      div({ style: { fontSize: 12 } }, [namespace]),
                      h(Link, {
                        style: { fontWeight: 600 },
                        tooltip: `${namespace}/${name}`, tooltipSide: 'right',
                        href: Nav.getLink('workflow-dashboard', { namespace, name })
                      }, [name])
                    ])
                  },
                  size: { basis: 300 }
                },
                {
                  field: 'synopsis',
                  headerRenderer: () => h(HeaderRenderer, { name: 'synopsis', sort, onSort: setSort }),
                  cellRenderer: ({ rowIndex }) => {
                    const { synopsis } = sortedWorkflows[rowIndex]

                    return h(TextCell, { style: styles.cell },
                      [h(TooltipTrigger, { content: synopsis }, [div([synopsis])])])
                  },
                  size: { basis: 475 }
                },
                {
                  field: 'managers',
                  headerRenderer: () => h(HeaderRenderer, {
                    name: 'Owners', sortName: 'managers',
                    sort, onSort: setSort
                  }),
                  cellRenderer: ({ rowIndex }) => {
                    const { managers } = sortedWorkflows[rowIndex]

                    return h(TooltipCell, { style: styles.cell }, [managers?.join(', ')])
                  },
                  size: { basis: 225 }
                },
                {
                  field: 'numSnapshots',
                  headerRenderer: () => h(HeaderRenderer, {
                    name: 'Snapshots', sortName: 'numSnapshots',
                    sort, onSort: setSort
                  }),
                  cellRenderer: ({ rowIndex }) => {
                    const { numSnapshots } = sortedWorkflows[rowIndex]

                    return h(TextCell, { style: styles.cell }, [numSnapshots])
                  },
                  size: { basis: 108, grow: 0, shrink: 0 }
                },
                {
                  field: 'numConfigurations',
                  headerRenderer: () => h(HeaderRenderer, {
                    name: 'Configurations', sortName: 'numConfigurations',
                    sort, onSort: setSort
                  }),
                  cellRenderer: ({ rowIndex }) => {
                    const { numConfigurations } = sortedWorkflows[rowIndex]

                    return h(TextCell, { style: styles.cell }, [numConfigurations])
                  },
                  size: { basis: 145, grow: 0, shrink: 0 }
                }
              ]
            })
          ])
        ])
      ]),
      loading && (!workflows ? transparentSpinnerOverlay : topSpinnerOverlay)
    ])
  ])
}

export const navPaths = [
  {
    name: 'workflows',
    path: '/workflows',
    component: WorkflowList,
    title: 'Workflows'
  }
]
