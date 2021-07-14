import _ from 'lodash/fp'
import { useState } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
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
    fontSize: 22, color: colors.dark(), fontWeight: 500,
    marginBottom: '1rem'
  }
}

const makeCard = variant => (workspace) => {
  const { namespace, name, description } = workspace
  return a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: {
      backgroundColor: 'white',
      height: 175,
      borderRadius: 5,
      display: 'flex',
      margin: '1rem 1rem 0',
      boxShadow: Style.standardShadow
    }
  }, [
    div({ style: { flex: 1, minWidth: 0, padding: '15px 20px' } }, [
      div({ style: { color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
    ]),
    div({
      style: {
        backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'auto 100%', borderRadius: '0 5px 5px 0',
        width: 87,
        ...Utils.cond(
          [name.toLowerCase().includes('covid'), () => ({ backgroundImage: `url(${covidBg})` })],
          [variant === 'gatk', () => ({ backgroundColor: '#333', backgroundImage: `url(${gatkLogo})`, backgroundSize: undefined })],
          () => ({ backgroundImage: `url(${featuredBg})`, opacity: 0.75 })
        )
      }
    })
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

const Sidebar = () => {
  // return div(sideBarSections)
  return null
}

const Showcase = () => {
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)

  Utils.useOnMount(() => {
    const loadData = async () => {
      const featuredList = await Ajax().Buckets.getShowcaseWorkspaces()

      setFeaturedList(featuredList)
      StateHistory.update({ featuredList })
    }

    loadData()
  })

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('showcase & tutorials'),
    !featuredList ?
      centeredSpinner() :
      div({ style: { display: 'flex', margin: '1rem 1rem 0' } }, [
        div({ sytle: { width: 300 } }, [
          div({ style: styles.header }, 'Featured workspaces'),
          h(Sidebar)
        ]),
        div({ style: { flex: 1 } }, [
          ..._.map(makeCard(), featuredList)
        ])
      ])
  ])
}

export const navPaths = [
  {
    name: 'library-showcase',
    path: '/library/showcase',
    component: Showcase,
    title: 'Showcase & Tutorials'
  }
]
