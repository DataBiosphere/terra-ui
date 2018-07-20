import { Fragment } from 'react'
import { div, h, img, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, link } from 'src/components/common'
import { InfoBox } from 'src/components/PopupTrigger'
import { TopBar } from 'src/components/TopBar'
import amppdLogo from 'src/images/browse-data/Amp@2x.png'
import cancerCell from 'src/images/browse-data/browse-data-cancer-cell.jpg'
import gtexLogo from 'src/images/browse-data/GTeX@2x.png'
import hcaLogo from 'src/images/browse-data/HCA@2x.png'
import nhsLogo from 'src/images/browse-data/NHS@2x.png'
import topMedLogo from 'src/images/browse-data/TopMed@2x.png'
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
      fontSize: 20, marginBottom: '0.25rem',
      color: Style.colors.secondary
    }
  }
}


const FadeBox = ({
  padding = '1.5rem',
  backgroundColor = Style.colors.background,
  borderColor = Style.colors.textFaded,
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
    }, [
      children
    ])
  ])
}


const logoBox = ({ src, alt }) => div({
  style: {
    display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
    flex: 'none',
    height: 200, width: 450,
    border: `1px solid ${Style.colors.border}`, borderRadius: 5,
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


const participantControls = (text, ...others) => {
  return div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
    span({ style: { width: 200, flex: 'none' } }, [text]),
    ...others,
    h(InfoBox, { style: { marginLeft: '1rem' }, position: 'bottom' }, [
      div(['Look for the Export to Saturn icon to export data from this provider. ']),
      link({}, ['Learn more.'])
    ])
  ])
}


const loremIpsum = 'Esse molestie consequat vel illum dolore eut nulla facilisis at vero eros et. Ea commodo consequat duis autem vel eum iriure dolo. Aliquip ex ea commodo consequat duis autem vel eum iriure dolor in hendrerit. Assum typi non habent claritatem insitam est usus legentis in iis.'


const BrowseData = pure(() => {
  return h(Fragment, [
    h(TopBar, {}, []),
    div({ style: styles.top.container }, [
      div({ style: styles.top.title }, ['Saturn']),
      div({ style: styles.top.summary }, ['Browse Data from the largest biomedical research agencies in the world.']),
      div({ style: styles.top.details }, ['Over 2,300,000 participants']),
      div({ style: styles.top.details }, ['Over 257,000 cells'])
    ]),
    div({ style: styles.banner.container }, [
      div({ style: styles.banner.textContainer }, [
        div({ style: styles.banner.title }, ['The next generation of research:']),
        div({ style: styles.banner.details }, ['Launch WDL-based workflows from our participating partners into Saturn.'])
      ]),
      h(Clickable, {
        style: {
          textTransform: 'uppercase', fontWeight: 500,
          padding: '1rem 1.5rem',
          border: '1px solid',
          borderRadius: 5
        },
        hover: {
          backgroundColor: Style.colors.primary,
          borderColor: Style.colors.primary
        }
      }, ['Learn How'])
    ]),
    div({ style: styles.content.container }, [
      div({ style: styles.content.header }, ['Participating Research Databases']),
      h(Participant, { logoBox: logoBox({ src: nhsLogo, alt: 'Nurses\' Health Study logo' }) }, [
        div({ style: styles.content.title }, ['Nurses\' Health Study']),
        div({}, [loremIpsum]),
        participantControls('Participants: 153,567', buttonPrimary({}, ['Browse Data']))
      ]),
      h(Participant, { logoBox: logoBox({ src: hcaLogo, alt: 'Human Cell Atlas logo' }) }, [
        div({ style: styles.content.title }, ['Human Cell Atlas']),
        div({}, [loremIpsum]),
        participantControls('Cells: 257,560', buttonPrimary({}, ['Browse Data']))
      ]),
      h(Participant, { logoBox: logoBox({ src: amppdLogo, alt: 'AMP-PD logo' }) }, [
        div({ style: styles.content.title }, ['AMP-PD']),
        div({}, [loremIpsum]),
        participantControls('Participants: 1,901,421', buttonPrimary({}, ['Browse Data']))
      ]),
      h(Participant, { logoBox: logoBox({ src: topMedLogo, alt: 'TopMed logo' }) }, [
        div({ style: styles.content.title }, ['TopMed presented by NIH Commons']),
        div({}, [loremIpsum]),
        participantControls(
          'Participants: 739,958',
          div({ style: { display: 'inline-flex', flexWrap: 'wrap' } }, [
            buttonPrimary({ style: { margin: '0.25rem 1rem 0.25rem 0', width: 303 } }, ['Browse Data via Windmill']),
            buttonPrimary({ style: { margin: '0.25rem 0', width: 303 } }, ['Browse Data via Boardwalk'])
          ]),
        )
      ]),
      h(Participant, { logoBox: logoBox({ src: gtexLogo, alt: 'GTEx logo' }) }, [
        div({ style: styles.content.title }, ['GTEx presented by NIH Commons']),
        div({}, [loremIpsum]),
        participantControls(
          'Participants: 739,958',
          div({ style: { display: 'inline-flex', flexWrap: 'wrap' } }, [
            buttonPrimary({ style: { margin: '0.25rem 1rem 0.25rem 0', width: 303 } }, ['Browse Data via Windmill']),
            buttonPrimary({ style: { margin: '0.25rem 0', width: 303 } }, ['Browse Data via Boardwalk'])
          ]),
        )
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
