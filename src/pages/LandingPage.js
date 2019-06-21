import { div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { Clickable, iconButton, link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import landingPageHero from 'src/images/landing-page-hero.jpg'
import colors from 'src/libs/colors'
import { isFirecloud, isTerra } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  heavy: { fontWeight: 600 },
  nowrap: { whiteSpace: 'nowrap' }
}

const makeDocLink = (href, title) => link({
  href,
  ...Utils.newTabLinkProps,
  style: { marginBottom: '1rem', fontSize: 18, display: 'inline-flex', alignItems: 'center' }
}, [
  title,
  icon('pop-out', { size: 18, style: { marginLeft: '0.5rem' } })
])


const makeCard = (link, title, body) => h(Clickable, {
  as: 'a',
  href: Nav.getLink(link),
  style: { ...Style.elements.card.container, height: 245, width: 225, marginRight: '1rem', justifyContent: undefined },
  hover: { boxShadow: '0 3px 7px 0 rgba(0,0,0,0.5), 0 5px 3px 0 rgba(0,0,0,0.2)' }
}, [
  div({ style: { color: colors.accent(), fontSize: 18, fontWeight: 500, lineHeight: '22px', marginBottom: '0.5rem' } }, title),
  div({ style: { lineHeight: '22px' } }, body),
  div({ style: { flexGrow: 1 } }),
  iconButton('arrowRight', { size: 30, style: { alignSelf: 'flex-end' } })
])

const LandingPage = pure(() => {
  return h(FooterWrapper, [
    h(TopBar),
    div({
      style: {
        flexGrow: 1,
        color: colors.dark(),
        padding: '3rem 5rem',
        backgroundImage: `url(${landingPageHero})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0 top 0'
      }
    }, [
      div({ style: { fontSize: 54 } }, `Welcome to ${getAppName()}`),
      div({ style: { fontSize: 20, lineHeight: '28px', margin: '1rem 0', width: 575 } }, [
        `${getAppName(true)} is a ${isTerra() ? 'cloud-native platform' : 'project supported by Terra'} for biomedical researchers to `,
        span({ style: { ...styles.heavy, ...styles.nowrap } }, 'access data'), ', ',
        span({ style: { ...styles.heavy, ...styles.nowrap } }, 'run analysis tools'), ', ',
        span({ style: styles.nowrap }, ['and', span({ style: styles.heavy }, ' collaborate'), '.'])
      ]),
      div([makeDocLink('https://support.terra.bio/hc/en-us', 'Find how-to\'s, documentation, video tutorials, and discussion forums')]),
      isFirecloud() && makeDocLink('https://support.terra.bio/hc/en-us/articles/360022694271',
        'Already a FireCloud user? Learn what\'s new in Terra.'),
      div({
        style: { display: 'flex', margin: '1rem 0' }
      }, [
        makeCard('workspaces', 'View Workspaces', [
          'Workspaces connect your data to popular analysis tools powered by the cloud. Use Workspaces to share data, code, and results easily and securely.'
        ]),
        makeCard('library-showcase', 'View Examples', 'Browse our gallery of showcase Workspaces to see how science gets done on Terra.'),
        makeCard('library-datasets', 'Browse Data', 'Access data from a rich ecosystem of Terra-connected data portals.')
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
