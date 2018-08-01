import { Fragment } from 'react'
import { div, h, img, p, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, link } from 'src/components/common'
import { InfoBox } from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { TopBar } from 'src/components/TopBar'
import amppdLogo from 'src/images/browse-data/Amp@2x.png'
import cancerCell from 'src/images/browse-data/browse-data-cancer-cell.jpg'
import gtexLogo from 'src/images/browse-data/GTeX@2x.png'
import hcaLogo from 'src/images/browse-data/HCA@2x.png'
import nhsLogo from 'src/images/browse-data/NHS@2x.png'
import topMedLogo from 'src/images/browse-data/TopMed@2x.png'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


const sideMargin = '5rem'

const styles = {
  top: {
    container: {
      height: 490,
      backgroundImage: `url(${cancerCell})`,
      backgroundRepeat: 'no-repeat', backgroundSize: '1800px', backgroundPosition: 'right -120px top -95px',
      backgroundColor: 'black', color: 'white',
      padding: `7.5rem 0 0 ${sideMargin}`
    },
    title: {
      textTransform: 'uppercase',
      fontSize: 16, fontWeight: 500
    },
    summary: {
      fontSize: 40, fontWeight: 500, lineHeight: '52px',
      width: 600, margin: '0.5rem 0 3rem'
    },
    details: {
      fontSize: 16, textTransform: 'uppercase'
    }
  },
  banner: {
    container: {
      display: 'flex', alignItems: 'center',
      backgroundColor: '#170e43', color: 'white',
      padding: `1.5rem ${sideMargin}`
    },
    textContainer: {
      flex: 1
    },
    title: {
      fontSize: 24, fontWeight: 500
    },
    details: {
      fontSize: 24
    },
    buttonContainer: {
      flex: 'none'
    }
  },
  content: {
    container: {
      padding: `3rem ${sideMargin}`
    },
    header: {
      ...Style.elements.sectionHeader, textTransform: 'uppercase'
    },
    title: {
      fontSize: 20, color: colors.primary[0]
    }
  }
}


const FadeBox = ({
  padding = '1.5rem',
  backgroundColor = colors.text[5],
  borderColor = colors.text[2],
  fadePoint = '60%',
  children
}) => {
  return div({
    style: {
      background: `linear-gradient(to bottom, white 0%, ${backgroundColor} ${fadePoint}`,
      borderRadius: '8px 8px 0 0',
      margin: `${padding} -${padding}`
    }
  }, [
    div({
      style: {
        height: padding,
        border: `1px solid ${borderColor}`,
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0'
      }
    }),
    div({
      style: {
        padding: `0 ${padding} ${padding}`,
        borderWidth: 1,
        borderStyle: 'solid',
        borderImage: `linear-gradient(to bottom, ${borderColor}, ${backgroundColor} ${fadePoint}) 1 100%`,
        borderTop: 'none',
        borderBottom: 'none'
      }
    }, [children])
  ])
}


const logoBox = ({ src, alt }) => div({
  style: {
    display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
    flex: 'none',
    height: 200, width: 450,
    border: `1px solid ${colors.text[3]}`, borderRadius: 5,
    backgroundColor: 'white'
  }
}, [
  img({
    src, alt, height: '60%', width: 'auto'
  })
])


const Participant = ({ logoBox, children }) => h(FadeBox, [
  div({ style: { display: 'flex' } }, [
    logoBox,
    div({ style: { flex: 1, margin: '1rem 0 0 4rem' } }, [children])
  ])
])


const ParticipantControls = ({ size, helpLink, children }) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    div({ style: { width: 200, flex: 'none' } }, [size || '']),
    children,
    h(InfoBox, { style: { marginLeft: '1rem' }, position: 'bottom', size: 20 }, [
      div(['Look for the Export to Saturn icon to export data from this provider. ']),
      // not used yet:
      helpLink && link({
        href: helpLink,
        target: '_blank'
      }, ['Learn more.'])
    ])
  ])
}


const NIHCommonsButtons = div({ style: { display: 'flex', flexDirection: 'column' } }, [
  buttonPrimary({
    style: { margin: '0.25rem 0' },
    as: 'a',
    href: 'https://dcp.bionimbus.org/',
    target: '_blank'
  }, ['Browse Data via Windmill']),
  buttonPrimary({
    style: { margin: '0.25rem 0' },
    as: 'a',
    href: 'https://commons.ucsc-cgp.org/boardwalk',
    target: '_blank'
  }, ['Browse Data via Boardwalk'])
])


