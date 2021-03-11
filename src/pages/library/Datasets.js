import { Fragment, useState } from 'react'
import { b, div, h, img, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { libraryTopMatter } from 'src/components/library-common'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import thousandGenomesAnvil from 'src/images/library/datasets/1000Genome-Anvil-logo.png'
import thousandGenomesLogo from 'src/images/library/datasets/1000Genome-logo.png'
import amppdLogo from 'src/images/library/datasets/AMPPD-logo.png'
import anvilLogo from 'src/images/library/datasets/Anvil-logo.svg'
import baselineLogo from 'src/images/library/datasets/baseline.jpg'
import broadLogo from 'src/images/library/datasets/broad_logo.png'
import encodeLogo from 'src/images/library/datasets/ENCODE@2x.png'
import framinghamLogo from 'src/images/library/datasets/framingham.jpg'
import hcaLogo from 'src/images/library/datasets/HCA@2x.png'
import nemoLogo from 'src/images/library/datasets/nemo-logo.svg'
import targetLogo from 'src/images/library/datasets/target_logo.jpeg'
import tcgaLogo from 'src/images/library/datasets/TCGALogo.jpg'
import topMedLogo from 'src/images/library/datasets/TopMed@2x.png'
import ukbLogo from 'src/images/library/datasets/UKB@2x.jpg'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { returnParam } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


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
      fontSize: 20, color: colors.dark()
    },
    description: {
      marginTop: '1rem',
      minHeight: 125
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
    border: `1px solid ${colors.dark(0.55)}`, borderRadius: 5,
    backgroundColor: 'white'
  }
}, [
  img({
    src, alt, role: 'img', height: height || '60%', width: 'auto'
  })
])


