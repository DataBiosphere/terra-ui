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


// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Getting Started',
  labels: ['Workflow Tutorials', 'Notebook Tutorials', 'Data Tutorials', 'RStudio Tutorials', 'Galaxy Tutorials'],
  keepCollapsed: true
}, {
  name: 'Analysis Tools',
  labels: ['WDLs', 'Jupyter Notebooks', 'RStudio', 'Galaxy', 'Hail', 'Bioconductor', 'GATK', 'Cumulus', 'Spark']
}, {
  name: 'Experimental Strategy',
  labels: ['GWAS', 'Exome Analysis', 'Whole Genome Analysis', 'Fusion Transcript Detection', 'RNA Analysis', 'Machine Learning',
    'Variant Discovery', 'Epigenomics', 'DNA Methylation', 'Copy Number Variation', 'Structural Variation', 'Functional Annotation']
}, {
  name: 'Data Generation Technology',
  labels: ['10x analysis', 'Bisulfate Sequencing']
}, {
  name: 'Scientific Domain',
  labels: ['Cancer', 'Infectious Diseases', 'MPG', 'Single-cell', 'Immunology']
}, {
  name: 'Datasets',
  labels: ['AnVIL', 'CMG', 'CCDG', 'TopMed', 'HCA', 'TARGET', 'ENCODE', 'BioData Catalyst', 'TCGA', '1000 Genomes', 'BRAIN Initiative',
    'gnomAD', 'NCI', 'COVID-19']
}, {
  name: 'Utilities',
  labels: ['Format Conversion', 'Developer Tools']
}, {
  name: 'Projects',
  labels: ['HCA', 'AnVIL', 'BRAIN Initiative', 'BioData Catalyst', 'NCI']
}]

const uniqueSidebarTags = _.flow(
  _.flatMap(s => _.map(_.toLower, s.labels)),
  _.uniq
)(sidebarSections)

const styles = {
  column: { marginRight: '1.5rem', flex: '1 1 0px', maxWidth: 415 },
  header: {
    fontSize: 19, color: colors.dark(), fontWeight: 'bold',
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
  pill: {
    width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
    border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
    backgroundColor: 'white'
  },
  pillHighlight: {
    color: 'white', backgroundColor: colors.primary(1), borderColor: colors.primary(1)
  }
}

const NavItem = ({ children, ...props }) => {
  return h(Clickable, _.merge({
    style: { display: 'flex', alignItems: 'center', outlineOffset: -4 }
  }, props), [children])
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
      margin: '1rem 1rem 0',
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

const groupByFeaturedTags = _.memoize(workspaces => _.flow(
  _.map(tag => [tag, _.filter(w => _.includes(tag, w.tags.items), workspaces)]),
  _.fromPairs
)(uniqueSidebarTags))

const Pill = ({ count, highlight }) => {
  return div({
    style: _.merge(styles.pill, highlight ? styles.pillHighlight : {})
  }, [count])
}

const Sidebar = ({ onSectionFilter, onTagFilter, sections, selectedSections, selectedTags, workspacesByTag }) => {
  const [collapsedSections, setCollapsedSections] = useState([])

  const unionSectionWorkspaces = section => {
    return _.uniq(_.flatMap(tag => workspacesByTag[tag], section.tags))
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
              count: _.size(workspacesByTag[tag]),
              highlight: _.includes(tag, selectedTags)
            })
          ])
        }, section.labels)])
    }, sections)
  ])
}

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)
  const [workspacesByTag, setWorkspacesByTag] = useState({})
  const [sections, setSections] = useState([])

  const [selectedSections, setSelectedSections] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchFilter, setSearchFilter] = useState()
  const [sort, setSort] = useState('most recent')

  const sortWorkspaces = Utils.switchCase(sort,
    ['most recent', () => _.orderBy(['created'], ['desc'])],
    ['alphabetical', () => _.orderBy(w => _.toLower(_.trim(w.name)), ['asc'])]
  )

  Utils.useOnMount(() => {
    const loadData = async () => {
      const showcase = await Ajax().Buckets.getShowcaseWorkspaces()

      // Immediately lowercase the workspace tags so we don't have to think about it again.
      // Also pre-compute lower name and description.
      const featuredWorkspaces = _.map(workspace => ({
        ...workspace,
        tags: _.update(['items'], _.map(_.toLower), workspace.tags),
        lowerName: _.toLower(workspace.name), lowerDescription: _.toLower(workspace.description)
      }), showcase)

      const workspacesByTag = _.omitBy(_.isEmpty, groupByFeaturedTags(featuredWorkspaces))

      // Trim items from the sidebar for which there aren't any featured workspaces.
      const activeTags = _.keys(workspacesByTag)
      const activeSections = _.flow(
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

      setFeaturedList(featuredWorkspaces)
      setWorkspacesByTag(workspacesByTag)
      setSections(activeSections)

      // TODO: is this actually doing anything for us?
      StateHistory.update({ featuredWorkspaces })
    }

    loadData()
  })

  const filterBySections = workspaces => {
    if (_.isEmpty(selectedSections)) {
      return workspaces
    } else {
      const tags = _.uniq(_.flatMap(section => section.tags, selectedSections))
      return _.uniq(_.flatMap(tag => workspacesByTag[tag], tags))
    }
  }
  // eslint-disable-next-line lodash-fp/no-single-composition
  const filterByTags = workspaces => _.flow(_.map(tag => _.intersection(workspacesByTag[tag]), selectedTags))(workspaces)
  const filterByText = workspaces => {
    const lowerSearch = _.toLower(searchFilter)
    return _.isEmpty(lowerSearch) ?
      workspaces :
      _.filter(workspace => _.includes(lowerSearch, workspace.lowerName) || _.includes(lowerSearch, workspace.lowerDescription), workspaces)
  }
  const filteredWorkspaces = _.flow(
    filterBySections,
    filterByTags,
    filterByText
  )(featuredList)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('showcase & tutorials'),
    !allFeatured ?
      centeredSpinner() :
      div({ style: { display: 'flex', margin: '1rem 1rem 0' } }, [
        div({ sytle: { width: 300 } }, [
          div({ style: styles.header }, 'Featured workspaces')
          // filtering here
        ]),
        div({ style: { flex: 1 } }, [
          // search & sort here
          ..._.map(makeCard(), allFeatured)
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
