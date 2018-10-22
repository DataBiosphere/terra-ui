import { Fragment } from 'react'
import { div, h, img, p, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, link, FadeBox, PageFadeBox } from 'src/components/common'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import amppdLogo from 'src/images/browse-data/Amp@2x.png'
import gtexLogo from 'src/images/browse-data/GTeX@2x.png'
import hcaLogo from 'src/images/browse-data/HCA@2x.png'
import nhsLogo from 'src/images/browse-data/NHS@2x.png'
import topMedLogo from 'src/images/browse-data/TopMed@2x.png'
import broadLogo from 'src/images/browse-data/broad_logo.png'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Config from 'src/libs/config'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    ...Style.elements.sectionHeader, textTransform: 'uppercase'
  },
  content: {
    display: 'flex', flexWrap: 'wrap'
  },
  participant: {
    container: {
      margin: '1.5rem 1.5rem 0 0', width: 450
    },
    title: {
      marginTop: '1rem',
      fontSize: 20, color: colors.darkBlue[0]
    },
    description: {
      marginTop: '1rem',
      height: 100
    },
    sizeText: {
      marginTop: '1rem',
      height: '1rem'
    }
  }
}


const logoBox = ({ src, alt, height }) => div({
  style: {
    display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
    flex: 'none',
    height: 150, width: 'auto',
    border: `1px solid ${colors.gray[3]}`, borderRadius: 5,
    backgroundColor: 'white'
  }
}, [
  img({
    src, alt, height: height || '60%', width: 'auto'
  })
])


class Participant extends Component {
  render() {
    const { logo, title, shortDescription, description, sizeText, children } = this.props
    const { showingModal } = this.state

    const titleElement = div({ style: styles.participant.title }, [title])

    return h(FadeBox, {
      fadePoint: '90%',
      style: styles.participant.container
    }, [
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        logoBox(logo),
        titleElement,
        div({ style: styles.participant.description }, [
          shortDescription || description,
          shortDescription && link({
            style: { marginLeft: '0.5rem' },
            onClick: () => this.setState({ showingModal: true })
          }, ['READ MORE'])
        ]),
        div({ style: styles.participant.sizeText }, [sizeText]),
        div({ style: { marginTop: '1rem' } }, [children])
      ]),
      showingModal && h(Modal, {
        onDismiss: () => this.setState({ showingModal: false }),
        width: 880,
        showCancel: false
      }, [
        img({ src: logo.src, alt: logo.alt, height: 150, width: 'auto' }),
        titleElement,
        description,
        sizeText && p([sizeText])
      ])
    ])
  }
}


const browseTooltip = 'Look for the Export to Saturn icon to export data from this provider.'


