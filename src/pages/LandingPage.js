import { div, h, img, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { Clickable, link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import hexBackgroundPattern from 'src/images/hex-background-pattern.svg'
import hexButton from 'src/images/hex-button.svg'
import landingPageHero from 'src/images/landing-page-hero.png'
import colors from 'src/libs/colors'
import { isFirecloud } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


const styles = {
  heavy: { fontWeight: 600 }
}

const makeCard = (link, title, body) => h(Clickable, {
  as: 'a',
  href: Nav.getLink(link),
  style: { ...Style.elements.card.container, height: 245, width: 225, marginRight: '1rem', justifyContent: undefined },
  hover: { boxShadow: '0 3px 7px 0 rgba(0,0,0,0.5), 0 5px 3px 0 rgba(0,0,0,0.2)' }
}, [
  div({ style: { color: colors.green[0], fontSize: 18, fontWeight: 500, lineHeight: '22px', marginBottom: '0.5rem' } }, title),
  div({ style: { lineHeight: '22px' } }, body),
  div({ style: { flexGrow: 1 } }),
  div({
    style: {
      height: 31, width: 27,
      display: 'flex', alignItems: 'center', alignSelf: 'flex-end', justifyContent: 'center',
      backgroundImage: `url(${hexButton})`, backgroundRepeat: 'no-repeat', backgroundSize: 'contain'
    }
  }, [
    icon('arrowRight', { style: { color: 'white' } })
  ])
])

const LandingPage = pure(() => {
  return h(FooterWrapper, [
    h(TopBar),
    div({
      style: {
        flex: '1 0 700px',
        color: colors.gray[0],
        padding: '3rem 5rem',
        backgroundImage: `url(${hexBackgroundPattern})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right -5rem top -2rem'
      }
    }, [
      img({ src: landingPageHero, style: { position: 'absolute', right: 0, top: 80 } }),
      div({ style: { fontSize: 54, color: colors.green[0] } }, `Welcome to ${getAppName()}`),
      div({ style: { fontSize: 20, color: colors.gray[0], marginTop: '1rem' } }, [
        div(`${getAppName()} is a cloud-native platform for biomedical`),
        div(['researchers to access ', span({ style: styles.heavy }, 'data'), ', run analysis ', span({ style: styles.heavy }, 'tools'), ',']),
        div(['and', span({ style: styles.heavy }, ' collaborate'), '.'])
      ]),
      isFirecloud() && link({
        href: 'https://broadinstitute.zendesk.com/hc/en-us/articles/360022694271-Side-by-side-comparison-with-Terra',
        target: 'blank',
        style: { margin: '1rem 0', fontSize: 18, display: 'inline-flex', alignItems: 'center' }
      }, ['Already a FireCloud user? Learn what\'s new in Terra.', icon('pop-out', { size: 18, style: { marginLeft: '0.5rem' } })]),
      div({
        style: { display: 'flex', margin: '1rem 0', position: 'relative' } // positioned to keep it above hero bg
      }, [
        makeCard('workspaces', 'View Workspaces', [
          `${getAppName()} Workspaces connect your data to popular analysis tools powered by the cloud. `,
          'Use Workspaces to share data, code, and results easily and securely.'
        ]),
        makeCard('library-showcase', 'View Examples', `Browse our gallery of showcase workspaces to see how science gets done on ${getAppName()}.`),
        makeCard('library-datasets', 'Browse Data', `Access data from a rich ecosystem of ${getAppName()}-connected data portals.`)
      ])
    ])
  ])
})


export const navPaths = [
  {
    name: 'root',
    path: '/',
    component: LandingPage,
    public: true
  }
]
