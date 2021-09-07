import _ from 'lodash/fp'
import { useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import * as StateHistory from 'src/libs/state-history'
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
  const [featuredWorkspaces, setFeaturedWorkspaces] = useState(stateHistory.featuredWorkspaces)

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

      setFeaturedWorkspaces(featuredWorkspaces)

      // Saves in Session Storage so there is no loading spinner while awaiting fresh data
      // when user returns via back button
      StateHistory.update({ featuredWorkspaces })
    }

    loadData()
  })

  return SearchAndFilterComponent(featuredWorkspaces, sidebarSections, 'featured workspaces', 'workspaces')
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