const Participant = ({ logo, title, shortDescription, description, sizeText, children }) => {
  const [showingModal, setShowingModal] = useState(false)

  const titleElement = div({ style: styles.participant.title }, [title])

  return div({
    style: styles.participant.container
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      logoBox(logo),
      titleElement,
      div({ style: styles.participant.description }, [
        shortDescription || description,
        shortDescription && h(Link, {
          style: { marginLeft: '0.5rem' },
          onClick: () => setShowingModal(true)
        }, ['READ MORE'])
      ]),
      div({ style: styles.participant.sizeText }, [sizeText]),
      div({ style: { marginTop: '1rem' } }, [children])
    ]),
    showingModal && h(Modal, {
      contentLabel: title,
      onDismiss: () => setShowingModal(false),
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


const browseTooltip = 'Look for the Export to Terra icon to export data from this provider.'


const thousandGenomesHighCoverage = () => h(Participant, {
  logo: { src: thousandGenomesAnvil, alt: '1000 Genomes and AnVIL', height: '55%' },
  title: '1000 Genomes High Coverage presented by NHGRI AnVIL',
  description: '1000 Genomes project phase 3 samples sequenced to 30x coverage. This dataset is delivered as a workspace. You may clone ' +
    'this workspace to run analyses or copy specific samples to a workspace of your choice.',
  sizeText: 'Participants: 2,504'
}, [
  h(ButtonPrimary, {
    href: Nav.getLink('workspace-dashboard', { namespace: 'anvil-datastorage', name: '1000G-high-coverage-2019' }),
    tooltip: 'Visit the workspace'
  }, ['Browse data'])
])

const thousandGenomesLowCoverage = () => h(Participant, {
  logo: { src: thousandGenomesLogo, alt: '1000 Genomes logo', height: '55%' },
  title: '1000 Genomes Low Coverage',
  description: h(Fragment, [
    h(Link, { href: 'http://www.internationalgenome.org/about', ...Utils.newTabLinkProps }, 'The 1000 Genomes Project'),
    ` ran between 2008 and 2015, creating the largest public catalogue of
  human variation and genotype data. The goal of the 1000 Genomes Project was to find most genetic variants
  with frequencies of at least 1% in the populations studied.`
  ]),
  sizeText: 'Participants: 3,500'
}, [
  h(ButtonPrimary, {
    href: Nav.getLink('data-explorer-public', { dataset: '1000 Genomes' }),
    tooltip: browseTooltip,
    'aria-label': 'Browse 1000 Genomes Low Coverage'
  }, ['Browse data'])
])

const amppd = () => h(Participant, {
  logo: { src: amppdLogo, alt: 'AMP-PD logo', height: '100%' },
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
  sizeText: 'Participants: 10,247'
}, [
  h(ButtonPrimary, {
    style: { marginBottom: '1rem' },
    href: Nav.getLink('data-explorer-private', { dataset: 'AMP PD Clinical - 2020_v2release_1218' })
  }, ['Browse Tier 1 Data']),
  h(ButtonPrimary, {
    href: Nav.getLink('data-explorer-private', { dataset: 'AMP PD - 2020_v2release_1218' })
  }, ['Browse Tier 2 Data'])
])

const baseline = () => h(Participant, {
  logo: { src: baselineLogo, alt: `Project Baseline logo`, height: '55%' },
  title: `Baseline Health Study`,
  description: h(Fragment, [
    h(Link, { href: 'https://www.projectbaseline.com/study/project-baseline/', ...Utils.newTabLinkProps }, 'Baseline Health Study'),
    ` is a longitudinal study that will collect broad phenotypic health data
    from approximately 10,000 participants, who will each be followed over the
    course of at least four years. The study is part of a broader effort
    designed to develop a well-defined reference, or “baseline,” of health.`
  ]),
  sizeText: 'Participants: > 2,500'
}, [
  h(ButtonPrimary, {
    href: Nav.getLink('data-explorer-private', { dataset: 'Baseline Health Study' })
  }, ['Browse Data'])
])

const ccdg = () => h(Participant, {
  logo: { src: anvilLogo, alt: 'CCDG logo' },
  title: 'CCDG presented by NHGRI AnVIL',
  description: 'The Centers for Common Disease Genomics (CCDG) are a collaborative large-scale genome sequencing ' +
    'effort to comprehensively identify rare risk and protective variants contributing to multiple common disease phenotypes.',
  sizeText: 'Participants: > 65,000'
}, [
  h(ButtonPrimary, {
    href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}&project=AnVIL CCDG&project=AnVIL CCDG CVD#library`,
    ...Utils.newTabLinkProps,
    tooltip: browseTooltip
  }, ['Browse data'])
])

const cmg = () => h(Participant, {
  logo: { src: anvilLogo, alt: 'CMG logo' },
  title: 'CMG presented by NHGRI AnVIL',
  description: 'The National Human Genome Research Institute funded the Centers for Mendelian Genomics (CMG) with the charge ' +
    'to discover as many genes underlying human Mendelian disorders as possible.',
  sizeText: 'Participants: > 5,000'
}, [
  h(ButtonPrimary, {
    href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}&project=AnVIL CMG#library`,
    ...Utils.newTabLinkProps,
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const encode = () => h(Participant, {
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
  h(ButtonPrimary, {
    href: 'https://broad-gdr-encode.appspot.com/',
    ...Utils.newTabLinkProps,
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const fcDataLib = () => h(Participant, {
  logo: { src: broadLogo, alt: 'Broad logo', height: '40%' },
  title: 'Broad Dataset Workspace Library',
  description: `Search for datasets sequenced at the Broad Institute, or public datasets hosted at the Broad. Datasets
   are pre-loaded as workspaces. You can clone these, or copy data into the workspace of your choice.`,
  sizeText: h(TooltipTrigger, { content: 'As of October 2018' }, [span('Samples: > 158,629')])
}, [
  h(ButtonPrimary, {
    href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#library`,
    ...Utils.newTabLinkProps,
    tooltip: 'Search for dataset workspaces'
  }, ['Browse Datasets'])
])

const framingham = () => h(Participant, {
  logo: { src: framinghamLogo, alt: 'Framingham Heart Study logo', height: '70%' },
  title: 'Framingham Heart Study Teaching Dataset',
  description: h(Fragment, [
    `Since 1948, the `,
    h(Link, { href: 'https://www.framinghamheartstudy.org/', ...Utils.newTabLinkProps }, 'Framingham Heart Study'),
    ` has been committed to identifying the common factors or characteristics that contribute to cardiovascular disease,
    over three generations of participants. This is a `,
    h(Link, { href: 'https://biolincc.nhlbi.nih.gov/teaching/', ...Utils.newTabLinkProps }, 'teaching dataset'),
    ` and may not be used for publication purposes.`
  ]),
  sizeText: 'Participants: 4,400'
}, [
  h(ButtonPrimary, {
    href: Nav.getLink('data-explorer-public', { dataset: 'Framingham Heart Study Teaching Dataset' }),
    tooltip: browseTooltip
  }, ['Browse data'])
])

const hca = () => h(Participant, {
  logo: { src: hcaLogo, alt: 'Human Cell Atlas logo' },
  title: 'Human Cell Atlas',
  description: `The Human Cell Atlas (HCA) is made up of comprehensive reference maps of all human cells — the
  fundamental units of life — as a basis for understanding fundamental human biological processes and diagnosing,
  monitoring, and treating disease.`
}, [
  h(ButtonPrimary, {
    href: 'https://data.humancellatlas.org/explore/projects',
    ...Utils.newTabLinkProps,
    tooltip: 'Look for the Export Selected Data button to export data from this provider.'
  }, ['Browse Data'])
])

const nemo = () => h(Participant, {
  logo: { src: nemoLogo, alt: 'NeMO logo', height: '40%' },
  title: 'Neuroscience Multi-Omic Archive',
  description: `The Neuroscience Multi-Omic (NeMO) Archive is a data repository specifically focused on the
  storage and dissemination of omic data from the BRAIN Initiative and related brain research projects. NeMO
  operates in close partnership with the Broad Single Cell Portal, Terra, and the Brain Cell Data Center (BCDC).`,
  sizeText: h(TooltipTrigger, { content: 'As of March 2019' }, [span('Files: >= 210,000; Projects >= 5; Species >= 3')])
}, [
  h(ButtonPrimary, {
    href: 'http://portal.nemoarchive.org/',
    ...Utils.newTabLinkProps,
    tooltip: 'Look for the Export to Terra option in the Download Cart to export data.'
  }, ['Browse Data'])
])

const target = () => h(Participant, {
  logo: { src: targetLogo, alt: 'TARGET logo', height: '85%' },
  title: `Therapeutically Applicable Research to Generate Effective Treatments (TARGET) presented by the National
  Cancer Institute`,
  description: `The TARGET initiative employed comprehensive molecular characterization to determine the genetic
  changes that drive the initiation and progression of hard-to-treat childhood cancers. TARGET makes the data generated
  available to the research community with a goal to identify therapeutic targets and prognostic markers so that novel,
  more effective treatment strategies can be developed and applied.`,
  sizeText: 'Participants: 1,324'
}, [h(ButtonPrimary, {
  href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}&project=TARGET#library`,
  ...Utils.newTabLinkProps
}, ['Browse Data'])])


const tcga = () => h(Participant, {
  logo: { src: tcgaLogo, alt: 'TCGA logo', height: '80%' },
  title: 'The Cancer Genome Atlas Presented by the National Cancer Institute',
  description: h(Fragment, [
    'The Cancer Genome Atlas (TCGA), a landmark ',
    h(Link, { href: 'https://www.cancer.gov/about-nci/organization/ccg/cancer-genomics-overview', ...Utils.newTabLinkProps }, 'cancer genomics'),
    ` program, molecularly characterized over 20,000 primary cancer and matched normal samples spanning 33 cancer types.
    This joint effort between the National Cancer Institute and the National Human Genome Research Institute began in 2006,
    bringing together researchers from diverse disciplines and multiple institutions.`
  ]),
  sizeText: 'Participants: 11,000'
}, [
  h(ButtonPrimary, {
    href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}&project=TCGA#library`,
    ...Utils.newTabLinkProps
  }, ['Browse Data'])
])

const topMed = () => h(Participant, {
  logo: { src: topMedLogo, alt: 'TopMed logo' },
  title: 'TopMed presented by NHLBI BioData Catalyst',
  description: `Trans-Omics for Precision Medicine (TOPMed), sponsored by the National Institutes of Health's National
  Heart, Lung, and Blood Institute (NHLBI), is a program to generate scientific resources to enhance our understanding
  of fundamental biological processes that underlie heart, lung, blood, and sleep disorders (HLBS).`,
  sizeText: h(TooltipTrigger, { content: 'As of November 2016' }, [span('Participants: > 54,000')])
}, [
  h(ButtonPrimary, {
    href: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer',
    ...Utils.newTabLinkProps,
    tooltip: browseTooltip
  }, ['Browse Data'])
])

const ukb = () => h(Participant, {
  logo: { src: ukbLogo, alt: `UK Biobank logo`, height: '50%' },
  title: `UK Biobank`,
  description: h(Fragment, [
    h(Link, { href: 'https://www.ukbiobank.ac.uk/', ...Utils.newTabLinkProps }, 'UK Biobank'),
    ` is a national and international health resource with unparalleled research opportunities.
    UK Biobank aims to improve the prevention, diagnosis and treatment of a wide range of serious and life-threatening
    illnesses. This Data Explorer is only available to specific early-access users at this time.`
  ]),
  sizeText: 'Participants: > 500,000'
}, [
  h(ButtonPrimary, {
    href: Nav.getLink('data-explorer-private', { dataset: 'UK Biobank' })
  }, ['Browse Data'])
])


const Datasets = () => {
  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('datasets'),
    div({ role: 'main', style: styles.content }, [
      // Put datasets in alphabetical order
      thousandGenomesHighCoverage(), thousandGenomesLowCoverage(), amppd(), baseline(), ccdg(), cmg(), encode(), fcDataLib(), framingham(), hca(),
      nemo(), target(), tcga(), topMed(), ukb()
    ])
  ])
}


export const navPaths = [
  {
    name: 'library-datasets',
    path: '/library/datasets',
    component: Datasets,
    public: true,
    title: 'Datasets'
  }
]
