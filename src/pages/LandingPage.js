import { div, h, img } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { linkButton } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import TopBar from 'src/components/TopBar'
import hexBackgroundPattern from 'src/images/hex-background-pattern.svg'
import hexButton from 'src/images/hex-button.svg'
import landingPageHero from 'src/images/landing-page-hero.png'
import textFrame from 'src/images/text-frame.svg'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


const hexLink = (description, label, href) => div({
  style: {
    height: 146, display: 'flex', alignItems: 'center',
    backgroundImage: `url(${textFrame})`, backgroundRepeat: 'no-repeat', backgroundSize: 'contain'
  }
}, [
  div({ style: { paddingLeft: '1.5rem', whiteSpace: 'pre' } }, description),
  linkButton({
    href,
    style: {
      display: 'flex', alignItems: 'center',
      height: 120, width: 100, marginLeft: '1rem',
      backgroundImage: `url(${hexButton})`, backgroundRepeat: 'no-repeat', backgroundSize: 'contain'
    }
  }, [
    div({ style: { whiteSpace: 'pre', color: 'white', marginLeft: '1rem', marginTop: -7, fontSize: 15 } }, label)
  ])
])


const LandingPage = pure(() => {
  return h(FooterWrapper, [
    h(TopBar),
    div({
      style: {
        flexGrow: 1,
        color: colors.gray[0],
        padding: '3rem 5rem',
        backgroundImage: `url(${hexBackgroundPattern})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right -75px top -110px'
      }
    }, [
      img({ src: landingPageHero, style: { position: 'absolute', right: 0, top: 60 } }),
      div({ style: { fontSize: 22 } }, 'Welcome to'),
      div({ style: { fontSize: 85 } }, 'Terra'),
      hexLink('Access data from a rich ecosystem\nof Terra-connected data portals', 'Browse\nData', Nav.getLink('browse-data')),
      div({ style: { margin: '-0.5rem 0 -0.5rem 3rem' } }, [
        hexLink('Find ready-for-use bioinformatics workflows\nfrom the Dockstore workflow repository', 'Explore\nTools',
          'https://dockstore.org/search?descriptorType=wdl&searchMode=files')
      ]),
      hexLink(
        'Terra Workspaces connect your data to\npopular analysis tools powered by the\ncloud. Use Workspaces to share data,\ncode, and results easily and securely',
        'Analyze\n& Publish', Nav.getLink('workspaces'))
    ])
  ])
})


export const addNavPaths = () => {
  Nav.defPath('root', {
    path: '/',
    component: LandingPage,
    public: true
  })
}
