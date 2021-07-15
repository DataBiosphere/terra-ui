import _ from 'lodash/fp'
import { useState } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
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
    fontSize: 16, color: colors.dark(), fontWeight: 'bold',
    marginBottom: '1rem'
  }
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
        div([Utils.makeStandardDate(created)])
      ]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
      // h(MarkdownViewer, [description]) // TODO: should we render this as markdown?
    ])
  ])
}

// match tags case-insensitively
const sideBarSections = [
  {
    name: 'Getting Started',
    labels: ['tutorials', 'demos', 'workshops']
  },
  {
    name: 'Analysis Tools',
    labels: ['wdls', 'jupyter notebooks', 'rstudio', 'galaxy', 'hail', 'bioconductor', 'gatk', 'cumulus', 'spark']
  },
  {
    name: 'Experimental Strategy',
    labels: ['gwas', 'alignment', 'exome analysis', 'whole genome analysis', 'fusion transcript detection', 'rna analysis', 'machine learning', 'variant discovery', 'epigenomics', 'methylated dna', 'copy number variation', 'structural variation', 'functional annotation', 'quality control']
  },
  {
    name: 'Data Generation Technology',
    labels: ['10x analysis']
  },
  {
    name: 'Scientific Domain',
    labels: ['cancer', 'infectious diseases', 'mpg', 'single-cell', 'immunology']
  },
  {
    name: 'Datasets',
    labels: ['anvil', 'hca', 'target', 'encode', 'biodata catalyst', 'tcga', '1000 genomes', 'brain initiative', 'gnomad', 'nci', 'covid-19']
  },
  {
    name: 'Utilities',
    labels: ['format conversion', 'developer tools']
  },
  {
    name: 'Projects',
    labels: ['hca', 'anvil', 'brain initiative', 'biodata catalyst']
  }
]

const Sidebar = props => {
  const { onFilterChange, featuredList } = props

  const labelCounts = new Map()
  sideBarSections.forEach(function (section) {
    section.labels.forEach(function (label) {
      labelCounts.set(label, 0)
    })
  })

  featuredList.forEach(function (workspace) {
    workspace.tags.items?.forEach(function (tag) {
      tag = tag.toLowerCase()
      if (labelCounts.has(tag)) {
        labelCounts.set(tag, labelCounts.get(tag) + 1)
      }
    })
  })

  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    h(Clickable, {
      onClick: () => onFilterChange(undefined)
    }, ['clear']),
    _.map(section => {
      return div([
        div({ style: { fontWeight: 600, marginBottom: '0.5rem' } }, section.name),
        ..._.map(label => {
          return div({ style: { marginBottom: '0.5rem', display: 'flex' } }, [
            h(Clickable, {
              style: { flex: 1 },
              onClick: () => onFilterChange(label.toLowerCase())
            }, [label]),
            div(labelCounts.get(label))
          ])
        }, section.labels)
      ])
    }, sideBarSections)
  ])
}

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)

  const [tagFilter, setTagFilter] = useState()
  const [searchFilter, setSearchFilter] = useState()

  Utils.useOnMount(() => {
    const loadData = async () => {
      const featuredList = await Ajax().Buckets.getShowcaseWorkspaces()

      setFeaturedList(featuredList)
      StateHistory.update({ featuredList })
    }

    loadData()
  })

  const matchWorkspace = workspace => {
    console.log(workspace)
    const tags = _.map(_.toLower, workspace.tags.items)
    return (!tagFilter || _.includes(_.toLower(tagFilter), tags)) &&
      (!searchFilter || _.includes(searchFilter, workspace.name) || _.includes(searchFilter, workspace.description))
  }

  const filteredWorkspaces = _.filter(matchWorkspace, featuredList)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('showcase & tutorials'),
    !featuredList ?
      centeredSpinner() :
      div({ style: { display: 'flex', margin: '1rem 1rem 0' } }, [
        div({ style: { width: '18rem' } }, [
          div({ style: styles.header }, 'Featured workspaces'),
          h(Sidebar, {
            onFilterChange: setTagFilter,
            featuredList
          })
        ]),
        div({ style: { flex: 1, minWidth: 0, marginLeft: '1rem' } }, [
          div({ style: { display: 'flex', marginBottom: '0.5rem' } }, [
            h(DelayedSearchInput, {
              style: { flex: 1 },
              placeholder: 'Search Name or Description',
              'aria-label': 'Search Featured Workspaces',
              value: searchFilter,
              onChange: setSearchFilter
            }),
            div('Sort by')
          ]),
          // TODO: make this case insensitive
          ..._.map(makeCard(), filteredWorkspaces)
        ])
      ])
  ])
}

export const navPaths = [
  {
    name: 'library-showcase',
    path: '/library/showcase',
    component: Showcase,
    title: 'Showcase & Tutorials',
    public: true
  }
]
