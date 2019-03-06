import { Children, cloneElement, Fragment } from 'react'
import { b, div, h, img, p, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, link } from 'src/components/common'
import { libraryTopMatter } from 'src/components/library-common'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import amppdLogo from 'src/images/library/datasets/Amp@2x.png'
import baselineLogo from 'src/images/library/datasets/baseline.jpg'
import broadLogo from 'src/images/library/datasets/broad_logo.png'
import encodeLogo from 'src/images/library/datasets/ENCODE@2x.png'
import gtexLogo from 'src/images/library/datasets/GTeX@2x.png'
import hcaLogo from 'src/images/library/datasets/HCA@2x.png'
import nhsLogo from 'src/images/library/datasets/NHS@2x.png'
import thousandGenomesLogo from 'src/images/library/datasets/thousandgenomes.png'
import topMedLogo from 'src/images/library/datasets/TopMed@2x.png'
import ukbLogo from 'src/images/library/datasets/UKB@2x.jpg'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    ...Style.elements.sectionHeader, textTransform: 'uppercase'
  },
  content: {
    display: 'flex', flexWrap: 'wrap', margin: '2.5rem'
  },
  participant: {
    container: {
      margin: '0 4rem 5rem 0', width: 350
    },
    title: {
      marginTop: '1rem',
      fontSize: 20, color: colors.gray[0]
    },
    description: {
      marginTop: '1rem',
      height: 125
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
    const { logo, title, shortDescription, description, sizeText, children, isFirecloud } = this.props
    const { showingModal } = this.state
    const child = Children.only(children)

    const titleElement = div({ style: styles.participant.title }, [title])

    return div({
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
        div({ style: { marginTop: '1rem' } }, [
          isFirecloud ?
            cloneElement(child, { href: getConfig().firecloudUrlRoot + child.props.href }) :
            children
        ])
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


const browseTooltip = 'Look for the Export to Terra icon to export data from this provider.'


const NIHCommonsButtons = buttonPrimary({
  style: { margin: '0.25rem 0' },
  as: 'a',
  href: 'https://dcp.bionimbus.org/',
  target: '_blank',
  tooltip: browseTooltip
}, ['Browse Data via Windmill'])

const thousandGenomes = h(Participant, {
  logo: { src: thousandGenomesLogo, alt: '1000 Genomes logo' },
  title: '1000 Genomes',
  description: h(Fragment, [
    link({ href: 'http://www.internationalgenome.org/about', target: '_blank' }, 'The 1000 Genomes Project'),
    ` ran between 2008 and 2015, creating the largest public catalogue of 
  human variation and genotype data. The goal of the 1000 Genomes Project was to find most genetic variants 
  with frequencies of at least 1% in the populations studied.`
  ]),
  sizeText: 'Participants: 3,500'
}, [
  buttonPrimary({
    as: 'a',
    href: 'https://test-data-explorer.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse data'])
])

const amppd = h(Participant, {
  logo: { src: amppdLogo, alt: 'AMP-PD logo' },
  title: `AMP Parkinson's Disease`,
  shortDescription: `The Accelerating Medicines Partnership (AMP) is a public-private partnership between the National
  Institutes of Health (NIH), multiple biopharmaceutical and life sciences companies, and non-profit organizations to
  identify...`,
  description: h(Fragment, [
    p([
      `The Accelerating Medicines Partnership (AMP) is a public-private partnership between the National Institutes of
    Health (NIH), multiple biopharmaceutical and life sciences companies, and non-profit organizations to identify and
    validate the most promising biological targets for therapeutics. This AMP effort aims to identify and validate the
    most promising biological targets for therapeutics relevant to Parkinson's disease.`
    ]),
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

const baseline = h(Participant, {
  logo: { src: baselineLogo, alt: `Project Baseline logo`, height: '55%' },
  title: `Baseline Health Study`,
  description: h(Fragment, [
    link({ href: 'https://www.projectbaseline.com/', target: '_blank' }, 'Baseline Health Study'),
    ` is a longitudinal study that will collect broad phenotypic health data
    from approximately 10,000 participants, who will each be followed over the
    course of at least four years. The study is part of a broader effort
    designed to develop a well-defined reference, or “baseline,” of health.`
  ]),
  sizeText: 'Participants: > 1,500'
}, [
  buttonPrimary({
    as: 'a',
    href: 'https://baseline-baseline-explorer.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const encode = h(Participant, {
  logo: { src: encodeLogo, alt: `ENCODE Project logo` },
  title: `ENCODE Project`,
  description: h(Fragment, [
    `The `, b('Enc'), `yclopedia `, b('O'), `f `, b('D'), `NA `, b('E'), `lements (ENCODE) 
    project aims to delineate all functional elements encoded in the human genome. To this end, ENCODE has 
    systematically mapped regions of transcription, transcription factor association, chromatin structure 
    and histone modification.`
  ]),
  sizeText: 'Donors: > 650 ; Files: > 158,000'
}, [
  buttonPrimary({
    as: 'a',
    href: 'https://broad-gdr-encode.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const fcDataLib = h(Participant, {
  isFirecloud: true,
  logo: { src: broadLogo, alt: 'Broad logo', height: '40%' },
  title: 'FireCloud Dataset Library',
  description: `Search for datasets sequenced at the Broad Institute, or public datasets hosted at the Broad. Datasets
   are pre-loaded as workspaces. You can clone these, or copy data into the workspace of your choice.`,
  sizeText: h(TooltipTrigger, { content: 'As of October 2018' }, [span('Samples: > 158,629')])
}, [
  buttonPrimary({
    as: 'a',
    href: `/?return=terra#library`,
    target: '_blank',
    tooltip: 'Search for dataset workspaces'
  }, ['Browse Datasets'])
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

const nhs = h(Participant, {
  logo: { src: nhsLogo, alt: `Nurses' Health Study logo` },
  title: `Nurses' Health Study`,
  description: `The Nurses' Health Study and Nurses' Health Study II are among the largest investigations into the risk
  factors for major chronic diseases in women.`,
  sizeText: 'Participants: > 120,000'
}, [
  buttonPrimary({
    as: 'a',
    href: 'http://nhs-explorer.appspot.com/',
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

const ukb = h(Participant, {
  logo: { src: ukbLogo, alt: `UK Biobank logo`, height: '50%' },
  title: `UK Biobank`,
  description: h(Fragment, [
    link({ href: 'https://www.ukbiobank.ac.uk/', target: '_blank' }, 'UK Biobank'),
    ` is a national and international health resource with unparalleled research opportunities,
    open to bona fide health researchers. UK Biobank aims to improve the prevention, diagnosis and treatment of a wide
    range of serious and life-threatening illnesses`
  ]),
  sizeText: 'Participants: > 500,000'
}, [
  buttonPrimary({
    as: 'a',
    href: 'https://biobank-explorer.appspot.com/',
    target: '_blank',
    tooltip: browseTooltip
  }, ['Browse Data'])
])


const Datasets = pure(() => {
  return h(Fragment, [
    libraryTopMatter('datasets'),
    div({ style: styles.content }, [
      // Put datasets in alphabetical order
      thousandGenomes, amppd, baseline, encode, fcDataLib, gtex, hca, nhs, topMed, ukb
    ])
  ])
})


export const addNavPaths = () => {
  Nav.defPath('library-datasets', {
    path: '/library/datasets',
    component: Datasets,
    public: true,
    title: 'Datasets'
  })
}