const NIHCommonsButtons = h(Fragment, [
  buttonPrimary({
    style: { margin: '0.25rem 0' },
    as: 'a',
    href: 'https://dcp.bionimbus.org/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data via Windmill']),
  buttonPrimary({
    style: { margin: '0.25rem 0' },
    as: 'a',
    href: 'https://commons.ucsc-cgp.org/boardwalk',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data via Boardwalk'])
])


const nhs = h(Participant, {
  logo: { src: nhsLogo, alt: `Nurses' Health Study logo` },
  title: `Nurses' Health Study`,
  description: `The Nurses' Health Study and Nurses' Health Study II are among the largest investigations into the risk
  factors for major chronic diseases in women.`,
  sizeText: 'Participants: > 280,000'
}, [
  buttonPrimary({
    as: 'a',
    href: 'http://nhs-explorer.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const hca = h(Participant, {
  logo: { src: hcaLogo, alt: 'Human Cell Atlas logo' },
  title: 'Human Cell Atlas',
  description: `The Human Cell Atlas (HCA) is made up of comprehensive reference maps of all human cells — the
  fundamental units of life — as a basis for understanding fundamental human biological processes and diagnosing,
  monitoring, and treating disease.`
}, [
  buttonPrimary({
    disabled: true,
    tooltip: 'HCA not yet in production'
    //when in production, add this tooltip: browseTooltip
  }, ['Browse Data'])
])

const amppd = h(Participant, {
  logo: { src: amppdLogo, alt: 'AMP-PD logo' },
  title: `AMP Parkinson's Disease`,
  shortDescription: `The Accelerating Medicines Partnership (AMP) is a public-private partnership between the National
  Institutes of Health (NIH), multiple biopharmaceutical and life sciences companies, and non-profit organizations to
  identify...`,
  description: h(Fragment, [
    p([`The Accelerating Medicines Partnership (AMP) is a public-private partnership between the National Institutes of
    Health (NIH), multiple biopharmaceutical and life sciences companies, and non-profit organizations to identify and 
    validate the most promising biological targets for therapeutics. This AMP effort aims to identify and validate the
    most promising biological targets for therapeutics relevant to Parkinson's disease.`]),
    p(['Includes data from the following studies:']),
    div({ style: { margin: '0.4rem 0', fontWeight: 'bold', lineHeight: '150%' } }, [
      div({ style: { display: 'flex' } }, [
        div({ style: { width: 410 } }, [`• Parkinson's Disease Biomarkers Program (PDBP)`]),
        div(['• BioFIND'])
      ]),
      div({ style: { display: 'flex' } }, [
        div({ style: { width: 410 } }, [`• Parkinson's Progression Markers Initiative (PPMI)`]),
        div(['• Harvard Biomarkers Study (HBS)'])
      ])
    ])
  ]),
  sizeText: 'Participants: > 4,700'
}, [
  buttonPrimary({
    as: 'a',
    href: 'http://amp-pd-data-explorer.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const topMed = h(Participant, {
  logo: { src: topMedLogo, alt: 'TopMed logo' },
  title: 'TopMed presented by NIH Commons',
  description: `Trans-Omics for Precision Medicine (TOPMed), sponsored by the National Institutes of Health's National
  Heart, Lung, and Blood Institute (NHLBI), is a program to generate scientific resources to enhance our understanding
  of fundamental biological processes that underlie heart, lung, blood, and sleep disorders (HLBS).`,
  sizeText: h(TooltipTrigger, { content: 'As of November 2016' }, [span('Participants: > 54,000')])
}, [
  NIHCommonsButtons
])

const gtex = h(Participant, {
  logo: { src: gtexLogo, alt: 'GTEx logo' },
  title: 'GTEx presented by NIH Commons',
  description: `The Genotype-Tissue Expression (GTEx) Program established a data resource and tissue bank to study the
  relationship between genetic variation and gene expression in multiple human tissues.`,
  sizeText: h(TooltipTrigger, { content: 'As of release V7' }, [span('Samples: > 11,688')])
}, [
  NIHCommonsButtons
])

const { firecloudRoot } = Config.getFirecloudUrlRoot

const fcDataLib = h(Participant, {
  logo: { src: broadLogo, alt: 'Broad logo', height: '40%' },
  title: 'FireCloud Dataset Library',
  description: `Search for datasets sequenced at the Broad Institute, or public datasets hosted at the Broad. Datasets
   are pre-loaded as workspaces. You can clone these, or copy data into the workspace of your choice.`,
  sizeText: h(TooltipTrigger, { content: 'As of October 2018' }, [span('Samples: > 158,629')])
}, [
  buttonPrimary({
    as: 'a',
    href: `${firecloudRoot}/#library`,
    target: '_blank',
    tooltip: 'Search for dataset workspaces'
  }, ['Browse Datasets'])
])


const BrowseData = pure(() => {
  return h(Fragment, [
    h(TopBar, { title: 'Library' }), // TODO Add breadcrumbs from design once home page exists
    h(PageFadeBox, [
      div([
        div({ style: styles.header }, ['Data Library']),
        div({ style: styles.content }, [
          nhs, hca, amppd, topMed, gtex, fcDataLib
        ])
      ])
    ])
  ])
})


export const addNavPaths = () => {
  Nav.defPath('browse-data', {
    path: '/browse-data',
    component: BrowseData,
    title: 'Browse Data'
  })
}
