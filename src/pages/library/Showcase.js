import _ from 'lodash/fp'
import { useState } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { libraryTopMatter } from 'src/components/library-common'
import { FirstParagraphMarkdownViewer } from 'src/components/markdown'
import covidBg from 'src/images/library/showcase/covid-19.jpg'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { useOnMount } from 'src/libs/react-utils'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { SearchAndFilterComponent } from 'src/pages/library/common'


// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Getting Started',
  labels: ['Workflow Tutorials', 'Notebook Tutorials', 'Data Tutorials', 'RStudio Tutorials', 'Galaxy Tutorials']
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
  labels: ['Cancer', 'Infectious Diseases', 'MPG', 'Single-cell', 'Immunology', 'Neurodegenerative Diseases']
}, {
  name: 'Datasets',
  labels: ['AnVIL', 'CMG', 'CCDG', 'TopMed', 'HCA', 'TARGET', 'ENCODE', 'BioData Catalyst', 'TCGA', '1000 Genomes', 'BRAIN Initiative',
    'gnomAD', 'NCI', 'COVID-19', 'AMP PD']
}, {
  name: 'Utilities',
  labels: ['Format Conversion', 'Developer Tools']
}, {
  name: 'Projects',
  labels: ['HCA', 'AnVIL', 'BRAIN Initiative', 'BioData Catalyst', 'NCI', 'AMP PD']
}]

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
      h(FirstParagraphMarkdownViewer, {
        style: { margin: 0, fontSize: '14px', lineHeight: '20px', height: 100, overflow: 'hidden' }
      }, [description?.toString()])
    ])
  ])
}

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [fullList, setFullList] = useState(stateHistory.featuredWorkspaces)

  useOnMount(() => {
    const loadData = withErrorReporting('Error loading showcase', async () => {
      const showcase = await Ajax().FirecloudBucket.getShowcaseWorkspaces()

      // Immediately lowercase the workspace tags so we don't have to think about it again.
      // Also pre-compute lower name and description.
      const featuredWorkspaces = _.map(workspace => ({
        ...workspace,
        tags: _.update(['items'], _.map(_.toLower), workspace.tags)
      }), showcase)

      setFullList(featuredWorkspaces)

      // Saves in Session Storage so there is no loading spinner while awaiting fresh data
      // when user returns via back button
      StateHistory.update({ featuredWorkspaces })
    })

    loadData()
  })

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('featured workspaces'),
    h(SearchAndFilterComponent, {
      fullList, sidebarSections,
      searchType: 'Featured Workspaces',
      getLowerName: workspace => _.toLower(workspace.name),
      getLowerDescription: workspace => _.toLower(workspace.description),
      listView: filteredList => {
        return _.map(workspace => {
          const { namespace, name } = workspace
          return h(WorkspaceCard, { key: `${namespace}:${name}`, workspace })
        }, filteredList)
      }
    })
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