const BrowseData = pure(() => {
  return h(Fragment, [
    h(TopBar, {}, []),
    div({ style: styles.top.container }, [
      div({ style: styles.top.title }, ['Saturn']),
      div({ style: styles.top.summary }, ['Browse Data from the largest biomedical research agencies in the world.'])
      /*
       * Need real numbers
       * div({ style: styles.top.details }, ['Over 2,300,000 participants']),
       * div({ style: styles.top.details }, ['Over 257,000 cells'])
       */
    ]),
    div({ style: styles.banner.container }, [
      div({ style: styles.banner.textContainer }, [
        div({ style: styles.banner.title }, ['The next generation of research:']),
        div({ style: styles.banner.details }, ['Aggregate data from our participating partners into Saturn'])
      ]),
      h(Clickable, {
        disabled: true,
        tooltip: 'Documentation coming soon',
        style: {
          textTransform: 'uppercase', fontWeight: 500,
          padding: '1rem 1.5rem',
          border: '1px solid',
          borderRadius: 5
        },
        hover: {
          backgroundColor: colors.primary[1],
          borderColor: colors.primary[1]
        }
      }, ['Learn How'])
    ]),
    div({ style: styles.content.container }, [
      div({ style: styles.content.header }, ['Participating Research Databases']),
      h(Participant, { logoBox: logoBox({ src: nhsLogo, alt: 'Nurses\' Health Study logo' }) }, [
        div({ style: styles.content.title }, ['Nurses\' Health Study']),
        p([`The Nurses' Health Study and Nurses' Health Study II are among the largest investigations into the risk
            factors for major chronic diseases in women.`]),
        h(ParticipantControls, { size: 'Participants: > 280,000' }, [
          buttonPrimary({
            disabled: true,
            tooltip: 'NHS not yet in production'
          }, ['Browse Data'])
        ])
      ]),
      h(Participant, { logoBox: logoBox({ src: hcaLogo, alt: 'Human Cell Atlas logo' }) }, [
        div({ style: styles.content.title }, ['Human Cell Atlas']),
        p([`The Human Cell Atlas (HCA) is made up of comprehensive reference maps of all human cells — the fundamental
            units of life — as a basis for understanding fundamental human biological processes and diagnosing,
            monitoring, and treating disease.`]),
        h(ParticipantControls, [
          buttonPrimary({
            disabled: true,
            tooltip: 'HCA not yet in production'
          }, ['Browse Data'])
        ])
      ]),
      h(Participant, { logoBox: logoBox({ src: amppdLogo, alt: 'AMP-PD logo' }) }, [
        div({ style: styles.content.title }, ['AMP Parkinson\'s Disease']),
        p([`The Accelerating Medicines Partnership (AMP) is a public-private partnership between the National
            Institutes of Health (NIH), multiple biopharmaceutical and life sciences companies, and non-profit
            organizations to identify and validate the most promising biological targets for therapeutics. This AMP
            effort aims to identify and validate the most promising biological targets for therapeutics relevant to
            Parkinson's disease.`]),
        p(['Includes data from the following studies:']),
        div({ style: { margin: '0.4rem 0', fontWeight: 500, lineHeight: '150%' } }, [
          div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
            div({ style: { width: 410 } }, ['• Parkinson\'s Disease Biomarkers Program (PDBP)']),
            div(['• BioFIND'])
          ]),
          div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
            div({ style: { width: 410 } }, ['• Parkinson\'s Progression Markers Initiative (PPMI)']),
            div(['• Harvard Biomarkers Study (HBS)'])
          ])
        ]),
        h(ParticipantControls, { size: 'Participants: > 4,700' }, [
          buttonPrimary({
            as: 'a',
            href: 'http://amp-pd-data-explorer.appspot.com/',
            target: '_blank'
          }, ['Browse Data'])
        ])
      ]),
      h(Participant, { logoBox: logoBox({ src: topMedLogo, alt: 'TopMed logo' }) }, [
        div({ style: styles.content.title }, ['TopMed presented by NIH Commons']),
        p([`Trans-Omics for Precision Medicine (TOPMed), sponsored by the National Institutes of Health's National
            Heart, Lung, and Blood Institute (NHLBI), is a program to generate scientific resources to enhance our
            understanding of fundamental biological processes that underlie heart, lung, blood, and sleep disorders
            (HLBS)`]),
        h(ParticipantControls, { size: h(TooltipTrigger, { content: 'As of November 2016' }, [span('Participants: > 54,000')]) }, [
          NIHCommonsButtons
        ])
      ]),
      h(Participant, { logoBox: logoBox({ src: gtexLogo, alt: 'GTEx logo' }) }, [
        div({ style: styles.content.title }, ['GTEx presented by NIH Commons']),
        p([`The Genotype-Tissue Expression (GTEx) Program established a data resource and tissue bank to study the
            relationship between genetic variation and gene expression in multiple human tissues.`]),
        h(ParticipantControls, { size: h(TooltipTrigger, { content: 'As of release V7' }, [span('Samples: > 11,688')]) }, [
          NIHCommonsButtons
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
