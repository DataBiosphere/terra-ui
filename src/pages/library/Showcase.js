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
import {
  groupByFeaturedTags,
  NavItem,
  Pill,
  SearchAndFilterComponent,
  Sidebar,
  SidebarCollapser,
  styles
} from 'src/pages/library/common'


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

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)

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

      setFeaturedList(featuredWorkspaces)

      // TODO: is this actually doing anything for us?
      StateHistory.update({ featuredWorkspaces })
    }

    loadData()
  })

  return SearchAndFilterComponent(featuredList, sidebarSections)
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
