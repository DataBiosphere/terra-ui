import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { UnmountClosed as RCollapse } from 'react-collapse'
import { a, div, h, label } from 'react-hyperscript-helpers'
import { Clickable, IdContainer, Link, Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { libraryTopMatter } from 'src/components/library-common'
import covidBg from 'src/images/library/showcase/covid-19.jpg'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  column: { marginRight: '1.5rem', flex: '1 1 0px', maxWidth: 415 },
  header: {
    fontSize: 19, color: colors.dark(), fontWeight: 'bold',
    marginBottom: '1rem'
  },
  sideBarRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer',
      zIndex: 2
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
  pill: {
    width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
    border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
    backgroundColor: 'white'
  }
}
styles.hilightedPill = { ...styles.pill, color: 'white', backgroundColor: colors.primary(1), borderColor: colors.primary(1) }

const NavItem = ({ children, ...props }) => {
  return h(Clickable, _.merge({
    style: { display: 'flex', alignItems: 'center', outlineOffset: -4 }
  }, props), [children])
}

const makeCard = variant => workspace => {
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

// collapsible section for sidebar categories
const sideBarCollapser = ({ title, isOpened, onClick, children }) => {
  return div({
    role: 'group'
  }, [
    h(NavItem, {
      onClick,
      style: { ...styles.sideBarRow, ...styles.nav.navSection }
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

// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sideBarSections = [
  {
    name: 'Getting Started',
    labels: ['Workflow Tutorials', 'Notebook Tutorials', 'Data Tutorials', 'RStudio Tutorials', 'Galaxy Tutorials']
  },
  {
    name: 'Analysis Tools',
    labels: ['WDLs', 'Jupyter Notebooks', 'RStudio', 'Galaxy', 'Hail', 'Bioconductor', 'GATK', 'Cumulus', 'Spark']
  },
  {
    name: 'Experimental Strategy',
    labels: ['GWAS', 'Exome Analysis', 'Whole Genome Analysis', 'Fusion Transcript Detection', 'RNA Analysis', 'Machine Learning',
      'Variant Discovery', 'Epigenomics', 'DNA Methylation', 'Copy Number Variation', 'Structural Variation', 'Functional Annotation']
  },
  {
    name: 'Data Generation Technology',
    labels: ['10x analysis', 'Bisulfate Sequencing']
  },
  {
    name: 'Scientific Domain',
    labels: ['Cancer', 'Infectious Diseases', 'MPG', 'Single-cell', 'Immunology']
  },
  {
    name: 'Datasets',
    labels: ['AnVIL', 'CMG', 'CCDG', 'TopMed', 'HCA', 'TARGET', 'ENCODE', 'BioData Catalyst', 'TCGA', '1000 Genomes', 'BRAIN Initiative',
      'gnomAD', 'NCI', 'COVID-19']
  },
  {
    name: 'Utilities',
    labels: ['Format Conversion', 'Developer Tools']
  },
  {
    name: 'Projects',
    labels: ['HCA', 'AnVIL', 'BRAIN Initiative', 'BioData Catalyst', 'NCI']
  }
]

const uniqueSidebarTags = _.flow([
  _.flatMap(s => _.map(_.toLower, s.labels)),
  _.uniq
])(sideBarSections)

const groupByFeaturedTags = workspaces => _.flow([
  _.map(tag => [tag, _.filter(w => _.includes(tag, w.tags.items), workspaces)]),
  _.fromPairs
])(uniqueSidebarTags)

const Sidebar = props => {
  const { onFilterChange, sections, selectedTags, workspacesByTag } = props

  // setup open-ness state for each sidebar section
  const initialOpenStates = _.fromPairs(_.map(sections, section => [section.name, true]))
  const [openState, setOpenState] = useState(initialOpenStates)

  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    _.map(section => {
      return div([
        h(sideBarCollapser,
          {
            title: section.name,
            onClick: () => setOpenState(_.update(section.name, open => !open, openState)),
            isOpened: openState[section.name]
          },
          [
            ..._.map(label => {
              const tag = _.toLower(label)
              return h(Clickable, {
                style: { display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' },
                onClick: () => onFilterChange(tag)
              }, [
                div({ style: { flex: 1 } }, [label]),
                div({
                  style: _.includes(_.toLower(label), selectedTags) ? styles.hilightedPill : styles.pill
                }, [
                  _.size(workspacesByTag[tag])
                ])
              ])
            }, section.labels)
          ]
        )
      ])
    }, sections)
  ])
}

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)
  const [workspacesByTag, setWorkspacesByTag] = useState({})
  const [sections, setSections] = useState([])

  const [selectedTags, setSelectedTags] = useState([])
  const [searchFilter, setSearchFilter] = useState()
  const [sort, setSort] = useState('most recent')

  const sortWorkspaces = Utils.cond(
    [sort === 'most recent', () => _.orderBy(['created'], ['desc'])],
    [sort === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w.name)), ['asc'])],
    () => _.identity
  )

  Utils.useOnMount(() => {
    const loadData = async () => {
      const showcase = await Ajax().Buckets.getShowcaseWorkspaces()

      // Immediately lowercase the workspace tags so we don't have to think about it again.
      const featuredWorkspaces = _.map(_.update(['tags', 'items'], _.map(_.toLower)), showcase)

      const workspacesByTag = _.omitBy(_.isEmpty, groupByFeaturedTags(featuredWorkspaces))

      // Trim items from the sidebar for which there aren't any featured workspaces.
      const activeTags = _.keys(workspacesByTag)
      const activeSections = _.flow([
        _.map(_.update(['labels'], labels => _.intersectionBy(_.toLower, labels, activeTags))),
        _.remove(section => _.isEmpty(section.labels))
      ])(sideBarSections)

      setFeaturedList(featuredWorkspaces)
      setWorkspacesByTag(workspacesByTag)
      setSections(activeSections)

      // TODO: is this actually doing anything for us?
      StateHistory.update({ featuredWorkspaces })
    }

    loadData()
  })

  // eslint-disable-next-line lodash-fp/no-single-composition
  const filterByTags = workspaces => _.flow(_.map(tag => _.intersection(workspacesByTag[tag]), selectedTags))(workspaces)
  const filterByText = workspaces => {
    return _.isEmpty(searchFilter) ?
      workspaces :
      _.filter(workspace => _.includes(searchFilter, workspace.name) || _.includes(searchFilter, workspace.description), workspaces)
  }
  const filteredWorkspaces = _.flow([
    filterByTags,
    filterByText
  ])(featuredList)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('featured workspaces'),
    !featuredList ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', margin: '1rem 1rem 0', alignItems: 'baseline' } }, [
          div({ style: { width: '19rem', flex: '0 0 auto' } }, [
            div({ style: styles.sideBarRow }, [
              div({ style: styles.header }, 'Featured workspaces'),
              div({
                style: _.isEmpty(selectedTags) ? styles.hilightedPill : styles.pill
              }, [_.size(filteredWorkspaces)])
            ]),
            div({ style: { display: 'flex', alignItems: 'center', height: '2.5rem' } }, [
              div({ style: { flex: 1 } }),
              h(Link, {
                onClick: () => setSelectedTags([])
              }, ['clear'])
            ])
          ]),
          h(DelayedSearchInput, {
            style: { flex: 1, marginLeft: '1rem' },
            'aria-label': 'Search Featured Workspaces',
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
        div({ style: { display: 'flex', margin: '0 1rem' } }, [
          div({ style: { width: '19rem', flex: '0 0 auto' } }, [
            h(Sidebar, {
              onFilterChange: tag => setSelectedTags(_.xor([tag], selectedTags)),
              sections,
              selectedTags,
              workspacesByTag: groupByFeaturedTags(filteredWorkspaces)
            })
          ]),
          div({ style: { marginLeft: '1rem', minWidth: 0 } }, [
            ..._.map(makeCard(), sortWorkspaces(filteredWorkspaces))
          ])
        ])
      ])
  ])
}

export const navPaths = [
  {
    name: 'library-showcase',
    path: '/library/showcase',
    component: Showcase,
    title: 'Featured Workspaces',
    public: true
  }
]
